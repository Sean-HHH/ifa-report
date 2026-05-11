import type { ClientProfile, VisibleModules } from '../../types/client'
import type { FxRates } from '../../features/fx/exchangeRate'
import { CashFlowReport } from '../../features/cashflow/CashFlowReport'
import { AssetReport } from '../../features/assets/AssetReport'
import { AssetGrowthReport } from '../../features/assets/AssetGrowthReport'
import { RetirementReport } from '../../features/retirement/RetirementReport'

const DEFAULT_RATES: FxRates = { TWD: 1 }

interface Props {
  client: ClientProfile
  visibleModules: VisibleModules
}

export function ChartsPage({ client, visibleModules }: Props) {
  const hasAny = visibleModules.cashflow || visibleModules.assets || visibleModules.assetGrowth || visibleModules.retirement

  if (!hasAny) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
        此報告未包含圖表模組
      </div>
    )
  }

  const sections: React.ReactNode[] = []
  if (visibleModules.cashflow)    sections.push(<CashFlowReport    key="cashflow"    client={client} rates={DEFAULT_RATES} reportCurrency="TWD" />)
  if (visibleModules.assets)      sections.push(<AssetReport        key="assets"      client={client} rates={DEFAULT_RATES} reportCurrency="TWD" />)
  if (visibleModules.assetGrowth) sections.push(<AssetGrowthReport  key="assetGrowth" client={client} rates={DEFAULT_RATES} reportCurrency="TWD" />)
  if (visibleModules.retirement)  sections.push(<RetirementReport   key="retirement"  client={client} rates={DEFAULT_RATES} reportCurrency="TWD" />)

  return (
    <div style={{ padding: '24px 24px 48px' }}>
      {sections.map((section, i) => (
        <div key={i} style={{ marginBottom: i < sections.length - 1 ? 40 : 0 }}>
          {section}
        </div>
      ))}
    </div>
  )
}
