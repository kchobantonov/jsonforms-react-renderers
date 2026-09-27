# How the consolidated specification was produced

A record of the consolidation that produced
[jsonforms-extended-ui-model-consolidated-spec.md](jsonforms-extended-ui-model-consolidated-spec.md):
what went in, what was deliberately changed, and **what is not yet covered**.

Read this before treating the consolidated document as complete. It is
substantially complete for §1–§17 and §19–§28, and **partial for §18**, the
renderer catalogue.

## Sources

| Source | Lines | Role |
| --- | --- | --- |
| [jsonforms-extended-ui-model-spec.md](jsonforms-extended-ui-model-spec.md) | 6,835 | The portable specification. Verbatim upstream copy, never edited |
| [jsonforms-extended-ui-model-adjustments.md](jsonforms-extended-ui-model-adjustments.md) | 5,278 | 34 amendments, narrowings and added rules |
| [jsonforms-container-validation-indicator-spec.md](jsonforms-container-validation-indicator-spec.md) | 485 | Proposal for a shared container error indicator |

Output: **2,720 lines, 28 sections, no outbound links.** All three sources are
untouched.

## Editorial rules applied

1. **Adjustments became specification text.** No "Adjustment 12 says…"
   framing. The rules are stated normatively in the section they amend.
2. **Rationale was kept.** Most of these rules exist because the obvious
   alternative was tried and failed silently; the explanation is what stops it
   being reintroduced. The preamble says so, so a reader does not mistake it
   for commentary.
3. **Implementation reportage was dropped** — status tables, test filenames,
   package paths, "implemented in the X renderer set". A specification says
   what conforming behaviour is, not who has achieved it.
4. **Vendor and framework names were removed**, and the underlying rule stated
   instead. The one survivor is `ag-grid` as a `variant` **value**, which is
   part of the wire format rather than a reference to a library.
5. **Cross-document links were removed**, so the result is self-contained.

## Where each adjustment landed

| Adjustment | Consolidated section |
| --- | --- |
| 1 Configuration namespacing | §1.2 |
| 2 Container validation indicator | §8.3 |
| 3 Every spec carries a worked example | §24 |
| 4 Data-presence indicator tooltip | §8.2 |
| 5 Indicators computed from an index | §8.4 |
| 6 Renderer strings through the translator | §9.8, §9.9 |
| 7 `vertical` orientation | §5.6 |
| 8 Colour encodings | §18.18.3 |
| 10 Categorization navigation | §8.6, §8.7 |
| 11 Masked string control | §18.18.6 (compressed) |
| 13 Tuple control | §18.11 |
| 14 Dynamic property names | §18.16 |
| 15 Array element type cannot be cleared | §18.17 |
| 16 Choice searchability and array-choice variants | §5.4, §5.5 |
| 17 Confirmation policy | §14.3 |
| 19 Pre-touch error filtering | §15.7 |
| 21 Layout sizing model | §6, §7 |
| 22 Two template engines | §13.5 |
| 23 When a selection writes | §18.17 |
| 24 Button contract | §14, §14.1, §14.2 |
| 27 `name` belongs to the element model | §2.1 |
| 28 Addressing a template's children | §13.5 |
| 29 TemplateLayout authoring | §13.5 (generalised) |
| 31 Renderer-published additional errors | §15.6 |
| 32 Duration picker | §18.18.2 |
| 33 Queued edit cancellation | §18.4 |
| 34 Authoring in a typed language | §20.1 |

The container-validation-indicator document became **§8.3 and §8.4** in full,
including its defaults table, its "what it must not suppress" rules, and the
index-based computation.

## Deliberate divergences from the sources

- **§24's recommended example domains** no longer include items or
  insurance. The upstream list did; the house rule excludes that domain, so
  the list was replaced. This is the one place the consolidated text
  contradicts its source rather than merging it.
- **The third configuration tier is unnamed.** The adjustments register names
  a specific product namespace; the consolidated text describes the rule and
  leaves the key to the implementation.
- **§7.1's gap default is stated as a rule, not a number.** The adjustment
  fixes 16px for a row and 0 for a column because of one design system's
  metrics. The consolidated text requires the default to be
  direction-dependent and explains why a single number double-spaces a family
  that already has vertical rhythm, without prescribing the value.

## Not yet covered

These were in the sources and did **not** make it into the consolidated
document. Each is a real omission, not a compression.

### Missing renderer catalogue entries (§18)

| Missing | Source |
| --- | --- |
| **Temporal controls** — date, time and date-time entries with `dateFormat`/`dateSaveFormat` and the rest, picker bounds, `views`, `ampm`, `showActions` | Spec §18; Adjustment 25 |
| **Mixed-value control and deep-structure navigation** | Spec §18 |
| **Expandable array-item forms and list-with-detail** as distinct entries | Spec §18 |
| **Shared array item labels** (`elementLabelProp`) | Spec §18 |
| **Scalar control entries** — string, multiline, number, integer, boolean, slider, password | Spec §18 |
| **Fixed-length code entry variant** | Adjustment 9 |
| **Expandable array expansion state** | Adjustment 18 |
| **Showing validation must not change the element tree** | Adjustment 12 |
| **Placing a tuple's positions with a layout** — only the tuple entry itself is in | Adjustment 20 |
| **Renderer selection examples** | Spec §18 |
| **Choice-label translation** worked detail | Spec §18 |

### Missing validator material

The **extended validator profile** — authored error messages, value
normalisation keywords, computed initial values, localized validator wording,
and the permission gating compiled expressions — is not in the consolidated
document. Adjustments 26 and 30, and the corresponding spec material.

This is the largest single omission by volume, and it is self-contained: it
would become a new section rather than being folded into an existing one.

### One naming gap worth fixing first

**`hideArraySummaryValidation` is described but never named.** §18.9 states the
rule — an option that suppresses the child-error summary does not suppress the
array's own error explanation — without giving the option its canonical name.
A normative document has to name the option it constrains. Same check is worth
running for any other option described only by its behaviour.

## How to verify or finish it

- **Section skeleton:** the consolidated document keeps the source's 28-section
  numbering, so sections can be diffed against the original one at a time.
- **To check nothing was lost from an adjustment**, find it in the mapping
  table above and read the named section. Adjustments absent from that table
  are absent from the document.
- **To find remaining vendor references:** search for framework, library and
  product names. At the time of writing, `ag-grid` is the only hit, and it is
  a wire-format value.
- **To confirm self-containment:** the document should contain no markdown
  links at all.
