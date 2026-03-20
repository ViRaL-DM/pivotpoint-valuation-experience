import { startTransition, useMemo, useState } from 'react'
import './App.css'
import pivotPointLogo from './assets/pivotpoint-logo.png'
import {
  addBackProfileOptions,
  customerConcentrationOptions,
  industryOptions,
  legalExposureOptions,
  profitBasisOptions,
  resultsAssumptions,
  revenueTrendOptions,
} from './content'
import { buildValuationResult } from './engine'
import type {
  AddBackProfile,
  BusinessProfileInput,
  CustomerConcentration,
  DriverWatchoutItem,
  IncomeProfileInput,
  LegalExposure,
  ProfitBasis,
  RetirementProfileInput,
  RevenueTrend,
} from './types'

type StepId = 'horizon' | 'income' | 'business' | 'results'

type StepMeta = {
  id: StepId
  label: string
  shortLabel: string
  eyebrow: string
  title: string
  description: string
}

type ValidationErrors = Record<string, string>
type LabeledOption = {
  value: string
  label: string
  description: string
  icon?: string
  accent?: 'rise' | 'steady' | 'fall' | 'neutral'
}

const steps: StepMeta[] = [
  {
    id: 'horizon',
    label: 'Retirement Horizon',
    shortLabel: 'Horizon',
    eyebrow: 'Step 1',
    title: 'Set retirement planning assumptions.',
    description:
      'This establishes the age-based runway, market return posture, inflation pressure, and current capital base.',
  },
  {
    id: 'income',
    label: 'Income & Taxes',
    shortLabel: 'Income',
    eyebrow: 'Step 2',
    title: 'Model lifestyle needs and income offsets.',
    description:
      'Use the slider-driven lifestyle target, then layer in tax assumptions, apartment cash flow, W2 income, consulting fees, and passive income.',
  },
  {
    id: 'business',
    label: 'Business Inputs',
    shortLabel: 'Business',
    eyebrow: 'Step 3',
    title: 'Capture business value and diligence signals.',
    description:
      'Capture earnings, concentration, statement history, and legal context in one business review.',
  },
  {
    id: 'results',
    label: 'Results Report',
    shortLabel: 'Results',
    eyebrow: 'Step 4',
    title: 'Review the integrated retirement outlook.',
    description:
      'The report combines retirement needs, outside income, debt, and business value into one planning summary.',
  },
]

const initialRetirementProfile: RetirementProfileInput = {
  currentAge: null,
  spouseAge: null,
  targetLongevity: 90,
  marketReturn: 7,
  inflation: 3,
  annualLifestyleNeed: 300_000,
  taxRate: 27,
  currentInvestments: null,
}

const initialIncomeProfile: IncomeProfileInput = {
  apartmentCashflow: null,
  retirementW2Income: null,
  consultingIncome: null,
  passiveIncome: null,
  currentDebt: null,
}

const initialBusinessProfile: BusinessProfileInput = {
  annualRevenue: null,
  annualProfit: null,
  netIncome: null,
  addBackAmount: null,
  profitBasis: 'EBITDA',
  industry: 'Services',
  yearsStatements: 3,
  salesGrowthRate: 6,
  customerConcentration: 'moderate',
  topTenCustomerPercent: 35,
  revenueTrend: 'stable',
  addBackProfile: 'moderate',
  legalExposure: 'none',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function App() {
  const [stepIndex, setStepIndex] = useState(0)
  const [retirementProfile, setRetirementProfile] = useState(initialRetirementProfile)
  const [incomeProfile, setIncomeProfile] = useState(initialIncomeProfile)
  const [businessProfile, setBusinessProfile] = useState(initialBusinessProfile)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const activeStep = steps[stepIndex]
  const result = useMemo(
    () =>
      buildValuationResult(
        retirementProfile,
        incomeProfile,
        businessProfile,
        resultsAssumptions,
      ),
    [retirementProfile, incomeProfile, businessProfile],
  )

  const setCurrencyField = (
    group: 'retirement' | 'income' | 'business',
    key: string,
    value: string,
  ) => {
    const digitsOnly = value.replace(/[^\d]/g, '')
    const numericValue = digitsOnly ? Number(digitsOnly) : null

    if (group === 'retirement') {
      setRetirementProfile((current) => ({
        ...current,
        [key]: numericValue,
      }))
    }

    if (group === 'income') {
      setIncomeProfile((current) => ({
        ...current,
        [key]: numericValue,
      }))
    }

    if (group === 'business') {
      setBusinessProfile((current) => ({
        ...current,
        [key]: numericValue,
      }))
    }

    clearError(key)
  }

  const setNumberField = (
    group: 'retirement' | 'business',
    key: string,
    value: string,
  ) => {
    const digitsOnly = value.replace(/[^\d]/g, '')
    const numericValue = digitsOnly ? Number(digitsOnly) : null

    if (group === 'retirement') {
      setRetirementProfile((current) => ({
        ...current,
        [key]: numericValue,
      }))
    }

    if (group === 'business') {
      setBusinessProfile((current) => ({
        ...current,
        [key]: numericValue,
      }))
    }

    clearError(key)
  }

  const setRetirementSlider = (
    key: keyof Pick<
      RetirementProfileInput,
      'targetLongevity' | 'marketReturn' | 'inflation' | 'annualLifestyleNeed' | 'taxRate'
    >,
    value: number,
  ) => {
    setRetirementProfile((current) => ({
      ...current,
      [key]: value,
    }))
    clearError(key)
  }

  const setProfitBasis = (profitBasis: ProfitBasis) => {
    setBusinessProfile((current) => ({ ...current, profitBasis }))
    clearError('profitBasis')
  }

  const setIndustry = (industry: string) => {
    setBusinessProfile((current) => ({ ...current, industry }))
    clearError('industry')
  }

  const setBusinessOption = <
    TKey extends keyof Pick<
      BusinessProfileInput,
      'customerConcentration' | 'revenueTrend' | 'addBackProfile' | 'legalExposure'
    >,
    TValue extends CustomerConcentration | RevenueTrend | AddBackProfile | LegalExposure,
  >(
    key: TKey,
    value: TValue,
  ) => {
    setBusinessProfile((current) => ({ ...current, [key]: value }))
    clearError(key)
  }

  const setBusinessSlider = (
    key: keyof Pick<BusinessProfileInput, 'yearsStatements' | 'salesGrowthRate'>,
    value: number,
  ) => {
    setBusinessProfile((current) => ({
      ...current,
      [key]: value,
    }))
    clearError(key)
  }

  const clearError = (key: string) => {
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const goBack = () => {
    if (stepIndex === 0) return
    setErrors({})
    setIsAnalyzing(false)
    setStepIndex((current) => current - 1)
  }

  const goNext = () => {
    const nextErrors = validateStep(
      activeStep.id,
      retirementProfile,
      businessProfile,
    )
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    if (activeStep.id === 'business') {
      setIsAnalyzing(true)
      window.setTimeout(() => {
        startTransition(() => {
          setStepIndex(3)
          setIsAnalyzing(false)
        })
      }, 900)
      return
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1))
  }

  const restartFlow = () => {
    setStepIndex(0)
    setErrors({})
    setIsAnalyzing(false)
  }

  const hasCapitalInputs =
    retirementProfile.currentAge != null || retirementProfile.currentInvestments != null
  const age100Outlook =
    hasCapitalInputs && businessProfile.annualProfit != null
      ? formatCompactCurrency(result.projectedNetWorthAt100)
      : 'Awaiting inputs'
  const journeyReadinessScore = buildJourneyReadinessScore(
    stepIndex,
    retirementProfile,
    incomeProfile,
    businessProfile,
  )
  const ageOutlookSummary =
    age100Outlook === 'Awaiting inputs'
      ? 'Complete the planning assumptions to preview the age-100 outlook.'
      : `Projected household capital at age 100`

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand topbar-brand-logo">
            <img
              className="topbar-logo"
              src={pivotPointLogo}
              alt="PivotPoint Company"
            />
          </div>
          <div className="contact-cluster" aria-label="PivotPoint contact details">
            <a className="contact-item contact-item-email" href="mailto:info@pivotpointco.com">
              <span className="contact-icon" aria-hidden="true">
                ✉
              </span>
              <span className="contact-copy">
                <small>Email</small>
                <strong>info@pivotpointco.com</strong>
              </span>
            </a>
            <a className="contact-item contact-item-phone" href="tel:3177750050">
              <span className="contact-icon contact-icon-phone" aria-hidden="true">
                ☎
              </span>
              <span className="contact-copy">
                <small>Call</small>
                <strong>317.775.0050</strong>
              </span>
            </a>
          </div>
        </div>
      </header>

      <div className="progress-strip">
        <div className="progress-strip-inner">
          {steps.map((step, index) => {
            const isComplete = index < stepIndex
            const isCurrent = index === stepIndex
            return (
              <button
                key={step.id}
                type="button"
                className={[
                  'progress-step',
                  isCurrent ? 'is-current' : '',
                  isComplete ? 'is-complete' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  if (step.id === 'results') return
                  setErrors({})
                  setIsAnalyzing(false)
                  setStepIndex(index)
                }}
              >
                <span className="progress-step-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="progress-step-copy">
                  <strong>{step.label}</strong>
                  <small>{step.shortLabel}</small>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="status-strip">
        {activeStep.id === 'results' ? (
          <div className="status-strip-inner is-results">
            <article className="status-card age-outlook-banner">
              <p className="label">Age 100 outlook</p>
              <div className="age-outlook-line">
                <span>{ageOutlookSummary}</span>
                <strong>{age100Outlook}</strong>
              </div>
            </article>
          </div>
        ) : (
          <div className="status-strip-inner is-single">
            <article className="status-card status-card-progress age-progress-banner">
              <div className="age-progress-copy">
                <p className="label">Age 100 outlook</p>
                <p>
                  {age100Outlook === 'Awaiting inputs'
                    ? 'This begins at zero and becomes more useful as retirement and business assumptions are filled in.'
                    : `Current modeled capital at age 100: ${age100Outlook}.`}
                </p>
              </div>
              <div className="age-progress-meter">
                <div className="rail-score-row">
                  <strong className="rail-score">{journeyReadinessScore}</strong>
                  <span>/ 100</span>
                </div>
                <div className="score-bar" aria-hidden="true">
                  <span style={{ width: `${journeyReadinessScore}%` }} />
                </div>
              </div>
            </article>
          </div>
        )}
      </div>

      <div className="app-shell">
        <main className="main-panel">
          <header className="hero-panel">
            <div>
              <p className="eyebrow">{activeStep.eyebrow}</p>
              <h2>{activeStep.title}</h2>
            </div>
          </header>

          {activeStep.id === 'horizon' && (
            <section className="content-card editorial-card">
              <div className="micro-grid">
                <NumberInput
                  label="Your Age"
                  value={retirementProfile.currentAge}
                  onChange={(value) => setNumberField('retirement', 'currentAge', value)}
                  error={errors.currentAge}
                />
                <NumberInput
                  label="Spouse Age"
                  value={retirementProfile.spouseAge}
                  onChange={(value) => setNumberField('retirement', 'spouseAge', value)}
                  error={errors.spouseAge}
                />
                <CurrencyInput
                  label="Current Investments"
                  value={retirementProfile.currentInvestments}
                  onChange={(value) =>
                    setCurrencyField('retirement', 'currentInvestments', value)
                  }
                  error={errors.currentInvestments}
                />
              </div>

              <div className="range-grid">
                <RangeField
                  label="Expected Lifespan"
                  value={retirementProfile.targetLongevity}
                  min={80}
                  max={100}
                  step={1}
                  helper="This creates the primary retirement horizon and we still show the age-100 backstop in results."
                  formatValue={(value) => `${value}`}
                  suffix="years old"
                  onChange={(value) => setRetirementSlider('targetLongevity', value)}
                />
                <RangeField
                  label="Market Return Assumption"
                  value={retirementProfile.marketReturn}
                  min={4}
                  max={10}
                  step={0.25}
                  helper="Used as a simple annual return assumption for invested capital."
                  formatValue={(value) => `${value.toFixed(2)}%`}
                  suffix="annual estimate"
                  onChange={(value) => setRetirementSlider('marketReturn', value)}
                />
                <RangeField
                  label="Inflation Assumption"
                  value={retirementProfile.inflation}
                  min={2}
                  max={5}
                  step={0.25}
                  helper="The annual draw inflates over time using this setting."
                  formatValue={(value) => `${value.toFixed(2)}%`}
                  suffix="annual pressure"
                  onChange={(value) => setRetirementSlider('inflation', value)}
                />
              </div>
            </section>
          )}

          {activeStep.id === 'income' && (
            <section className="content-card editorial-card">
              <div className="range-grid">
                <RangeField
                  label="Annual Lifestyle Need"
                  value={retirementProfile.annualLifestyleNeed}
                  min={120_000}
                  max={600_000}
                  step={10_000}
                  helper={`Equivalent monthly draw: ${formatCompactCurrency(
                    retirementProfile.annualLifestyleNeed / 12,
                  )}.`}
                  formatValue={(value) => formatCompactCurrency(value)}
                  suffix="per year"
                  onChange={(value) => setRetirementSlider('annualLifestyleNeed', value)}
                />
                <RangeField
                  label="Tax Assumption"
                  value={retirementProfile.taxRate}
                  min={15}
                  max={40}
                  step={1}
                  helper="Used to gross up the annual lifestyle target before outside income offsets are applied."
                  formatValue={(value) => `${value}%`}
                  suffix="effective tax rate"
                  onChange={(value) => setRetirementSlider('taxRate', value)}
                />
                <article className="micro-card">
                  <p className="label">PivotPoint capital lens</p>
                  <strong>{formatCompactCurrency(result.fourPercentCapitalTarget)}</strong>
                  <p>
                    A shorthand capital target after taxes, outside income, and recurring cash flow.
                  </p>
                </article>
              </div>

              <div className="micro-grid">
                <article className="micro-card">
                  <p className="label">Monthly target</p>
                  <strong>{formatCompactCurrency(retirementProfile.annualLifestyleNeed / 12)}</strong>
                  <p>The annual spending target translated into a monthly planning number.</p>
                </article>
                <article className="micro-card">
                  <p className="label">Outside income</p>
                  <strong>{formatCompactCurrency(result.scenario.annualNonPortfolioIncome)}</strong>
                  <p>Apartment cash flow, W2 income, consulting fees, and passive income.</p>
                </article>
                <article className="micro-card">
                  <p className="label">Portfolio draw</p>
                  <strong>{formatCompactCurrency(result.scenario.annualPortfolioNeed)}</strong>
                  <p>The remaining annual draw once outside income has been applied.</p>
                </article>
              </div>

              <div className="section-grid">
                <CurrencyInput
                  label="Apartment Building Cash Flow"
                  value={incomeProfile.apartmentCashflow}
                  onChange={(value) => setCurrencyField('income', 'apartmentCashflow', value)}
                  tooltip="Annual cash flow from apartment buildings or similar real-estate income."
                />
                <CurrencyInput
                  label="W2 Income in Retirement"
                  value={incomeProfile.retirementW2Income}
                  onChange={(value) => setCurrencyField('income', 'retirementW2Income', value)}
                  tooltip="Any ongoing employment income expected during retirement."
                />
                <CurrencyInput
                  label="Consulting Fees"
                  value={incomeProfile.consultingIncome}
                  onChange={(value) => setCurrencyField('income', 'consultingIncome', value)}
                  tooltip="Advisory or consulting income expected after a transition."
                />
                <CurrencyInput
                  label="Other Passive Income"
                  value={incomeProfile.passiveIncome}
                  onChange={(value) => setCurrencyField('income', 'passiveIncome', value)}
                  tooltip="Other recurring distributions, royalties, or passive cash flow."
                />
                <CurrencyInput
                  label="Current Debt"
                  value={incomeProfile.currentDebt}
                  onChange={(value) => setCurrencyField('income', 'currentDebt', value)}
                  tooltip="Debt is treated as a drag against the available capital stack."
                />
              </div>
            </section>
          )}

          {activeStep.id === 'business' && (
            <section className="content-card editorial-card">
              <div className="section-grid">
                <CurrencyInput
                  label="Annual Revenue"
                  value={businessProfile.annualRevenue}
                  onChange={(value) => setCurrencyField('business', 'annualRevenue', value)}
                  tooltip="Use the most recent annual sales figure available."
                  error={errors.annualRevenue}
                />
                <OptionGroup
                  label="Profit Basis"
                  options={profitBasisOptions}
                  value={businessProfile.profitBasis}
                  onChange={(value) => setProfitBasis(value as ProfitBasis)}
                  error={errors.profitBasis}
                />
                <CurrencyInput
                  label={`Annual ${businessProfile.profitBasis ?? 'Profit'}`}
                  value={businessProfile.annualProfit}
                  onChange={(value) => setCurrencyField('business', 'annualProfit', value)}
                  tooltip="Current operating earnings before a full normalization review."
                  error={errors.annualProfit}
                />
                <CurrencyInput
                  label="Net Income"
                  value={businessProfile.netIncome}
                  onChange={(value) => setCurrencyField('business', 'netIncome', value)}
                  tooltip="Adds another planning view into bottom-line profitability over the last several years."
                  error={errors.netIncome}
                />
                <CurrencyInput
                  label="EBITDA Add-Backs"
                  value={businessProfile.addBackAmount}
                  onChange={(value) => setCurrencyField('business', 'addBackAmount', value)}
                  tooltip="Total non-recurring or unusual adjustments expected to be discussed."
                  error={errors.addBackAmount}
                />
                <SelectField
                  label="Industry"
                  value={businessProfile.industry}
                  options={industryOptions}
                  onChange={(value) => setIndustry(value)}
                  tooltip="Industry helps anchor the market range used in this planning view."
                  error={errors.industry}
                />
                <NumberInput
                  label="Top 10 Customers % of Sales"
                  value={businessProfile.topTenCustomerPercent}
                  onChange={(value) => setNumberField('business', 'topTenCustomerPercent', value)}
                  tooltip="Customer concentration detail the client specifically wants captured."
                  error={errors.topTenCustomerPercent}
                  suffix="%"
                />
              </div>

              <div className="range-grid business-range-grid">
                <RangeField
                  label="Financial Statements Available"
                  value={businessProfile.yearsStatements}
                  min={3}
                  max={5}
                  step={1}
                  tooltip="Capture how much trailing statement history is currently available."
                  formatValue={(value) => `${value}`}
                  suffix="years"
                  onChange={(value) => setBusinessSlider('yearsStatements', value)}
                />
                <RangeField
                  label="Sales Growth Trend"
                  value={businessProfile.salesGrowthRate}
                  min={-10}
                  max={25}
                  step={1}
                  tooltip="Use the recent revenue trend that best reflects the last several years."
                  formatValue={(value) => `${value}%`}
                  suffix="3-year CAGR"
                  onChange={(value) => setBusinessSlider('salesGrowthRate', value)}
                />
                <article className="micro-card">
                  <p className="label">Normalized earnings</p>
                  <strong>{formatCompactCurrency(result.scenario.normalizedEarnings)}</strong>
                  <p>Operating earnings after a moderated view of unusual or non-recurring items.</p>
                </article>
              </div>

              <div className="stacked-sections">
                <OptionGroup
                  label="Customer Concentration"
                  options={customerConcentrationOptions}
                  value={businessProfile.customerConcentration}
                  onChange={(value) =>
                    setBusinessOption(
                      'customerConcentration',
                      value as CustomerConcentration,
                    )
                  }
                  error={errors.customerConcentration}
                />
                <OptionGroup
                  label="Financial Statement Trend"
                  options={revenueTrendOptions}
                  value={businessProfile.revenueTrend}
                  onChange={(value) =>
                    setBusinessOption('revenueTrend', value as RevenueTrend)
                  }
                  variant="trend"
                  error={errors.revenueTrend}
                />
                <OptionGroup
                  label="EBITDA Add-Back Profile"
                  options={addBackProfileOptions}
                  value={businessProfile.addBackProfile}
                  onChange={(value) =>
                    setBusinessOption('addBackProfile', value as AddBackProfile)
                  }
                  error={errors.addBackProfile}
                />
                <OptionGroup
                  label="Legal Activity"
                  options={legalExposureOptions}
                  value={businessProfile.legalExposure}
                  onChange={(value) =>
                    setBusinessOption('legalExposure', value as LegalExposure)
                  }
                  error={errors.legalExposure}
                />
              </div>

              <div className="review-note">
                <p className="label">Transaction context</p>
                <p>
                  Comparable transactions, diligence schedules, and supporting documents can
                  sharpen this range during a fuller review.
                </p>
              </div>
            </section>
          )}

          {activeStep.id === 'results' && (
            <section className="results-screen report-mode">
              <section className="report-header-bar">
                <div>
                  <p className="label">Prepared by PivotPoint Advisory</p>
                  <h3 className="report-headline">Integrated retirement and business value summary.</h3>
                </div>
                <div className="review-chip-row report-chip-row">
                  <span className="review-chip">PivotPoint planning</span>
                  <span className="review-chip">Age-100 outlook</span>
                  <span className="review-chip">Business value</span>
                </div>
              </section>

              <section className="results-hero">
                <div className="hero-copy-block">
                  <p className="label">Projected household capital at age 100</p>
                  <h3>{formatCompactCurrency(result.projectedNetWorthAt100)}</h3>
                  <p className="hero-narrative">{result.heroNarrative}</p>
                </div>

                <div className="score-card">
                  <p className="label">Estimated business value</p>
                  <div className="score-row score-row-range">
                    <span className="score-value score-value-range">
                      {formatCompactCurrency(result.businessValueRange.min)}
                    </span>
                    <span className="score-suffix">to</span>
                    <span className="score-value score-value-range">
                      {formatCompactCurrency(result.businessValueRange.max)}
                    </span>
                  </div>
                  <div className="score-bar" aria-hidden="true">
                    <span style={{ width: `${result.readinessScore}%` }} />
                  </div>
                  <p className="score-band">
                    PivotPoint coverage signal: {result.readinessScore} / 100
                  </p>
                  <p className="score-band">{result.readinessBand}</p>
                </div>
              </section>

              <section className="results-meta-grid">
                <MetricPreview
                  label="4% Rule Capital Need"
                  value={formatCompactCurrency(result.fourPercentCapitalTarget)}
                  tone="soft"
                />
                <MetricPreview
                  label="Annual Portfolio Draw"
                  value={formatCompactCurrency(result.scenario.annualPortfolioNeed)}
                  tone="accent"
                />
                <MetricPreview
                  label="Normalized Earnings"
                  value={formatCompactCurrency(result.scenario.normalizedEarnings)}
                  tone="soft"
                />
              </section>

              <div className="methodology-card results-methodology">
                <p className="label">PivotPoint planning note</p>
                <p className="results-disclaimer">{result.methodologyNote}</p>
              </div>

              <section className="report-section">
                <div className="report-section-heading">
                  <p className="label">Capital & value snapshot</p>
                  <h4>Key planning measures</h4>
                </div>
                <section className="summary-card-grid">
                  {result.summaryCards.map((card) => (
                    <article key={card.label} className="summary-card">
                      <p className="label">{card.label}</p>
                      <h4>{card.value}</h4>
                      <p>{card.detail}</p>
                    </article>
                  ))}
                </section>
              </section>

              <section className="report-section">
                <div className="report-section-heading">
                  <p className="label">Business narrative</p>
                  <h4>Drivers, watchouts, and context</h4>
                </div>
                <section className="insight-grid">
                  {result.insights.map((insight) => (
                    <article key={insight.title} className="insight-card">
                      <p className="label">{insight.eyebrow}</p>
                      <h4>{insight.title}</h4>
                      <p>{insight.body}</p>
                    </article>
                  ))}
                </section>

                <section className="drivers-grid">
                  <DriversColumn
                    title="Value Drivers"
                    items={result.drivers}
                    variant="driver"
                  />
                  <DriversColumn
                    title="Watchouts"
                    items={result.watchouts}
                    variant="watchout"
                  />
                </section>
              </section>

              <section className="assumption-block">
                <p className="label">Important context</p>
                <ul>
                  {result.assumptions.map((assumption) => (
                    <li key={assumption}>{assumption}</li>
                  ))}
                </ul>
              </section>

              <section className="cta-banner">
                <div>
                  <p className="label">Next step</p>
                  <h4>Advance this into a fuller PivotPoint advisory review</h4>
                  <p>
                    Use this planning view to refine assumptions, review diligence support, and
                    pressure-test the retirement bridge against current business value.
                  </p>
                </div>
                <div className="cta-actions">
                  <button type="button" className="primary-button">
                    Review with PivotPoint
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={restartFlow}
                  >
                    Run Another Scenario
                  </button>
                </div>
              </section>
            </section>
          )}

          {activeStep.id !== 'results' && (
            <div className="action-bar">
              <div className="action-copy">
                <p className="label">Focus</p>
                <p>{guidanceForStep(activeStep.id)}</p>
              </div>
              <div className="button-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={goBack}
                  disabled={stepIndex === 0 || isAnalyzing}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={goNext}
                  disabled={isAnalyzing}
                >
                  {activeStep.id === 'business' ? 'Generate Results' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="analysis-state" role="status" aria-live="polite">
              <div className="analysis-pulse" />
              <div>
                <p className="label">Generating integrated outlook</p>
                <p>
                  Pulling together the retirement bridge, business value range, and age-100 outlook.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="footer-bar">
        <div className="footer-bar-inner">
          <span>PivotPoint Company</span>
          <span>Prepared by PivotPoint for retirement and business value planning discussions.</span>
        </div>
      </footer>
    </div>
  )
}

type CurrencyInputProps = {
  label: string
  value: number | null
  onChange: (value: string) => void
  helper?: string
  tooltip?: string
  error?: string
}

function CurrencyInput({
  label,
  value,
  onChange,
  helper,
  tooltip,
  error,
}: CurrencyInputProps) {
  return (
    <label className="field-block">
      <FieldHeading label={label} tooltip={tooltip} />
      <input
        className={['text-input', error ? 'has-error' : ''].filter(Boolean).join(' ')}
        type="text"
        inputMode="numeric"
        placeholder="$0"
        value={value == null ? '' : currencyFormatter.format(value)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error || helper ? <span className="field-helper">{error ?? helper}</span> : null}
    </label>
  )
}

type NumberInputProps = {
  label: string
  value: number | null
  onChange: (value: string) => void
  helper?: string
  tooltip?: string
  error?: string
  suffix?: string
}

function NumberInput({
  label,
  value,
  onChange,
  helper,
  tooltip,
  error,
  suffix,
}: NumberInputProps) {
  return (
    <label className="field-block">
      <FieldHeading label={label} tooltip={tooltip} />
      <div className="numeric-input-wrap">
        <input
          className={['text-input', error ? 'has-error' : ''].filter(Boolean).join(' ')}
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={value == null ? '' : String(value)}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <span className="input-suffix">{suffix}</span> : null}
      </div>
      {error || helper ? <span className="field-helper">{error ?? helper}</span> : null}
    </label>
  )
}

type SelectFieldProps = {
  label: string
  value: string | null
  options: string[]
  onChange: (value: string) => void
  helper?: string
  tooltip?: string
  error?: string
}

function SelectField({
  label,
  value,
  options,
  onChange,
  helper,
  tooltip,
  error,
}: SelectFieldProps) {
  return (
    <label className="field-block">
      <FieldHeading label={label} tooltip={tooltip} />
      <select
        className={['select-input', error ? 'has-error' : ''].filter(Boolean).join(' ')}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error || helper ? <span className="field-helper">{error ?? helper}</span> : null}
    </label>
  )
}

type OptionGroupProps = {
  label: string
  options: LabeledOption[]
  value: string | null
  onChange: (value: string) => void
  helper?: string
  variant?: 'default' | 'trend'
  error?: string
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
  helper,
  variant = 'default',
  error,
}: OptionGroupProps) {
  return (
    <div className="option-group">
      <div className="option-header">
        <div>
          <p className="field-heading">{label}</p>
          {helper ? <p className="field-helper">{helper}</p> : null}
        </div>
        {error ? <p className="field-helper has-error-text">{error}</p> : null}
      </div>
      <div className={['option-grid', variant === 'trend' ? 'is-trend' : ''].join(' ')}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={[
              'option-card',
              variant === 'trend' ? 'is-trend-card' : '',
              option.accent ? `accent-${option.accent}` : '',
              value === option.value ? 'is-selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(option.value)}
          >
            {variant === 'trend' ? (
              <span className="option-icon" aria-hidden="true">
                {option.icon}
              </span>
            ) : null}
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

type RangeFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  helper?: string
  tooltip?: string
  formatValue: (value: number) => string
  suffix: string
  onChange: (value: number) => void
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  helper,
  tooltip,
  formatValue,
  suffix,
  onChange,
}: RangeFieldProps) {
  return (
    <label className="range-block">
      <div className="range-header">
        <FieldHeading label={label} tooltip={tooltip} />
        <div className="range-output">
          <strong>{formatValue(value)}</strong>
          <span>{suffix}</span>
        </div>
      </div>
      <input
        className="range-input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="range-ticks" aria-hidden="true">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
      {helper ? <span className="field-helper">{helper}</span> : null}
    </label>
  )
}

type FieldHeadingProps = {
  label: string
  tooltip?: string
}

function FieldHeading({ label, tooltip }: FieldHeadingProps) {
  return (
    <span className="field-heading-row">
      <span className="field-heading">{label}</span>
      {tooltip ? <TooltipBadge label={label} content={tooltip} /> : null}
    </span>
  )
}

type TooltipBadgeProps = {
  label: string
  content: string
}

function TooltipBadge({ label, content }: TooltipBadgeProps) {
  return (
    <span
      className="tooltip-badge"
      tabIndex={0}
      role="note"
      aria-label={`${label}: ${content}`}
    >
      <span className="tooltip-badge-mark">?</span>
      <span className="tooltip-popover">{content}</span>
    </span>
  )
}

type MetricPreviewProps = {
  label: string
  value: string
  tone?: 'soft' | 'accent'
}

function MetricPreview({ label, value, tone = 'soft' }: MetricPreviewProps) {
  return (
    <article className={['metric-preview', tone === 'accent' ? 'tone-accent' : ''].join(' ')}>
      <p className="label">{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

type DriversColumnProps = {
  title: string
  items: DriverWatchoutItem[]
  variant: 'driver' | 'watchout'
}

function DriversColumn({ title, items, variant }: DriversColumnProps) {
  return (
    <section className={`drivers-column variant-${variant}`}>
      <h4>{title}</h4>
      <div className="drivers-list">
        {items.map((item) => (
          <article key={item.title} className="driver-item">
            <span className="driver-icon" aria-hidden="true" />
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function validateStep(
  stepId: StepId,
  retirementProfile: RetirementProfileInput,
  businessProfile: BusinessProfileInput,
): ValidationErrors {
  if (stepId === 'results') return {}

  const nextErrors: ValidationErrors = {}

  if (stepId === 'horizon') {
    if (!retirementProfile.currentAge) {
      nextErrors.currentAge = 'Current age is required for the retirement horizon.'
    }
    if (!retirementProfile.currentInvestments) {
      nextErrors.currentInvestments =
        'Current investments are required to build the age-100 outlook.'
    }
  }

  if (stepId === 'business') {
    if (!businessProfile.annualRevenue) {
      nextErrors.annualRevenue = 'Annual revenue is required for the business value estimate.'
    }
    if (!businessProfile.annualProfit) {
      nextErrors.annualProfit = 'Annual profit is required for the business value estimate.'
    }
    if (!businessProfile.netIncome) {
      nextErrors.netIncome = 'Net income is required for this review.'
    }
    if (businessProfile.addBackAmount == null) {
      nextErrors.addBackAmount = 'Enter the EBITDA add-backs expected to be discussed.'
    }
    if (!businessProfile.industry) {
      nextErrors.industry = 'Select an industry to anchor the market range.'
    }
    if (!businessProfile.topTenCustomerPercent) {
      nextErrors.topTenCustomerPercent = 'Top 10 customer concentration is required.'
    }
    if (!businessProfile.customerConcentration) {
      nextErrors.customerConcentration = 'Select a customer concentration posture.'
    }
    if (!businessProfile.revenueTrend) {
      nextErrors.revenueTrend = 'Select a financial statement trend.'
    }
    if (!businessProfile.addBackProfile) {
      nextErrors.addBackProfile = 'Select an add-back profile.'
    }
    if (!businessProfile.legalExposure) {
      nextErrors.legalExposure = 'Select a legal activity posture.'
    }
  }

  return nextErrors
}

function guidanceForStep(stepId: StepId) {
  if (stepId === 'horizon') {
    return 'Set the household age, investable capital, and longevity horizon first.'
  }
  if (stepId === 'income') {
    return 'Set the annual lifestyle need, then offset it with recurring income and the tax assumption.'
  }
  return 'Focus on earnings quality, concentration, statement history, and legal context.'
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
  return currencyFormatter.format(value)
}

function buildJourneyReadinessScore(
  stepIndex: number,
  retirementProfile: RetirementProfileInput,
  incomeProfile: IncomeProfileInput,
  businessProfile: BusinessProfileInput,
) {
  if (stepIndex >= steps.length - 1) return 100

  const horizonSignals = [
    retirementProfile.currentAge != null,
    retirementProfile.spouseAge != null,
    retirementProfile.currentInvestments != null,
  ].filter(Boolean).length

  const incomeSignals = [
    incomeProfile.apartmentCashflow != null,
    incomeProfile.retirementW2Income != null,
    incomeProfile.consultingIncome != null,
    incomeProfile.passiveIncome != null,
    incomeProfile.currentDebt != null,
  ].filter(Boolean).length

  const businessSignals = [
    businessProfile.annualRevenue != null,
    businessProfile.annualProfit != null,
    businessProfile.netIncome != null,
    businessProfile.addBackAmount != null,
    businessProfile.topTenCustomerPercent != null,
    businessProfile.yearsStatements !== initialBusinessProfile.yearsStatements,
    businessProfile.salesGrowthRate !== initialBusinessProfile.salesGrowthRate,
    businessProfile.customerConcentration !== initialBusinessProfile.customerConcentration,
    businessProfile.revenueTrend !== initialBusinessProfile.revenueTrend,
    businessProfile.addBackProfile !== initialBusinessProfile.addBackProfile,
    businessProfile.legalExposure !== initialBusinessProfile.legalExposure,
  ].filter(Boolean).length

  if (stepIndex === 0) {
    return horizonSignals === 0 ? 0 : Math.min(28, horizonSignals * 9)
  }

  if (stepIndex === 1) {
    return Math.min(62, 28 + horizonSignals * 7 + incomeSignals * 3)
  }

  return Math.min(89, 58 + horizonSignals * 4 + incomeSignals * 2 + businessSignals * 3)
}

export default App
