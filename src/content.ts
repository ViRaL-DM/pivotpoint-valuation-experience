type DecoratedOption = {
  value: string
  label: string
  description: string
  icon?: string
  accent?: 'rise' | 'steady' | 'fall' | 'neutral'
}

export const profitBasisOptions = [
  {
    value: 'SDE',
    label: 'SDE',
    description: 'Owner-focused earnings for smaller operator-led businesses.',
  },
  {
    value: 'EBITDA',
    label: 'EBITDA',
    description: 'Cleaner operating earnings for transferable businesses and deal comps.',
  },
]

export const industryOptions = [
  'Services',
  'E-commerce',
  'SaaS',
  'Local Business',
  'Agency',
  'Manufacturing / Other',
]

export const customerConcentrationOptions = [
  {
    value: 'healthy',
    label: 'Healthy concentration',
    description: 'No single customer is driving an outsized share of revenue.',
  },
  {
    value: 'moderate',
    label: 'Moderate concentration',
    description: 'There is some reliance on larger accounts, but it remains manageable.',
  },
  {
    value: 'high',
    label: 'High concentration',
    description: 'A few accounts materially shape the business value conversation.',
  },
]

export const revenueTrendOptions: DecoratedOption[] = [
  {
    value: 'declining',
    label: 'Contraction',
    description: 'Recent statements show pressure in sales or profitability.',
    icon: '↘',
    accent: 'fall',
  },
  {
    value: 'stable',
    label: 'Steady',
    description: 'The last several years look consistent and supportable.',
    icon: '→',
    accent: 'steady',
  },
  {
    value: 'growing',
    label: 'Expansion',
    description: 'The trend supports a stronger valuation and retirement narrative.',
    icon: '↗',
    accent: 'rise',
  },
  {
    value: 'volatile',
    label: 'Volatile',
    description: 'Results swing meaningfully between years and need more context.',
    icon: '?',
    accent: 'neutral',
  },
]

export const addBackProfileOptions = [
  {
    value: 'clean',
    label: 'Clean add-backs',
    description: 'Few non-recurring adjustments are needed to explain earnings.',
  },
  {
    value: 'moderate',
    label: 'Moderate add-backs',
    description: 'Some normalization work is expected, but it is explainable.',
  },
  {
    value: 'heavy',
    label: 'Heavy add-backs',
    description: 'Earnings quality may be questioned without deeper diligence support.',
  },
]

export const legalExposureOptions = [
  {
    value: 'none',
    label: 'No material legal activity',
    description: 'No active issues are expected to distract from the core valuation story.',
  },
  {
    value: 'resolved',
    label: 'Resolved or manageable',
    description: 'Some legal history exists, but it appears contained and explainable.',
  },
  {
    value: 'active',
    label: 'Active legal activity',
    description: 'Open issues may pressure both perceived value and retirement planning confidence.',
  },
]

export const resultsAssumptions = [
  'Outputs are based on user-entered assumptions and directional market ranges rather than a formal valuation opinion.',
  'Retirement projections are directional and do not model sequence-of-returns risk, advisory fees, or estate planning structures.',
  'Comparable transaction data, full financial statement review, and diligence documents should sharpen this range during a fuller review.',
]
