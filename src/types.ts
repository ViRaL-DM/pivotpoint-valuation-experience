export type ProfitBasis = 'SDE' | 'EBITDA'
export type CustomerConcentration = 'healthy' | 'moderate' | 'high'
export type RevenueTrend = 'declining' | 'stable' | 'growing' | 'volatile'
export type AddBackProfile = 'clean' | 'moderate' | 'heavy'
export type LegalExposure = 'none' | 'resolved' | 'active'

export type RetirementProfileInput = {
  currentAge: number | null
  spouseAge: number | null
  targetLongevity: number
  marketReturn: number
  inflation: number
  annualLifestyleNeed: number
  taxRate: number
  currentInvestments: number | null
}

export type IncomeProfileInput = {
  apartmentCashflow: number | null
  retirementW2Income: number | null
  consultingIncome: number | null
  passiveIncome: number | null
  currentDebt: number | null
}

export type BusinessProfileInput = {
  annualRevenue: number | null
  annualProfit: number | null
  netIncome: number | null
  addBackAmount: number | null
  profitBasis: ProfitBasis | null
  industry: string | null
  yearsStatements: number
  salesGrowthRate: number
  customerConcentration: CustomerConcentration | null
  topTenCustomerPercent: number | null
  revenueTrend: RevenueTrend | null
  addBackProfile: AddBackProfile | null
  legalExposure: LegalExposure | null
}

export type ValuationScenario = {
  key: string
  multipleMin: number
  multipleMax: number
  qualityScore: number
  normalizedEarnings: number
  statementCoverageYears: number
  salesGrowthRate: number
  annualNonPortfolioIncome: number
  annualPortfolioNeed: number
  grossLifestyleNeed: number
  householdPlanningAge: number
  targetLongevity: number
}

export type InsightCard = {
  eyebrow: string
  title: string
  body: string
}

export type DriverWatchoutItem = {
  title: string
  body: string
}

export type ValuationResult = {
  scenario: ValuationScenario
  businessValueRange: {
    min: number
    max: number
  }
  midpointBusinessValue: number
  fourPercentCapitalTarget: number
  projectedNetWorthAtLongevity: number
  projectedNetWorthAt100: number
  depletionAge: number | null
  readinessScore: number
  readinessBand: string
  heroNarrative: string
  methodologyNote: string
  summaryCards: Array<{
    label: string
    value: string
    detail: string
  }>
  insights: InsightCard[]
  drivers: DriverWatchoutItem[]
  watchouts: DriverWatchoutItem[]
  assumptions: string[]
}
