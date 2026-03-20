# PivotPoint Valuation Experience

A static React + TypeScript experience for a premium, advisory-led business valuation workflow.

## What it includes

- 4-step guided workflow:
  - Business Profile
  - Quality & Transferability
  - Review & Analyze
  - Results Report
- Local scenario-bucket logic only
- Responsive desktop and mobile layouts inspired by the Stitch exports
- No backend, auth, persistence, or live valuation calculations

## Local development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```

## Notes

- The output is intentionally illustrative and should never be presented as a formal valuation.
- Core logic lives in:
  - `src/types.ts`
  - `src/content.ts`
  - `src/engine.ts`
- Main UI lives in:
  - `src/App.tsx`
  - `src/App.css`
