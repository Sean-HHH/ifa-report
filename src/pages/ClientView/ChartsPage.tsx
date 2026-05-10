import type { ClientProfile, VisibleModules } from '../../types/client'
import type { FxRates } from '../../features/fx/exchangeRate'
import { AssetGrowthReport } from '../../features/assets/AssetGrowthReport'
import { RetirementReport } from '../../features/retirement/RetirementReport'
import { CashFlowReport } from '../../features/cashflow/CashFlowReport'

const DEFAULT_RATES: FxRates = { TWD: 1 }

interface Props {
  client: ClientProfile
  visibleModules: VisibleModules
}

export function ChartsPage({ client, visibleModules }: Props) {
  const hasAny = visibleModules.assetGrowth || visibleModules.retirement || visibleModules.cashflow

  if (!hasAny) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
        此報告未包含圖表模組
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 24px 48px' }}>
      {visibleModules.assetGrowth && (
        <div style={{ marginBottom: 40 }}>
          <AssetGrowthReport client={client} rates={DEFAULT_RATES} reportCurrency="TWD" />
        </div>
      )}
      {visibleModules.retirement && (
        <div style={{ marginBottom: 40 }}>
          <RetirementReport client={client} rates={DEFAULT_RATES} reportCurrency="TWD" />
        </div>
      )}
      {visibleModules.cashflow && (
        <div>
          <CashFlowReport client={client} rates={DEFAULT_RATES} reportCurrency="TWD" />
        </div>
      )}
    </div>
  )
}
