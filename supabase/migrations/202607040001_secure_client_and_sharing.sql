create extension if not exists pgcrypto with schema extensions;

alter table public.shared_snapshots
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

do $$
declare
  auth_user_count integer;
  only_user_id uuid;
begin
  select count(*), (array_agg(id))[1]
  into auth_user_count, only_user_id
  from auth.users;

  if auth_user_count = 1 then
    update public.shared_snapshots
    set user_id = only_user_id
    where user_id is null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shared_snapshots_user_id_required'
      and conrelid = 'public.shared_snapshots'::regclass
  ) then
    alter table public.shared_snapshots
      add constraint shared_snapshots_user_id_required
      check (user_id is not null) not valid;
  end if;
end
$$;

create index if not exists ifa_clients_user_id_idx
  on public.ifa_clients(user_id);

create index if not exists shared_snapshots_user_id_idx
  on public.shared_snapshots(user_id);

alter table public.ifa_clients enable row level security;
alter table public.shared_snapshots enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('ifa_clients', 'shared_snapshots')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$$;

create policy "ifa clients select own"
  on public.ifa_clients
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "ifa clients insert own"
  on public.ifa_clients
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "ifa clients update own"
  on public.ifa_clients
  for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "ifa clients delete own"
  on public.ifa_clients
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "shared snapshots select own"
  on public.shared_snapshots
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "shared snapshots delete own"
  on public.shared_snapshots
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

revoke all on table public.ifa_clients from anon, authenticated;
grant select, insert, update, delete on table public.ifa_clients to authenticated;

revoke all on table public.shared_snapshots from anon, authenticated;
grant select, delete on table public.shared_snapshots to authenticated;

create or replace function public.create_shared_snapshot(
  p_snapshot_data jsonb,
  p_visible_modules jsonb,
  p_password text,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if length(p_password) < 8 then
    raise exception 'password must contain at least 8 characters' using errcode = '22023';
  end if;

  insert into public.shared_snapshots (
    user_id,
    snapshot_data,
    visible_modules,
    password_hash,
    expires_at
  ) values (
    (select auth.uid()),
    p_snapshot_data,
    p_visible_modules,
    extensions.crypt(p_password, extensions.gen_salt('bf', 12)),
    p_expires_at
  )
  returning id into new_id;

  return new_id;
end
$$;

create or replace function public.update_shared_snapshot(
  p_id uuid,
  p_snapshot_data jsonb,
  p_visible_modules jsonb,
  p_password text default null,
  p_expires_at timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_password is not null and length(p_password) < 8 then
    raise exception 'password must contain at least 8 characters' using errcode = '22023';
  end if;

  update public.shared_snapshots
  set snapshot_data = p_snapshot_data,
      visible_modules = p_visible_modules,
      password_hash = case
        when p_password is null then password_hash
        else extensions.crypt(p_password, extensions.gen_salt('bf', 12))
      end,
      expires_at = p_expires_at
  where id = p_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'shared snapshot not found' using errcode = 'P0002';
  end if;
  return true;
end
$$;

create or replace function public.revoke_shared_snapshot(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  delete from public.shared_snapshots
  where id = p_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'shared snapshot not found' using errcode = 'P0002';
  end if;
  return true;
end
$$;

create or replace function public.verify_shared_snapshot(
  p_id uuid,
  p_password text
)
returns table (
  snapshot_data jsonb,
  visible_modules jsonb
)
language sql
security definer
set search_path = ''
as $$
  select snapshot.snapshot_data, snapshot.visible_modules
  from public.shared_snapshots as snapshot
  where snapshot.id = p_id
    and (snapshot.expires_at is null or snapshot.expires_at > now())
    and extensions.crypt(p_password, snapshot.password_hash) = snapshot.password_hash
  limit 1;
$$;

revoke all on function public.create_shared_snapshot(jsonb, jsonb, text, timestamptz) from public;
revoke all on function public.update_shared_snapshot(uuid, jsonb, jsonb, text, timestamptz) from public;
revoke all on function public.revoke_shared_snapshot(uuid) from public;
revoke all on function public.verify_shared_snapshot(uuid, text) from public;

grant execute on function public.create_shared_snapshot(jsonb, jsonb, text, timestamptz) to authenticated;
grant execute on function public.update_shared_snapshot(uuid, jsonb, jsonb, text, timestamptz) to authenticated;
grant execute on function public.revoke_shared_snapshot(uuid) to authenticated;
grant execute on function public.verify_shared_snapshot(uuid, text) to anon, authenticated;
