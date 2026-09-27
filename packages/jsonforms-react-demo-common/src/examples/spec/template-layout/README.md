# Example: template layout, three engines

**Example ID:** `template-layout`\
**Demo entry:** **Spec: Template layout: three engines** (`#spec-template-layout`)\
**Domain:** event registration\
**Specs covered:**

- [Portable spec §13 — TemplateLayout fields and profiles](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §14 — script evaluation permission, and function-valued extension points](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §22 — Two template engines](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)
- [Adjustments §29 — TemplateLayout, authored in TypeScript](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

The same five things, written three times: in `lang: "jsx"`, in
`lang: "ractive"`, and as a **TypeScript function**. Put next to each other
they answer the question the profiles actually raise — what changes when you
switch, and what does not.

## Layout of the page

A `Categorization` gives each engine a tab, so one is on screen at a time:

| Tab | Holds | Portable |
| --- | --- | --- |
| **lang: jsx** | The JSX template, the note it slots, and `{elements}` over the whole child list. | yes |
| **lang: ractive** | The Ractive template and the note it slots. | yes |
| **native (TypeScript)** | The same template as a function, plus what only a function can do. | **no** |
| **Language resolution** | The template with no `lang`, and the one asking for an engine nobody implements. | yes |

**Customer** and **Priority booking** sit *above* the tabs, on purpose: they
are what all three templates read, so they have to stay reachable whichever
tab is open. Editing one of them is how the reactivity below is seen.

The third tab is not in `uischema.json` and cannot be. Its `template` is a
function, which has no JSON spelling, so the tab is appended in `index.tsx` —
the same boundary the Button example draws, drawn the same way. **Open the UI
schema panel on that tab:** the `TemplateLayout` is there and its `template`
is not, because `JSON.stringify` drops a function silently.

The split is also the clearest demonstration that an engine is a separate
registered renderer: open the network panel, switch tabs, and the second
compiler is fetched at that moment — not when the form loaded.

## Files

| File | Role |
| --- | --- |
| `schema.json` | One property edited above the templates, one boolean for the branch, a list to iterate, one note per engine to slot, and two more for the array form. |
| `uischema.json` | Two shared controls, then a `Categorization` holding five `TemplateLayout`s: jsx, jsx over the whole child array, ractive, one with no `lang`, and one with a language nobody implements. |
| `data.json` | Enough to make every branch and the list visible on load. |
| `config.json` | `jsonformsExtended.defaultTemplateLang: "ractive"` and `jsonformsExtended.security.allowScriptEvaluation: true`. |
| `translations.json` | English and Bulgarian. |
| `index.tsx` | Appends the **native** tab — a function template, which no JSON file can hold — and registers the example. |

## The same template, twice

| | `lang: "jsx"` | `lang: "ractive"` |
| --- | --- | --- |
| interpolate | `{data.customerName}` | `{{data.customerName}}` |
| branch | `{data.priority ? 'A' : 'B'}` | `{{#if data.priority}}A{{else}}B{{/if}}` |
| iterate | `{data.contacts.map(c => c.name).join(', ')}` | `{{#each data.contacts}}{{ @index ? ', ' : '' }}{{ .name }}{{/each}}` |
| slot a child | `{elements['jsxNote']}` | `{{>ractiveNote}}` |

And the third column, which is not a language at all:

| | native (TypeScript) |
| --- | --- |
| interpolate | `{formData?.customerName}` |
| branch | `{formData?.priority ? 'A' : 'B'}` |
| iterate | `{(formData?.contacts ?? []).map(c => c.name).join(', ')}` |
| slot a child | `<Slot name='nativeNote' />` |

It reads like the JSX column because it is JSX — the difference is that
**nothing is compiled at runtime**. The build compiled it, so there is no
parser in the bundle for it, no `new Function`, and no
`allowScriptEvaluation`: that permission exists for CSP `unsafe-eval`, and a
function has no use for it. Switch the permission off and this tab keeps
working while the other two explain themselves.

### What only the native tab can do

```tsx
const Pill = ({ children }) => <span data-pill>{children}</span>;

const nativeTemplate: TemplateRender<RegistrationData> = ({ data, Slot, errors, readonly }) => (
  <p><Pill>{errors.length} problems</Pill>{readonly ? ' · read-only' : ' · editable'}</p>
);
```

- **A component registered nowhere.** `Pill` is defined beside the template and
  used directly. A string template can only reach what the engine chose to put
  in its scope; a function reaches whatever is in lexical scope.
- **Types.** `data` is typed through the type argument, and `Slot`, `errors`
  and `readonly` come from `TemplateRenderProps`. Misspell `data.custmerName`
  and it is a compile error, not an empty span.
- **`readonly` separately from `enabled`.** A read-only form disables its
  controls too, but the two mean different things to a widget, and the
  template is told both.
- **A fallback for an undeclared slot.** `<Slot name='notDeclared'>…</Slot>`
  renders its children and warns `template.unknownSlot`, rather than going
  quiet.

Both print `Contacts: Ann, Bo, Cy`.

### `elements` is a list as well as a map

The jsx tab carries a second template that does not name anything:

```jsx
<div data-children>{elements}</div>
```

Rendering the binding itself **mounts every child, in order** — the two
controls below it, one named and one not. It is the ordinary way to write a
custom layout: the template decides the surroundings and lets the children fall
where they are declared, instead of listing each one by name.

**Only the jsx profile has this.** Ractive places children as named partials,
and there is no partial meaning "all of them", so the row above has no Ractive
column. That asymmetry is the reason the two engines sit in one example: they
are the same feature, not the same language.

The example names its *first* child deliberately. An unnamed child falls back
to its decimal index as its name, so a list where nothing is named resolves by
position either way and hides a whole class of mistake — which is exactly what
happened: `{elements}` once returned internal wrappers instead of the elements,
and every test passed because none of them had named a child in a list rendered
as an array. See [adjustments §28.3](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

## Expected behaviour

### Reactivity

**Type in Customer.** The greeting on the open tab updates on every keystroke,
and **the slotted note loses neither its cursor nor its text**. Switch tabs and
the other engine shows the same new value — both read the same form data. That is the whole point of the
feature: the templates are patched around the controls rather than rebuilt with
them.

The two get there differently. The JSX profile re-runs its template function
and lets React diff; Ractive never re-runs the template at all — `set` patches
the bound text node. Both leave the slotted control's DOM node identical, which
is what the test asserts.

### Iteration is where the languages differ most

JSX has the whole of JavaScript, so `.map().join(', ')` works. **Ractive has no
function literals** — `{{ customers.map(c => c.name) }}` is a parse error, not a
silent failure. Iteration is `{{#each}}`, or a helper injected through the
bindings.

That restriction is not an accident: it is why Ractive's `new Function` only
ever compiles `return (expr)`.

### A whitespace trap worth knowing

The obvious Ractive separator is wrong:

```hbs
{{#each data.contacts}}{{.name}}{{#if @index < data.contacts.length - 1}}, {{/if}}{{/each}}
```

That renders `Ann,Bo,Cy` — Ractive collapses template whitespace, so the space
after the comma disappears. It looks like a typo in the data.

Three forms survive it; the fixture uses the third:

| Form | Output |
| --- | --- |
| literal `, ` between mustaches | `Ann,Bo,Cy` |
| `{{', '}}` as an expression | `Ann, Bo, Cy` |
| `{{ @index ? ', ' : '' }}` before each item | `Ann, Bo, Cy` |

`preserveWhitespace: true` also fixes it, but it changes whitespace handling
for the whole template, so it is not what this renderer does.

Note also that Ractive has **no `@last`** — `{{#unless @last}}` silently emits
nothing, which is the same symptom by a different route.

### Choosing the engine

Both live under the **Language resolution** tab.

**A template with no `lang`** takes `config.jsonformsExtended.defaultTemplateLang`, which this
example sets to `ractive`. Remove that key and it would still be `ractive`, the
default of last resort. An explicit `lang` always wins over both.

The choice is made in the **tester**, so each engine is a separate registered
renderer and only the one an element asks for is ever loaded.

**An unknown language is diagnosed.** The last template asks for
`lang: "handlebars"` and renders a message naming it, not a guess at another
engine — "unknown or unsupported languages must be diagnosed rather than
interpreted as another engine". A form that quietly fell back would render the
wrong thing and say nothing.

### Both engines need permission

`config.json` sets
`jsonformsExtended.security.allowScriptEvaluation: true`. **Remove it and both
templates stop**, each replaced by a message naming the key.

That is not over-caution about the JSX profile only. Ractive compiles every
`{{ }}` expression through `new Function` as well — narrower than compiling a
component body, and still string evaluation, still needing CSP `unsafe-eval`.
The renderer reports the refusal rather than weakening anything, which is what
the specification asks for.

### Neither compiler is in the initial bundle

Both engines load through `React.lazy`. A form with no `TemplateLayout`
downloads neither; a form of only `ractive` templates never downloads Sucrase.
Measured on the demo build: the app entry contains no `sucrase` and no
`Ractive.parse`, which live in a 224 KB and a 360 KB chunk respectively.

## Fallback behaviour

| Situation | Result |
| --- | --- |
| Explicit `lang` | Wins over everything. |
| No `lang`, `defaultTemplateLang` set | That engine. |
| Neither | `ractive`. |
| A language no engine implements, from either source | Diagnosed, naming what was asked for. |
| `allowScriptEvaluation` absent or false | Both **string** engines refuse, and say why. The native tab is unaffected — there is no string to evaluate. |
| A named child | A partial (`{{>name}}`) or an `elements[...]` entry. |
| An unnamed child | Its decimal index becomes the name. |
| A child that can be given no name | Unaddressable, not unrenderable: it still has a position, so `{elements}` mounts it. |
| `{elements}` in a Ractive template | Not a thing; Ractive places children as named partials only. |
| `<Slot name='…'>` naming no child | Renders the slot's children as a fallback, and warns `template.unknownSlot`. |
| The model is serialized | The native tab's element survives; its `template` does not. |

## Status

**Implemented** for all three profiles. `lang: "vue"` is not implemented; the
specification describes it as requiring a Vue runtime and not portable across
web renderer sets.

Covered by `templateChildren.test.tsx` for the two ways a template reaches its
children, by `templateLayoutExample.test.tsx` for this fixture — each tab
selected in turn, and **all three** engines held to the same five assertions
inside their own panels — by `tsxTemplateLayout.test.tsx` for the native
contract, and by `templateEngines.test.tsx` for the engine contract:
selection, both diagnostics, the gate on each string engine, partials, and the
no-remount guarantee.

Adding the native tab to that shared table immediately earned its keep. The
TSX profile **failed the no-remount assertion**: its `Slot` was a
`useCallback`, so its identity moved whenever the parent handed down a fresh
`renderers` array — and a `Slot` is used as a *component type*, which React
remounts when the type changes. Every slotted control was being torn down and
rebuilt on each keystroke, taking the cursor with it. `Slot` is now created
once and reads its inputs from a ref.

Building this fixture surfaced a bug in the tabs variant of `Categorization`:
every panel rendered the *selected* category, so visiting a second tab left the
first one — still mounted, merely hidden — rendering the selected category too,
and both notes here came back identical. Fixed in `CategorizationLayout`, with
`categorizationTabs.test.tsx` guarding it.
