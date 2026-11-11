# Evidence Rules

Use these rules whenever the inputs are incomplete, mixed, or ambiguous.

## Scope Control

- Filter to the exact requested product family, parent, ASIN set, or variant group before analyzing.
- Do not merge multiple product forms just because they share a category.
- If the user gives a keyword library for a whole product line but asks for one sub-line, say which terms are line-wide versus sub-line-specific.

## Demand Inference Rules

- Treat explicit persona, JTBD, scenario, pain, or purchase-driver statements as strongest evidence.
- Treat repeated VOC themes as supporting evidence.
- Treat keyword semantics alone as weaker evidence unless supported by product or VOC inputs.
- Mark claims as `证据不足` when:
  - the keyword implies a scenario not present in the demand map
  - the product data conflicts with the keyword expectation
  - a recommendation would require assumptions about audience or usage not present in the inputs

## Keyword Fit Rules

### Good-fit keyword

Use when the keyword aligns with:
- the actual product form
- the intended user task
- supported scenarios
- supported purchase drivers

### Weak-fit keyword

Use when the keyword has some relevance but needs careful placement, usually in:
- bullets
- A+
- backend search terms

### Misleading keyword

Flag it when it risks:
- wrong product-form expectation
- wrong size/spec expectation
- cross-category confusion
- overpromising a result the inputs do not support

Do not force misleading keywords into the title just because they have traffic.

## Communication Mapping Rules

- Put identity-defining keywords in the title.
- Put explanation-heavy keywords in Bullet or A+.
- Put scenario-proof keywords in images when visual proof matters.
- Put long-tail or synonym coverage terms in backend when they add reach without hurting clarity.
- Keep "why not use this keyword" visible when wrong traffic is a meaningful risk.

## Reporting Rules

- Make every major claim traceable to an input source.
- Prefer concise reasoning over generic SEO theory.
- If the user asks for a formal output, preserve the same evidence logic in Markdown, HTML, or spreadsheet form.
