import type {
  AddBackProfile,
  BusinessProfileInput,
  CustomerConcentration,
  DriverWatchoutItem,
  IncomeProfileInput,
  InsightCard,
  LegalExposure,
  ProfitBasis,
  RetirementProfileInput,
  RevenueTrend,
  ValuationResult,
  ValuationScenario,
} from './types'

const basisMultipliers: Record<
  ProfitBasis,
  Record<string, { min: number; max: number }>
> = {
  EBITDA: {
    Services: { min: 3.7, max: 5.1 },
    'E-commerce': { min: 3.0, max: 4.3 },
    SaaS: { min: 4.9, max: 6.8 },
    'Local Business': { min: 2.7, max: 3.9 },
    Agency: { min: 3.2, max: 4.5 },
    'Manufacturing / Other': { min: 3.4, max: 4.9 },
  },
  SDE: {
    Services: { min: 2.3, max: 3.4 },
    'E-commerce': { min: 2.1, max: 3.2 },
    SaaS: { min: 2.9, max: 4.1 },
    'Local Business': { min: 2.0, max: 2.9 },
    Agency: { min: 2.3, max: 3.3 },
    'Manufacturing / Other': { min: 2.5, max: 3.6 },
  },
}

const concentrationAdjustments: Record<CustomerConcentration, number> = {
  healthy: 7,
  moderate: 1,
  high: -9,
}

const revenueTrendAdjustments: Record<RevenueTrend, number> = {
  declining: -8,
  stable: 2,
  growing: 8,
  volatile: -3,
}

const addBackAdjustments: Record<AddBackProfile, number> = {
  clean: 6,
  moderate: 0,
  heavy: -7,
}

const legalExposureAdjustments: Record<LegalExposure, number> = {
  none: 5,
  resolved: -1,
  active: -9,
}

export function buildValuationResult(
  retirementProfile: RetirementProfileInput,
  incomeProfile: IncomeProfileInput,
  businessProfile: BusinessProfileInput,
  assumptions: string[],
): ValuationResult {
  const annualProfit = businessProfile.annualProfit ?? 0
  const revenue = businessProfile.annualRevenue ?? 0
  const netIncome = businessProfile.netIncome ?? 0
  const addBackAmount = businessProfile.addBackAmount ?? 0
  const profitBasis = businessProfile.profitBasis ?? 'EBITDA'
  const industry = businessProfile.industry ?? 'Services'
  const householdPlanningAge = deriveHouseholdPlanningAge(
    retirementProfile.currentAge,
    retirementProfile.spouseAge,
  )
  const normalizedEarnings = annualProfit + addBackAmount * 0.75

  const topTenCustomerPercent = businessProfile.topTenCustomerPercent ?? 0
  const qualityAdjustment =
    concentrationAdjustments[businessProfile.customerConcentration ?? 'moderate'] +
    revenueTrendAdjustments[businessProfile.revenueTrend ?? 'stable'] +
    addBackAdjustments[businessProfile.addBackProfile ?? 'moderate'] +
    legalExposureAdjustments[businessProfile.legalExposure ?? 'none'] +
    customerMixAdjustment(topTenCustomerPercent) +
    statementCoverageAdjustment(businessProfile.yearsStatements) +
    salesGrowthAdjustment(businessProfile.salesGrowthRate)

  const profitMargin = revenue > 0 ? annualProfit / revenue : 0
  const netIncomeMargin = revenue > 0 ? netIncome / revenue : 0
  const profitMarginAdjustment =
    profitMargin >= 0.25 ? 8 : profitMargin >= 0.18 ? 5 : profitMargin >= 0.12 ? 1 : -6
  const netIncomeAdjustment =
    netIncomeMargin >= 0.16 ? 4 : netIncomeMargin >= 0.1 ? 1 : -3

  const multipleBand =
    basisMultipliers[profitBasis][industry] ?? basisMultipliers[profitBasis].Services
  const qualityFactor = clamp(
    1 + (qualityAdjustment + profitMarginAdjustment + netIncomeAdjustment) / 120,
    0.8,
    1.22,
  )
  const businessValueMin =
    Math.round((normalizedEarnings * multipleBand.min * qualityFactor) / 1000) * 1000
  const businessValueMax =
    Math.round((normalizedEarnings * multipleBand.max * qualityFactor) / 1000) * 1000
  const midpointBusinessValue = Math.round((businessValueMin + businessValueMax) / 2)

  const annualNonPortfolioIncome =
    (incomeProfile.apartmentCashflow ?? 0) +
    (incomeProfile.retirementW2Income ?? 0) +
    (incomeProfile.consultingIncome ?? 0) +
    (incomeProfile.passiveIncome ?? 0)

  const grossLifestyleNeed =
    retirementProfile.annualLifestyleNeed /
    clamp(1 - retirementProfile.taxRate / 100, 0.45, 0.9)
  const annualPortfolioNeed = Math.max(0, grossLifestyleNeed - annualNonPortfolioIncome)
  const fourPercentCapitalTarget =
    annualPortfolioNeed > 0 ? annualPortfolioNeed / 0.04 : 0

  const startingPortfolio = Math.max(
    0,
    (retirementProfile.currentInvestments ?? 0) +
      midpointBusinessValue -
      (incomeProfile.currentDebt ?? 0),
  )

  const projection = simulatePortfolio({
    startingPortfolio,
    annualPortfolioNeed,
    marketReturn: retirementProfile.marketReturn / 100,
    inflation: retirementProfile.inflation / 100,
    currentAge: householdPlanningAge,
    targetLongevity: retirementProfile.targetLongevity,
  })

  const capitalCoverageRatio =
    fourPercentCapitalTarget > 0 ? startingPortfolio / fourPercentCapitalTarget : 1.2
  const readinessScore = clamp(
    Math.round(
      30 +
        capitalCoverageRatio * 38 +
        (qualityAdjustment + profitMarginAdjustment + netIncomeAdjustment) * 1.25 +
        (projection.depletionAge === null ? 10 : -12),
    ),
    18,
    97,
  )

  const scenario: ValuationScenario = {
    key: [
      profitBasis.toLowerCase(),
      industry.toLowerCase().replaceAll(/[^a-z]+/g, '-'),
      businessProfile.customerConcentration ?? 'moderate',
      businessProfile.revenueTrend ?? 'stable',
    ].join(':'),
    multipleMin: multipleBand.min,
    multipleMax: multipleBand.max,
    qualityScore: clamp(
      55 + qualityAdjustment + profitMarginAdjustment + netIncomeAdjustment,
      28,
      92,
    ),
    normalizedEarnings,
    statementCoverageYears: businessProfile.yearsStatements,
    salesGrowthRate: businessProfile.salesGrowthRate,
    annualNonPortfolioIncome,
    annualPortfolioNeed,
    grossLifestyleNeed,
    householdPlanningAge,
    targetLongevity: retirementProfile.targetLongevity,
  }

  return {
    scenario,
    businessValueRange: {
      min: Math.max(businessValueMin, 100_000),
      max: Math.max(businessValueMax, Math.max(businessValueMin + 100_000, 250_000)),
    },
    midpointBusinessValue,
    fourPercentCapitalTarget,
    projectedNetWorthAtLongevity: projection.assetsAtLongevity,
    projectedNetWorthAt100: projection.assetsAt100,
    depletionAge: projection.depletionAge,
    readinessScore,
    readinessBand: deriveReadinessBand(readinessScore, projection.depletionAge),
    heroNarrative: buildHeroNarrative(
      projection.assetsAt100,
      retirementProfile.targetLongevity,
    ),
    methodologyNote:
      'PivotPoint combines retirement draw assumptions, passive-income offsets, debt, taxes, and a directional business value range into one planning view.',
    summaryCards: [
      {
        label: 'Estimated business value',
        value: currencyRange(
          Math.max(businessValueMin, 100_000),
          Math.max(businessValueMax, Math.max(businessValueMin + 100_000, 250_000)),
        ),
        detail: `Built from normalized ${profitBasis} and a directional multiple band of ${multipleBand.min.toFixed(1)}x to ${multipleBand.max.toFixed(1)}x.`,
      },
      {
        label: 'PivotPoint capital target',
        value: formatCompactCurrency(fourPercentCapitalTarget),
        detail:
          annualPortfolioNeed > 0
            ? `${formatCompactCurrency(annualPortfolioNeed)} of annual portfolio draw remains after passive income and retirement offsets.`
            : 'Passive and external income fully cover the annual target lifestyle need.',
      },
      {
        label: 'Statement coverage',
        value: `${businessProfile.yearsStatements} years`,
        detail: `${businessProfile.salesGrowthRate}% sales-growth assumption with ${formatCompactCurrency(addBackAmount)} in discussed add-backs.`,
      },
    ],
    insights: buildInsights(
      retirementProfile,
      businessProfile,
      scenario,
      projection.assetsAtLongevity,
      projection.assetsAt100,
      projection.depletionAge,
      addBackAmount,
    ),
    drivers: buildDrivers(
      businessProfile,
      annualNonPortfolioIncome,
      annualPortfolioNeed,
      projection.depletionAge,
    ),
    watchouts: buildWatchouts(
      businessProfile,
      annualPortfolioNeed,
      projection.depletionAge,
      retirementProfile.taxRate,
    ),
    assumptions,
  }
}

function deriveHouseholdPlanningAge(currentAge: number | null, spouseAge: number | null) {
  if (currentAge == null && spouseAge == null) return 60
  if (currentAge == null) return spouseAge ?? 60
  if (spouseAge == null) return currentAge
  return Math.min(currentAge, spouseAge)
}

function customerMixAdjustment(topTenCustomerPercent: number) {
  if (topTenCustomerPercent <= 30) return 4
  if (topTenCustomerPercent <= 45) return 1
  if (topTenCustomerPercent <= 60) return -3
  return -7
}

function statementCoverageAdjustment(yearsStatements: number) {
  if (yearsStatements >= 5) return 5
  if (yearsStatements === 4) return 3
  return 0
}

function salesGrowthAdjustment(salesGrowthRate: number) {
  if (salesGrowthRate >= 15) return 7
  if (salesGrowthRate >= 8) return 4
  if (salesGrowthRate >= 0) return 1
  return -5
}

function simulatePortfolio({
  startingPortfolio,
  annualPortfolioNeed,
  marketReturn,
  inflation,
  currentAge,
  targetLongevity,
}: {
  startingPortfolio: number
  annualPortfolioNeed: number
  marketReturn: number
  inflation: number
  currentAge: number
  targetLongevity: number
}) {
  let portfolio = startingPortfolio
  let annualDraw = annualPortfolioNeed
  let assetsAtLongevity = startingPortfolio
  let assetsAt100 = startingPortfolio
  let depletionAge: number | null = null

  for (let age = currentAge + 1; age <= 100; age += 1) {
    portfolio = portfolio * (1 + marketReturn) - annualDraw
    if (portfolio <= 0) {
      portfolio = 0
      if (depletionAge === null) {
        depletionAge = age
      }
    }

    if (age === targetLongevity) {
      assetsAtLongevity = Math.round(portfolio)
    }

    if (age === 100) {
      assetsAt100 = Math.round(portfolio)
    }

    annualDraw *= 1 + inflation
  }

  if (targetLongevity <= currentAge) {
    assetsAtLongevity = startingPortfolio
  }

  return {
    assetsAtLongevity: Math.max(0, assetsAtLongevity),
    assetsAt100: Math.max(0, assetsAt100),
    depletionAge,
  }
}

function deriveReadinessBand(score: number, depletionAge: number | null) {
  if (depletionAge !== null && depletionAge < 95) return 'Long-horizon coverage needs attention'
  if (score >= 80) return 'Strong long-horizon positioning'
  if (score >= 63) return 'Balanced, but assumption-sensitive'
  return 'Needs a stronger retirement bridge'
}

function buildHeroNarrative(
  projectedNetWorthAt100: number,
  targetLongevity: number,
) {
  return `PivotPoint projects that this planning case reaches age ${targetLongevity} with a meaningful business-value bridge and carries approximately ${formatCompactCurrency(projectedNetWorthAt100)} into the age-100 view.`
}

function buildInsights(
  retirementProfile: RetirementProfileInput,
  businessProfile: BusinessProfileInput,
  scenario: ValuationScenario,
  assetsAtLongevity: number,
  assetsAt100: number,
  depletionAge: number | null,
  addBackAmount: number,
): InsightCard[] {
  return [
    {
      eyebrow: 'Longevity',
      title:
        depletionAge === null
          ? `Modeled through age ${retirementProfile.targetLongevity}`
          : `Coverage fades around age ${depletionAge}`,
      body:
        depletionAge === null
          ? `${formatCompactCurrency(assetsAtLongevity)} remains at the selected life-expectancy horizon, with ${formatCompactCurrency(assetsAt100)} still present at age 100.`
          : 'The current draw, inflation, and tax mix create pressure before the age-100 safeguard is reached.',
    },
    {
      eyebrow: 'Business value',
      title: `${businessProfile.profitBasis ?? 'EBITDA'} range drives the bridge`,
      body: `The business value estimate is built from ${formatCompactCurrency(scenario.normalizedEarnings)} of normalized earnings, ${scenario.statementCoverageYears} years of statements, and a directional multiple range of ${scenario.multipleMin.toFixed(1)}x to ${scenario.multipleMax.toFixed(1)}x.`,
    },
    {
      eyebrow: 'Diligence signal',
      title:
        addBackAmount > 0
          ? 'Add-backs are now part of the bridge'
          : 'Normalized earnings remain clean',
      body:
        addBackAmount > 0
          ? `${formatCompactCurrency(addBackAmount)} of non-recurring or unusual items are being considered and should be supported by a clean diligence schedule.`
          : 'The current assumptions do not depend on material add-backs, which makes the quality-of-earnings story cleaner.',
    },
  ]
}

function buildDrivers(
  businessProfile: BusinessProfileInput,
  annualNonPortfolioIncome: number,
  annualPortfolioNeed: number,
  depletionAge: number | null,
): DriverWatchoutItem[] {
  const drivers: DriverWatchoutItem[] = []

  if ((businessProfile.customerConcentration ?? 'moderate') === 'healthy') {
    drivers.push({
      title: 'Healthy customer mix',
      body: 'Lower concentration helps support both multiple confidence and the sustainability story behind the retirement plan.',
    })
  }

  if ((businessProfile.revenueTrend ?? 'stable') === 'growing') {
    drivers.push({
      title: 'Positive financial trend',
      body: 'Growth across recent statements supports both higher value expectations and a more resilient planning narrative.',
    })
  }

  if (businessProfile.yearsStatements >= 4) {
    drivers.push({
      title: 'Deeper statement coverage',
      body: 'More financial history gives PivotPoint a stronger footing for diligence-ready conversations and transaction context.',
    })
  }

  if (annualNonPortfolioIncome >= annualPortfolioNeed && annualPortfolioNeed > 0) {
    drivers.push({
      title: 'Meaningful passive-income offset',
      body: 'External income is doing real work against the modeled annual spend target.',
    })
  }

  if (depletionAge === null) {
    drivers.push({
      title: 'Age-100 buffer remains intact',
      body: 'The simulated capital stack does not hit zero before the age-100 backstop under current assumptions.',
    })
  }

  if (drivers.length < 3) {
    drivers.push({
      title: 'Usable planning baseline',
      body: 'The current set of assumptions is strong enough to support a productive retirement and valuation conversation.',
    })
  }

  return drivers.slice(0, 4)
}

function buildWatchouts(
  businessProfile: BusinessProfileInput,
  annualPortfolioNeed: number,
  depletionAge: number | null,
  taxRate: number,
): DriverWatchoutItem[] {
  const watchouts: DriverWatchoutItem[] = []

  if ((businessProfile.customerConcentration ?? 'moderate') === 'high') {
    watchouts.push({
      title: 'Customer concentration risk',
      body: 'If the top accounts represent too much of the revenue base, buyers may discount value and the retirement bridge becomes more fragile.',
    })
  }

  if ((businessProfile.addBackProfile ?? 'moderate') === 'heavy') {
    watchouts.push({
      title: 'Earnings quality needs support',
      body: 'Heavy add-backs create more work to defend the normalized earnings story behind the business value estimate.',
    })
  }

  if ((businessProfile.revenueTrend ?? 'stable') === 'volatile') {
    watchouts.push({
      title: 'Volatile operating trend',
      body: 'Inconsistent year-to-year performance usually needs more context before buyers fully credit the earnings story.',
    })
  }

  if ((businessProfile.legalExposure ?? 'none') === 'active') {
    watchouts.push({
      title: 'Active legal activity',
      body: 'Open legal matters can impact marketability and should be surfaced early in the client conversation.',
    })
  }

  if (annualPortfolioNeed > 0 && taxRate >= 32) {
    watchouts.push({
      title: 'Tax drag on withdrawals',
      body: 'Higher tax assumptions materially raise the gross amount that needs to come out of invested capital each year.',
    })
  }

  if (depletionAge !== null) {
    watchouts.push({
      title: 'Longevity gap',
      body: `The current assumptions exhaust modeled capital around age ${depletionAge}, so spending, taxes, income offsets, or business value need another pass.`,
    })
  }

  if (watchouts.length < 2) {
    watchouts.push({
      title: 'Still assumption-led',
      body: 'This planning view should still be sharpened with comparable transactions, full diligence schedules, and deeper financial support.',
    })
  }

  return watchouts.slice(0, 4)
}

function currencyRange(min: number, max: number) {
  return `${formatCompactCurrency(min)} - ${formatCompactCurrency(max)}`
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return `$${Math.round(value)}`
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
