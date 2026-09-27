# Example: presentation elements

**Example ID:** `presentation`\
**Demo entry:** **Spec: Presentation elements** (`#spec-presentation`)\
**Domain:** a course handbook page\
**Specs covered:**

- [Portable spec §13 — ImageView, Separator and Link](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §7 — Wrap, defaults, splitter and Spacer](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §12 — URL and extension security configuration](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §23 — When a selection writes, and when it only displays](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

The elements that read nothing and write nothing: **ImageView**, **Link**,
**Spacer**, **Separator** and **Label**. They are the least interesting
elements in the model and the easiest to get quietly wrong, because a mistake
shows up as an absence.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Four properties: two to bind images and text to, one to hide with, one for the layout row. |
| `uischema.json` | A `Categorization`, one tab per element family. |
| `data.json` | Carries an inline badge image, so `scope` has something to resolve. |
| `config.json` | `allowImageDataUrls: true` — see below. |
| `translations.json` | English and Bulgarian. |
| `index.ts` | Registers the example with the demo. |

## ImageView

**`src`, `scope` and `alt` are top-level fields**, not options:

```json
{ "type": "ImageView", "src": "/images/logo.png", "alt": "Company" }
```

At least one of `src` and `scope` is required, and they are not alternatives
for one another. A defined `src` wins outright — including `""`, which is how
an author says "no image here" without deleting the element. An invalid `src`
does **not** fall through to `scope`, because that would display a different
image than the one that was named.

The second image in the tab is bound instead:

```json
{ "type": "ImageView", "scope": "#/properties/badgeImage", "alt": "Course completion badge" }
```

Clear the **Badge image URL** field and the image disappears without
complaint — "empty or missing source data displays no image". Type something
that is not a URL and it stays gone, with a diagnostic: a non-string value is
reported rather than coerced.

The third image has `alt: ""`. That is the documented way to declare an image
decorative, and a screen reader skips it. A **missing** `alt` is a different
statement, and is reported — the image still renders, because withholding
content over a missing annotation helps nobody.

### Why this example needs a config

`config.json` sets `allowImageDataUrls: true`. The images here are inline
SVG `data:` URLs so the example needs no network, and inline image payloads
are **off by default**: they bypass whatever `img-src` allow-list the host
maintains. Remove the flag and the images are refused, with a diagnostic
naming the source.

The flag opens inline *images* only. A `data:` URL of any other media type
stays refused however it is used, so it cannot become a way to smuggle in a
document.

## Link

A Link navigates. A Button invokes a command — they are not interchangeable,
and a renderer may style a Button to look like a link without becoming one.

| Element | Result |
| --- | --- |
| `href: "https://example.com/courses"` | An ordinary anchor. |
| `target: "_blank"` | `rel="noopener noreferrer"` is added. |
| `href: ""` | Plain, non-navigating text. |
| `href: "javascript:alert(1)"` | Plain, non-navigating text. |

`noopener` is a **MUST**: without it the opened page receives a handle on this
one and can navigate the form away. `noreferrer` is a SHOULD, and is added.
An author-supplied `rel` is kept, and these are added to it.

The last two rows are the same behaviour for two different reasons. An empty
href is legitimate and renders "plain semantics rather than inventing a
destination"; a refused scheme is treated identically, so the label stays
readable and nothing becomes clickable.

## Spacer and Separator

**`size` is a top-level field on Spacer**, defaulting to 32. The tab shows
the default and an explicit 64.

**`options.vertical` is Separator's one orientation encoding**, following the
project convention rather than a JSON Forms core option. The vertical
separator in the row also carries `aria-orientation="vertical"`, because an
`<hr>` has an implicit `separator` role whose orientation defaults to
horizontal — without it a screen reader describes two side-by-side sections as
stacked.

A vertical separator takes its extent from the layout and supplies none of its
own, which is why it appears inside a `HorizontalLayout` here. On its own in a
column it would have no height to fill.

## Expected behaviour

| Action | Result |
| --- | --- |
| Turn off **Show the banner** | The banner goes; the rule governs it like any element. |
| Clear **Badge image URL** | The bound image goes, with no message. |
| Open the Link tab | Two anchors, two pieces of plain text. |
| Inspect the `_blank` link | `rel="noopener noreferrer"`. |
| Edit anything | No presentation element reacts, because none of them reads the data — except the bound image, which is the one that does. |

## Fallback behaviour

| Situation | Result |
| --- | --- |
| `src` and `scope` both absent | `image.noSource`. |
| `scope` points at a non-string schema | `image.scopeNotString`. |
| Bound value is an object or a number | `image.nonStringSource` — never coerced. |
| `alt` omitted | `image.missingAlt`, and the image still renders. |
| Any source the URL policy refuses | `image.urlRefused`, and no image. |
| `options.src` / `options.alt` | Still read, below the top-level fields. |

## Status

**Implemented.** ImageView's top-level fields, its `scope` resolution, its URL
policy and Separator's orientation were all added for this example; see
[adjustments §23](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
for what each of them was doing before.

Covered by `presentationExample.test.tsx` for this fixture, `imageView.test.tsx`
for the source-resolution rules, `linkRenderer.test.tsx` for `rel` and the
inert cases, and `layoutPrimitives.test.tsx` for Spacer and Separator.

## Link localization and zero spacing

The Links tab also includes a relative handbook link, a documentation link in
a new tab, and a `mailto:` link. Each has an explicit `i18n` prefix and matching
English/Bulgarian catalog entries. Change locale to compare them with the
unprefixed **Untranslated link**, which keeps its authored label. These are
example destinations, not application routes supplied by the demo.

The spacing tab ends with `size: 0`. It contributes no spacer height, unlike
an omitted size, which uses the default. These presentation elements do not
change the fixture's validation state.
