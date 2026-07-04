import type { ClientProfile } from '../../types/client'
import {
  INCOME_TYPE_LABELS, PAY_FREQUENCY_LABELS,
  EXPENSE_CATEGORY_LABELS, INVESTMENT_CATEGORY_LABELS,
  calcCurrentAge,
} from '../../types/client'
import { fmtNTD } from '../../shared/format'

const S = {
  section: { marginBottom: 28 } as React.CSSProperties,
  heading: { fontSize: 14, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--color-border)' } as React.CSSProperties,
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-bg)', fontSize: 14 } as React.CSSProperties,
  label: { color: 'var(--color-text-muted)' } as React.CSSProperties,
  value: { fontWeight: 500, color: 'var(--color-text-primary)' } as React.CSSProperties,
  empty: { fontSize: 13, color: 'var(--color-text-muted)', padding: '8px 0', fontStyle: 'italic' } as React.CSSProperties,
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <span style={S.value}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={S.section}>
      <div style={S.heading}>{title}</div>
      {children}
    </div>
  )
}

interface Props {
  client: ClientProfile
}

export function BasicInfoPage({ client: c }: Props) {
  const currentAge = calcCurrentAge(c.birthYear)

  return (
    <div style={{ padding: '24px 16px', maxWidth: 640, margin: '0 auto' }}>

      {/* 諮詢重點 */}
      {c.consultationFocus && (
        <div style={{ background: 'var(--color-lime)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>諮詢重點</div>
          <div style={{ fontSize: 15, color: 'var(--color-text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.consultationFocus}</div>
        </div>
      )}

      {/* 諮詢建議 */}
      {c.consultationAdvice && c.consultationAdvice.length > 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>諮詢建議</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {c.consultationAdvice.filter(a => a.trim()).map((advice, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'var(--color-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 1 }}>{i + 1}</span>
                <span style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{advice}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 人生目標 */}
      <Section title="人生目標">
        <Row label="出生年份" value={`${c.birthYear} 年`} />
        <Row label="目前年齡" value={`${currentAge} 歲`} />
        <Row label="目標退休年齡" value={`${c.retirementAge} 歲`} />
        <Row label="預計退休餘命" value={`${c.retirementLifespan} 年`} />
        <Row label="目標月退休現金流" value={fmtNTD(c.targetMonthlyRetirementIncome)} />
        {c.majorExpenses.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>重大支出計劃</div>
            {c.majorExpenses.map((e, i) => (
              <div key={i} style={{ ...S.row, fontSize: 13 }}>
                <span style={S.label}>{e.year} 年｜{e.label}</span>
                <span style={S.value}>{fmtNTD(e.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 收入 */}
      <Section title="收入">
        {c.incomes.length === 0
          ? <div style={S.empty}>無收入資料</div>
          : c.incomes.map((item, i) => (
            <div key={i} style={S.row}>
              <span style={S.label}>
                {item.label}
                <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--color-text-muted)' }}>
                  {INCOME_TYPE_LABELS[item.type]}・{PAY_FREQUENCY_LABELS[item.frequency ?? 'monthly']}
                </span>
              </span>
              <span style={S.value}>{fmtNTD(item.amount)}</span>
            </div>
          ))
        }
      </Section>

      {/* 支出 */}
      <Section title="支出">
        {c.expenses.length === 0
          ? <div style={S.empty}>無支出資料</div>
          : c.expenses.map((item, i) => (
            <div key={i} style={S.row}>
              <span style={S.label}>
                {item.label}
                <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--color-text-muted)' }}>
                  {EXPENSE_CATEGORY_LABELS[item.category]}
                </span>
              </span>
              <span style={S.value}>{fmtNTD(item.amount)}</span>
            </div>
          ))
        }
      </Section>

      {/* 資產 */}
      <Section title="資產">
        {c.assetItems.length === 0
          ? <div style={S.empty}>無資產資料</div>
          : c.assetItems.map((item, i) => (
            <div key={i} style={S.row}>
              <span style={S.label}>
                {item.label}
                <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--color-text-muted)' }}>
                  {INVESTMENT_CATEGORY_LABELS[item.category]}
                  {item.currency && item.currency !== 'TWD' ? `・${item.currency}` : ''}
                </span>
              </span>
              <span style={S.value}>{fmtNTD(item.amount)}</span>
            </div>
          ))
        }
      </Section>

      {/* 負債 */}
      <Section title="負債">
        {c.liabilityItems.length === 0
          ? <div style={S.empty}>無負債資料</div>
          : c.liabilityItems.map((item, i) => (
            <div key={i} style={S.row}>
              <span style={S.label}>{item.label}</span>
              <span style={{ ...S.value, color: '#dc2626' }}>{fmtNTD(item.amount)}</span>
            </div>
          ))
        }
      </Section>

    </div>
  )
}
