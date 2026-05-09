import type { PayFrequency } from '../../types/client'

export function quarterlyMonths(anchor: number): number[] {
  return [anchor, anchor + 3, anchor + 6, anchor + 9]
}

export function quarterlyAnchor(payMonths?: number[]): number {
  return payMonths?.[0] ?? 3
}

export function handleFrequencyChange(freq: PayFrequency): { frequency: PayFrequency; payMonths?: number[] } {
  if (freq === 'quarterly') return { frequency: freq, payMonths: quarterlyMonths(3) }
  if (freq === 'annual') return { frequency: freq, payMonths: [12] }
  return { frequency: freq, payMonths: undefined }
}
