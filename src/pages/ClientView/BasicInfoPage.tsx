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
