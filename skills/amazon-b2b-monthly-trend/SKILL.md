---
name: amazon-b2b-monthly-trend
description: "Analyze Amazon product monthly B2B orders, units, and sales to identify enterprise-procurement trends, product tiers, and B2B operating opportunities. Use when users request Amazon B2B demand analysis, enterprise purchasing trend analysis, B2B share analysis, or B2B product segmentation from monthly ASIN data."
---

# Amazon B2B Monthly Trend

Analyze monthly ASIN-level Amazon data to distinguish genuine B2B demand from share movements caused by consumer-sales changes. The default output is a self-contained Chinese HTML report. Produce an XLSX companion only when requested.

## Input recognition

Automatically map equivalent input fields. Required concepts are ASIN, product name, month, total orders, B2B orders, total units, B2B units, total sales, and B2B sales. Typical Chinese headers include `年&月`, `订单量`, `销量`, `销售额`, `B2B 订单量`, `B2B 销量`, and `B2B 销售额`.

Do not stop solely because headers differ. State the mapping in the deliverable. If a required concept cannot be identified, report the missing concept and request the source definition.

## Default analysis window

Unless the user specifies otherwise, focus on the latest six complete calendar months available. Treat the latest three months as the recent window and the preceding three months as the comparison window. Recompute all product classifications and scores within that selected window; do not blend older data into the score.

If the user asks for a different window, preserve the same recent-versus-prior comparison logic when possible and state the window clearly.

## Data quality and calculation rules

Before conclusions, inspect month continuity, duplicate ASIN-month records, missing key fields, B2B values exceeding total values, zero/contradictory-zero rows, product starts/stops within the window, product-level B2B outlier months, and portfolio monthly anomalies. Keep anomalous rows and label their possible effect; do not silently delete them.

Calculate B2B order share, B2B unit share, B2B sales share, B2B unit growth, total-unit growth, and B2B unit-share change separately. Use weighted ratios after aggregating the relevant totals; do not average product ratios.

Interpret movement explicitly:

- B2B units and total units both rise, with B2B growing faster: genuine B2B growth and rising importance.
- B2B units are stable while total units fall: passive share lift, not confirmed B2B growth.
- B2B units rise but total units rise faster: B2B growth with declining importance.
- B2B units and share both fall: probable real B2B weakening; check inventory, price, listing, and competition before acting.

For products with low B2B volume, zero denominator, interrupted availability, or only a short history, label the sample as insufficient or new-product observation instead of assigning a strong growth conclusion.

## Product segmentation and scoring

Classify products by scale, B2B unit share, share change, B2B versus total growth, and stability. Use the following labels only when supported by sufficient volume and coverage:

- A: high B2B share, B2B units growing, share rising, and total demand not materially deteriorating.
- B: high B2B share with a stable multi-month pattern.
- C: lower current share but accelerating B2B units and rising share; validate before scaling.
- D: previously high share with a recent decline; distinguish true B2B decline from consumer-led dilution.

Build a 100-point potential score with visible components: B2B scale (25), B2B share (25), growth/share trend (25), stability (15), and total-product growth (10). Use percentiles or another transparent relative method; do not imply that the score is an external benchmark.

Read [references/report-spec.md](references/report-spec.md) before preparing the final report.
