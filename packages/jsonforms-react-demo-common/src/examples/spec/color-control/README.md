# Example: color control

**Example ID:** `color-control`\
**Demo entry:** **Spec: Color control** (`#spec-color-control`)\
**Domain:** shipping label theme\
**Specs covered:**

- [Portable spec §18 — Color control](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §8 — Color encodings, text entry and clearing](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Adjustments §1 — configuration namespacing](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Gaps §7.3](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md)

One color, seen through every representation it can be stored in. The point of
the example is that **how a color is edited and how it is stored are separate
decisions** — the same picker feeds all of them, and it opens on the channels
the field actually stores.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Nine color properties: seven with `format: "color"`, one plain string selected by the UI schema, one constrained by `pattern`. |
| `uischema.json` | One control per save format, plus the UI-driven selection and the picker-only variant. |
| `data.json` | A valid color in each representation, one stored as HSL (read-only input), one value outside its pattern, and one in a syntax outside the profile. |
| `config.json` | `showUnfocusedDescription` top level; `colorSaveFormat` and `colorTextEntry` under `jsonformsExtended`, per Adjustment 1. |
| `translations.json` | English and Bulgarian, including the per-format entry hints and the `color.hex3Transparency` guidance. |
| `index.ts` | Registers the example with the demo. |

No `uischemas.json`: nothing here nests.

## What the form contains

```text
Shipping label theme
  Brand primary       format: color                       -> #3a7bd5
  Accent              colorSaveFormat: rgb                -> rgb(237, 80, 80)
  Chart series        colorSaveFormat: hsb                -> hsb(154, 76%, 71%)
  Highlight           hex (from config), holding HSL      -> hsl(48, 96%, 53%)
  ---
  Watermark           hex, with alpha                     -> #3a7bd540
  Legacy badge        colorSaveFormat: hex3, pattern      -> #ed5050   (invalid)
  ---
  Status dot          plain string + options.format       -> rgb(82, 196, 26)
  Print spot color    colorTextEntry: false               -> #8c4a9e
  ---
  Imported tint       a syntax outside the profile        -> color(display-p3 ...)
```

## Validation state

Validated with Ajv (`allErrors`, `strict: false`), the supplied data produces
exactly one error:

| Instance path | Keyword | Message |
| --- | --- | --- |
| `/legacyBadge` | `pattern` | must match pattern `^#[0-9a-fA-F]{3}$` |

Ajv also prints `unknown format "color" ignored` for each property. That is
correct and expected: `color` is a **project-defined** format, and §18 requires
each implementation to register a matching definition with its validator. React
does not yet — see gaps [§3.6](../../../../../../docs/jsonforms-react-antd-implementation-gaps.md).
The consequence is visible in this example: `importedTint` holds
`color(display-p3 0.4 0.2 0.6)`, which the control correctly refuses to
interpret, and **no error is reported for it**.

## Expected behaviour

**Pick the same color in three fields and read the Data tab.** Brand primary,
Accent and Chart series store three different strings for one color.
`colorSaveFormat` decides serialization; it does not decide which control is
used, and it does not restrict what may be typed.

**Open each picker and look at the format dropdown.** It shows the format the
field stores — hex, RGB or HSB — every time it opens, not whichever tab was
left selected last. Switching tabs while the panel is open changes what you are
editing, never what is written.

**Every save format is one the picker can edit.** There is deliberately no
`hsl` output: antd's picker has no HSL panel, and a save format the editor
cannot display means dragging one model while recording another. HSL is still
**accepted as input** — see Highlight — so data from a system that emits it is
not stranded. Authoring `colorSaveFormat: "hsl"` falls back to `hex`.

**Type a color in any supported syntax.** Every field accepts `#RGB`,
`#RRGGBB`, `#RRGGBBAA`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hsb()` and
`hsba()` — `hsl(154, 62%, 44%)` typed into Accent is stored as
`rgb(43, 181, 128)`. Text is committed as typed while the field has focus and
rewritten to the configured representation when it loses focus, so an entry is
never rearranged under the caret mid-keystroke.

**Highlight is the HSL case.** It holds `hsl(48, 96%, 53%)` and is left exactly
that way — the swatch and the picker both read it correctly. Edit it and it is
written as hex, the format its config selects. Nothing rewrites it until then.

**Nothing is rewritten on mount.** §18: "do not normalize existing data solely
by mounting the control or changing this option." Every value above is left as
authored until it is edited, including `#ed5050` in a `hex3` field.

**Legacy badge is the three-digit case.** It holds `#ed5050`, which its pattern
rejects; the value stays visible for correction. Choose a color and it is
quantized by `round(channel / 17)` — the spec's own vector is `#ed5050` →
`#e55`, which represents `#ee5555`, the nearest of the 4,096 short-hex colors.
Now drag the picker's alpha slider below full: the edit is **refused**, and the
field shows *"Three-digit hex cannot store transparency…"* rather than
committing an opaque replacement. Alpha is never silently discarded.

**Watermark keeps its transparency.** `#3a7bd540` is roughly 25% opaque. Hex
carries alpha as an eighth pair, which quantizes it to 1/255 — a documented
precision limit, not a rounding error. `rgb` and `hsb` switch to their
`rgba`/`hsba` spelling instead, and fully opaque output omits alpha entirely.

**Status dot has no schema format at all.** `options.format: "color"` on a plain
string selects the same control. §18 allows either path, and the UI-driven one
adds no constraint to the schema.

**Print spot color cannot be typed.** `colorTextEntry: false` replaces the text
field with the picker alone. The trigger is still a real button with an
accessible name — removing text entry removes typing, not keyboard access — and
the stored text is shown beside the swatch exactly as stored.

**Clearing works from inside the picker.** Open any field's picker and use the
clear affordance in the panel. For Print spot color it is the only one there
is, which is why it is not optional.

**Switch the demo to Bulgarian.** The entry hints, the clear-value tooltip, the
picker's accessible name and the hex3 guidance all translate. The stored colors
do not change.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| No `colorSaveFormat` | `hex`, from `jsonformsExtended` in `config.json`, and `hex` again if that were absent too. |
| An unrecognized `colorSaveFormat`, including `hsl` | Falls back to `hex` rather than being passed through. |
| A field left on another picker tab | The next opening is back on the format the field stores. |
| No `colorTextEntry` | Text entry is on. Only an explicit `false` removes it. |
| A value outside the input profile | Kept verbatim, shown verbatim, swatch left empty, picker opens unset. Never replaced by the picker's fallback black. |
| `hex3` with transparency | Refused, with `color.hex3Transparency`. The previous value stands. |
| Named colors (`rebeccapurple`), `color()`, `lab()`, space-separated `rgb(0 255 0)` | Outside the initial profile; treated as unrecognized. |

## Status

**Implemented.** All four save formats, both selection paths, `colorTextEntry`,
clearing from the picker and the hex3 transparency refusal are in
`AntdColorControlRenderer`, with encoding in
[`colorFormat.ts`](../../../../../jsonforms-react-antd-extended-renderers/src/util/colorFormat.ts).
Covered by `colorFormat.test.ts` and `colorControl.test.tsx` in the
antd-extended renderer set.

**Deliberately not implemented:** `colorSaveFormat: "hsl"`, which §18 lists.
See Adjustment 8.1 for why, and the fallback row above for what an authored
`hsl` does.

**Not implemented:** the registered `color` format on the validator, so an
unrecognized color is reported by nothing. `importedTint` is the fixture for
that gap.
