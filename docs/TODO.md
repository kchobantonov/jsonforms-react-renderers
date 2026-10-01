# Known defects and open work

Open items in the React renderer sets, worst first. Each entry says what is
wrong, how to reproduce it, **what has already been ruled out**, and where the
detail lives — so picking one up does not mean repeating the investigation.

The two reference documents are
[the adjustments](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md), which records
where this implementation adds to or departs from the portable specification,
and [the gaps review](jsonforms-react-antd-implementation-gaps.md), which
tracks specification coverage. This file is only the actionable subset.

## Defects

> **Closed:** entry 1 was "a summary-only registry entry hangs the tuple
> dialog". It was neither tuple-specific nor dialog-specific: **any**
> UI-schema registry entry that is a `Control` matching an object's schema
> made `ObjectRenderer` dispatch it back to itself, exhausting the heap on
> first render. The recorded observation that "an entry with no options at all
> is fine" was the opposite of the truth, and is what sent the investigation
> at `dialogOptions`. Fixed by a cycle guard; see
> [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) for the whole
> account, including why nothing threw.
>
> **If `uiSchemaRegistryCycle.test.tsx` ever takes the run down with an
> out-of-memory abort rather than failing**, that is this bug returning. An
> infinitely deep React tree is legal, so there is nothing to catch.

### 1. Object-level errors are never displayed

**Severity: medium — the form can be invalid with nothing on screen.**\
**Detail:** [gaps §6.1](jsonforms-react-antd-implementation-gaps.md), and the
worked example
[object-control](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/examples/object-control/README.md)

`ObjectRenderer` renders no `errors` prop, so an error at an object's own path
has nowhere to go. What is actually lost depends on where core maps each error:

| Error                  | Mapped to            | Shown?               |
| ---------------------- | -------------------- | -------------------- |
| `dependencies`         | the missing property | yes, on that control |
| `additionalProperties` | the offending key    | no                   |
| `minProperties`        | the object itself    | no                   |

The specification's harder requirements _are_ met — no field is mislabelled as
required and no value is invented — so this is a missing message, not corrupted
data.

## Upstream

### 2. JSON Forms core: a tester resolves a scope only for object schemas

**Severity: medium — blocks deleting a workaround here.**\
**Detail:** [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md),
which is written to be handed to a PR author as-is.

`schemaMatches` and `schemaSubPathMatches` resolve a Control's `scope` only
when the enclosing schema is an object, so a scoped Control dispatched against
an array — a tuple — is offered the whole array schema, matches no renderer,
and renders blank with no error.

The fix is two lines. Measured against `@jsonforms/core@3.9.0-alpha.1` in this
repo: the failing tester flips to `true`, the deep-scope tests pass with our
workaround removed, and all 1098 tests passed with no regressions. Upstream's
own array tests still need running before merging.

**Until then** `TupleControlRenderer` re-roots such scopes itself. That
workaround is marked `TODO` in the source, and Adjustment 20.6 lists exactly
what to delete once the fix lands.

> **Template script evaluation** used to be listed here as an ungated
> `new Function` reachable from a UI schema. It is gated now — both template
> engines require `jsonformsExtended.security.allowScriptEvaluation`, and a
> host that has not granted it gets an explanation rather than a blank region.
> See [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).
>
> **Also closed:** `href={data.url}` in a template used to bypass the
> `isAllowedUrl` policy, so `javascript:` went through verbatim. It is checked
> now — in the `createElement` pragma for the `jsx` profile, and in a DOM pass
> over the rendered subtree for `ractive`. Fifteen URL-bearing attributes, not
> just `href`. See [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).
>
> **Known limit, deliberately documented rather than hidden:** Ractive owns its
> DOM and exposes no hook for a bound attribute value, so the check runs
> immediately _after_ the attribute is written — same synchronous block, nothing
> painted, no click possible. A `src` may already have begun loading. The `jsx`
> profile has no such window. The native TSX profile is code rather than data
> and applies the policy itself, with `urlPolicy` handed to the template.

## Unimplemented options

These are specified, exposed, and do nothing yet.

> The layout sizing model (§6–§7) used to be listed here. It is implemented —
> see [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md). Two options
> were removed with it: `trim`, which the contract excludes, and `columns`,
> which it does not define but which the Svelte family reads. A form using
> either now gets a diagnostic.

### 3. `hideRequiredAsterisk` on ordinary controls

**Detail:** [gaps item 26](jsonforms-react-antd-implementation-gaps.md)

Honoured on array and list-with-detail labels, ignored by scalar controls.

**The trap:** antd sets `aria-required="true"` from `Form.Item`'s `required`,
so passing `required={false}` would strip accessible required state, which the
specification forbids — "without changing required validation or accessible
required-state information". The asterisk has to be hidden in CSS with
`required` left on.

### 4. Pre-touch error filtering does not cover array or tuple summaries

**Detail:** [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md)

Implemented for every control that prints its own errors. An array header keeps
showing its child-error summary regardless of touch state.

Deliberate, not an oversight: the specification asks for summary participation
to be _documented_ per renderer rather than assumed, and the Svelte family these
options come from does not claim it either. Listed here so it is a decision on
the record rather than a surprise.

### ~~4a. ICU interpolation and `textParams` (§9)~~ — done, with CEL

> **Closed.** Interpolation is implemented, but **not with ICU**: placeholders
> are CEL expressions, which is what let §9 and §11.4 share one grammar. The
> ICU analysis that follows is kept because it is why ICU was rejected, not
> because it is pending. See
> [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).
>
> Still open: no element other than `Label` interpolates, and a control's
> `description` reads neither markup nor placeholders.

#### The original entry

**Detail:** [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md),
[gaps §3.7](jsonforms-react-antd-implementation-gaps.md)

`options.markup: "markdown"` is implemented; `options.interpolate` and
`textParams` are not. The **markup half is done and the interpolation half is
not**, which is the useful state to record: the two are independent requests
on the same element, and a refused Markdown request keeps `interpolate` in the
resolved result (`resolveMarkup` in `util/markup.ts`) so nothing has to change
there when this lands.

What is already decided, so this does not restart the design:

- **Order is interpolate → escape → parse.** Escaping after parsing is too
  late, the link already exists. `escapeMarkdown` in `util/markdown.tsx` is
  written and tested; it has no caller yet.
- **No security gate is needed**, provided the ICU implementation
  _interprets_. ICU MessageFormat has no property access and no function
  calls, and `intl-messageformat` walks an AST rather than compiling one —
  **verified** against 10.7.18 with `@formatjs/icu-messageformat-parser`
  2.11.4: no `eval` and no `new Function` anywhere in either package's
  runtime, and `parse()` returns a plain AST the formatter walks. An
  implementation that _compiles_ messages to JavaScript would need the same
  gate as a template engine. The package is not yet a dependency here, so
  re-confirm on whatever version actually lands.
- **The tester must widen**, from the markup-only predicate in
  `MarkupLabelRenderer` to `wantsMarkup` in `util/markup.ts`, which already
  admits `interpolate: true` and is tested. Until then an interpolating Label
  is left with the base renderer, which shows its text unformatted.

**How to satisfy "a missing simple parameter yields empty text":** ICU
`format({})` **throws** on a referenced-but-absent argument, while
`format({name: undefined})` yields `"Hi "`. So the implementation must
enumerate the pattern's argument names from the AST and pass every one of
them, filling the absent ones with `undefined`. The names are reachable —
walking `parse()`'s output for non-literal nodes returns `["a","b","c"]` for
`"{a} and {b, plural, one {# of {c}} other {#}}"` — and the round trip was
checked end to end. Without that step the renderer throws where the
specification asks it to degrade.

Not decided: whether a missing parameter's diagnostic is reported the same way
as a markup refusal, and what carries `textParams` for a control's
`description`, which no renderer reads markup on at all. **Whether ICU is also
the `$dynamic` template language is [Decision 5](#6-dynamic-11--the-shape-is-agreed-five-decisions-are-open).**

## Watch list

Not reproduced, not fixed — recorded so a recurrence is recognised rather than
investigated from scratch.

### 5. Intermittent failures in the antd-extended suite — three causes found

Four files have now each failed **once**, during a back-to-back run of all
package suites, and each passed on re-run and in isolation — repeatedly, never
reproducing:

| File                                  | Symptom                                           |
| ------------------------------------- | ------------------------------------------------- |
| `confirmationExampleRenders.test.tsx` | `flushUntil: condition still false after N ticks` |
| `monacoTheme.test.tsx`                | "never mutates the global theme registry (dark)"  |
| `agGridCells.test.tsx`                | "renders the field control inside a data cell"    |
| `cellErrors.test.tsx`                 | "marks the invalid cell with an error state"      |

All four mount heavy components behind `React.lazy` (AG Grid, Monaco) and
measure layout through stubbed `ResizeObserver`s. The grid fixture's tick
budget was raised to 120 for the first of them; that plainly was not the whole
story.

**Ruled out:** the temporal, combinator, Ajv and locale work — the pattern
predates all of it, and reverting those changes does not stop it.

**Tried: setting `IS_REACT_ACT_ENVIRONMENT` for the package.** It was set in
one test file out of twenty-two, and the flaky files were all among the
twenty-one without it — a good match for the symptom, since React does not
flush passive effects when `act` exits unless the flag is on, so a lazy chunk
resolving late can land after the assertion.

It is now set in `test/setup/matchMedia.ts`, and it **has not fixed it**: five
of six full-suite runs since are clean where it previously failed about every
other run, but `agGridCells` still failed once. Keep the flag — it is correct
regardless, and matches the stable sibling package — but treat the cause as
still unknown.

**Where to look next:** the failures only appear under full-suite load, never
with the heavy files alone (four consecutive clean runs of
`agGridCells` + `cellErrors` + `monacoTheme` together). That points at
cross-file contention — worker concurrency, or a module-level cache shared
through the `React.lazy` chunks — rather than at any one test. Running the
package with `--pool=forks` or `--maxWorkers=1` would separate those two
hypotheses cheaply.

**One cause found, in the sibling package — and it may be the whole of it.**
A full-suite run failed `@chobantonov/jsonforms-react-antd-renderers` while
reporting **829 of 829 tests passing**: the failure was an _unhandled error_,
not an assertion —

```
ReferenceError: ResizeObserver is not defined
  at ensureResizeObserver (@rc-component/resize-observer)
  at flushPassiveEffects (react-dom)
originated in test/autocompleteChoice.test.tsx
```

Twenty of that package's ninety test files declared their own `??`-guarded
`ResizeObserver`; the other seventy had none. It went unnoticed because antd
attaches the observer in a **passive effect**, so a test that finishes first
never reaches it — and whether it is reached is exactly the kind of thing a
parallel run changes. It is now declared package-wide in
`test/setup/jsdomShims.ts`, alongside `IS_REACT_ACT_ENVIRONMENT`.

Two things about this are worth carrying forward, because they explain why the
hunt kept missing:

- **The run failed with every test passing.** Any summary that reads the test
  counts — including the ones in this file — would have called that run clean.
  Check the exit code and the `Errors` line, not just `Tests`.
- **With the shim removed it reproduces in isolation, immediately.** So this
  part was never a race at all; only its _escalation to a run failure_ was
  load-dependent. Before assuming contention, check whether the environment
  differs between the two ways of running.

**A second cause, in the extended package itself.** Once the first was fixed
the run still exited non-zero, now _reproducibly_, and for the same reason —
an unhandled rejection with every test passing:

```
Unhandled Rejection: Error: refused
  at handler test/buttonActionsExample.test.tsx:252
originated in whichever file was running
```

`clears pending when the host rejects` had the host return a rejecting
promise. The Button renderer deliberately does not swallow that (§24.2: the
reset is in a `finally`, and the spec wants the error to reach the platform),
and nothing awaits a DOM click handler — so a real, intended rejection escaped
into the runner and was attributed to an arbitrary file. The test now installs
a `process.on('unhandledRejection')` capture and **asserts** the propagation,
which is the claim it should have been making anyway. Proven to bite: adding a
`catch` to the renderer fails it.

**Status of entry 5.** Both causes share a shape — _the run fails while every
test passes_ — and neither is a race in the component under test. With both
fixed, three consecutive full runs exit 0 with no `Errors` line, where
previously they did not. The four files listed above have not failed since, but
they were never reproducible on demand, so this is not yet proof. Leave the
entry open until the suite has run green for a while; if it recurs, check the
`Errors` line first, not the failing assertion.

**The lesson worth keeping either way:** an unhandled error can fail a suite
while every test passes, and it is attributed to whatever file happened to be
running — which is exactly what an intermittent, unreproducible, wrong-file
failure looks like.

**A third cause — and this one is the four files in the table above.** They
kept failing after both fixes, so the message was read instead of the test:

```
× AG Grid cells > renders the field control inside a data cell   431ms
  → flushUntil: condition still false after 25 ticks
✓ AG Grid cells > honours uischema column defs                  2921ms
```

`flushUntil` budgeted in **ticks**. A tick is a macrotask; it measures how many
times the loop has pumped and says nothing about how long a dynamic `import()`
has had to resolve. Twenty-five ticks was always ample for Monaco or AG Grid —
on an idle machine. Under `lerna run test`, eight package suites in parallel
with every core busy, it sometimes was not, and the test gave up 431ms in while
its neighbour was happily taking 2921ms.

That explains every property of entry 5 at once: why only the four heavy,
`React.lazy` files were affected; why it never reproduced with those files
alone (alone, the machine is idle); and why raising one fixture's budget to 120
helped that one and nothing else. It was never contention over shared state —
it was contention for **CPU**, measured in the wrong unit.

`flushUntil` is now bounded by wall-clock (5s default), with `attempts` kept as
a minimum tick count so callers that asked for more pumping still get it.

**It was in two packages, not one.** `jsonforms-react-extended-renderers` keeps
its own copy of the helper, which still counted ticks — and that package had no
`IS_REACT_ACT_ENVIRONMENT` either, so every one of its tests logged "The
current testing environment is not configured to support act(...)". It failed
`agGridReorder` on the next full run, with the same message. Both are now fixed
there too. The two antd packages and this one all carry the same helper and the
same flag; `jsonforms-react-demo-common` and `jsonforms-react-antd-webcomponent`
need neither, their tests rendering no React.

**Verdict on entry 5: resolved, pending a soak.** Three causes, all of the same
family — a budget or an error path that only misbehaves when the machine is
busy. Re-open it if a full run fails again, and read the failure _message_
first.

## Open designs

Decided enough to write down, not decided enough to build. Each names what is
settled, what is not, and what the decision turns on.

### 6. `$dynamic` (§11) — the shape is agreed, five decisions are open

**Status: not decided.** Nothing is implemented.\
**Detail:** [gaps §3.1, §3.1a, §3.1b](jsonforms-react-antd-implementation-gaps.md)

Came out of a concrete requirement: a Camunda deployment whose form needs a
dropdown of assignable users. The list is neither in the schema nor in the
deployed UI schema, and the form JSON ships with the process archive.

**What is settled.**

- `$dynamic` is the right mechanism for _placing_ a value onto an element, and
  the wrong one for _obtaining_ it — §11 has no I/O by design.
- `bind` preserves the source type, so booleans, numbers, objects and arrays
  all work; `template` only ever yields a string. Only `undefined` means "no
  override", and arrays replace wholesale.
- Stock enum renderers need **no changes**: core's
  `mapStateToEnumControlProps` already prefers `ownProps.options` over the
  schema's `enum`. What is missing is a UI-schema-level way to fill it — one
  bridge, not a renderer per lookup, which is where the legacy Vue 2 family
  ended up.
- The legacy `DataProvider` is the right _idea_ and the wrong _implementation_:
  its lodash templates compile JavaScript, and it never refetches when its URL
  changes. Both are recorded in gaps §3.1a.

**Decision 1 — where resolution runs.** It must sit above tester dispatch.
`ExtendedJsonForms` is the natural home, but then a bare `<JsonForms>` gets no
resolution at all — the same split that made renderer-published
`additionalErrors` awkward (gaps §3.5). The alternative is resolving inside a
dispatch wrapper, which reaches every form at the cost of touching every
dispatch path. _Everything else follows from this one._

**Decision 2 — the option that carries supplied choices.** Working name
`options.choices`, shape `EnumOption[]` (`{label, value}`). It is the contract
the whole approach hangs off and renaming it later breaks deployed forms. It
is also the point where a UI schema stops being renderable by a vanilla JSON
Forms family, which is the portability line held everywhere else. The
alternative is the host patching the schema's `enum` before render, keeping
the model pure and moving the coupling into the embed.

**Decision 3 — where a provider's rows live.** A `DataProvider`-style element
needs scope for its children, and §11's namespaces are a closed list. Either a
new namespace (`provider.*`), structurally what `item` already is, or the
provider writes into `context` — no divergence, but two providers in one form
would collide.

**Decision 4 — who projects a row into a choice.** `EnumOption` is
`{label, value}`; a fetched user is not. Options: the provider or host emits
the canonical shape (handles composite labels, no expressions in the UI
schema); path options such as `choiceLabel: 'displayName'` (inside §11's
grammar, but **cannot concatenate**); or per-row templates, which re-introduce
the expression language and the sandbox question. Leaning to the first with
the second as sugar.

**Decision 5 — one interpolation language, or two. — DECIDED: one.**

> **Resolved by choosing CEL instead of ICU.** A CEL expression addresses data
> natively, so §9's text placeholders and §11.4's `template` leaf are the same
> grammar and the same evaluator; there is nothing left to reconcile. The
> option (C) sketched below — drop `template`, compose `bind` with a message
> formatter — is **not** what happened, and is kept only because its analysis
> of ICU is what ruled ICU out. See
> [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) for the trade,
> including what a message format gave that an expression language does not.
>
> What remains open is not the language but the **resolution layer**:
> `$dynamic` still does not exist, so `template` has no implementation to
> share the evaluator with yet.

> **Half of this was decided earlier.** Translated text — a Label's `text` and its
> siblings — may be supplied by `bind` but **never** by `template`. It
> bypassed the catalog silently, and it was the one place two interpolation
> grammars met on the same string. Recorded in
> [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md) and §9 of the
> consolidated spec. Nothing was removed from the code, because nothing
> implemented it; what was removed is the licence to add it later. **What
> remains open below is `template` for strings that are _not_ messages** — an
> `href`, an `src`, a `placeholder`.

§9 formats display text with ICU MessageFormat; §11.4 defines a second,
simpler grammar for
`{"template": "..."}`, and says outright that "`template` never invokes ICU or
i18n". Two grammars in one document, with **different escape conventions**, is
the thing to avoid: `{{` is a literal brace in one and a syntax error in the
other.

Note first how small the overlap actually is. §9's own example resolves
`textParams` with `{"bind": "data.firstName"}` — so on the display-text path
there is already exactly one interpolation language (ICU) plus a **path
expression** (`bind`) that has no placeholders at all. `bind` is not a
templating language and does not compete with ICU. The duplication is
`template` alone, which exists to build a string for an option that is _not_
display text: an `href`, an `src`, a `placeholder`.

Three ways out, and the middle one is a trap.

**(A) Keep both, as §11.4 has it.** `template` stays dumb concatenation.
Honest and cheap; the cost is a second grammar with an inverted brace rule
that §11.4 itself flags as a trap.

**(B) Make `template` an ICU pattern.** _Does not work as a straight swap_ —
measured against intl-messageformat 10.7.18:

| Probe                            | Result                            |
| -------------------------------- | --------------------------------- |
| `{data.sku}`                     | `SyntaxError: MALFORMED_ARGUMENT` |
| `{data.items.0.price}`           | `SyntaxError: MALFORMED_ARGUMENT` |
| `{data['some key']}`             | `SyntaxError: MALFORMED_ARGUMENT` |
| `a {{ b` (§11.4's literal brace) | `SyntaxError: MALFORMED_ARGUMENT` |
| `a '{' b` (ICU's literal brace)  | `"a { b"`                         |

An ICU argument name cannot be a path: `.`, `[` and `]` are Pattern*Syntax
characters and the grammar excludes them. Making it work means pre-scanning
the pattern and renaming `data.sku` to a generated safe name before parsing —
at which point the authored text is ICU-\_shaped* but is not ICU, and no ICU
linter, editor or translation platform will accept it. That is a third
language wearing ICU's clothes.

**(C) Drop `template`; make `bind` the only path leaf and let ICU build every
string.** One real ICU language, one path expression, composed:

```json
"$dynamic": {
  "options": {
    "src": {
      "message": "https://cdn.example.com/{sku}.png",
      "params": { "sku": { "bind": "data.sku" } }
    }
  }
}
```

Every placeholder is a plain ICU argument name; every path is a `bind`. One
escape rule, no dialect, and `plural`/`select`/`number`/`date` become
available to non-display strings too.

**Two hazards this was expected to have, and does not** — both measured, both
absent:

- _Locale formatting leaking into a URL._ A **bare** `{n}` does no number
  formatting: `1234.5` renders as `1234.5` in `en`, `de` and `bg` alike, and
  `https://cdn.example.com/{id}.png` with `1234567` comes out intact. Only an
  explicit `{n, number}` localizes.
- _Re-entrancy._ A substituted value is not re-parsed: `{name: "{other}"}`
  renders the literal text `{other}`. ICU has no injection path of its own —
  which is why §9's escaping rule is about **Markdown**, not about ICU.

**Leaning to (C)**, with (A) as the fallback if the verbosity is judged worse
than the second grammar. Note that the Label ruling above removes the sharpest
argument for (C) — the two grammars can no longer collide on one value — so
what is left to weigh is narrower: one grammar fewer to learn, against more
nesting on every dynamic URL. (C) costs one rule: §11's "a leaf is **exactly** one
key" becomes "a leaf is identified by exactly one of `bind` / `message`",
which keeps leaf detection unambiguous. It also does **not** unify the two
failure policies, and should not: §9 wants empty text plus a diagnostic,
§11.4 wants the whole value undefined so a half-resolved string never
overrides a good static one. A label with a hole is still readable; an `href`
with a hole is a broken link. Same language, different policy — the same
distinction as [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md).

**`TemplateLayout` (§22) is not part of this question.** Ractive and JSX
produce _structure_, not a value, and no amount of ICU replaces a layout
engine. Worth knowing only because Ractive's `{{ }}` is a third brace
convention that can appear in the same document.

**Carried in with it, once any of this lands:**

- URL components substituted into a provider URL need
  `encodeURIComponent`-equivalent encoding — already flagged in
  [gaps §3.8](jsonforms-react-antd-implementation-gaps.md) as pending "once
  `$dynamic` lands". This is that.
- A non-boolean bound to `options.collapsed` wants a configuration diagnostic,
  and there is no `UIDiagnostic` shape yet (gaps §3.9).
- Identity stability is not optional here: `TestAndRender` is a `React.memo`
  with shallow comparison and the tester result is memoised on `uischema` by
  identity, so a fresh object per pass re-runs every tester in the form on
  every keystroke. See gaps §3.1b for the full contract.

**Two traps worth remembering before anyone writes a line.** §11's template
grammar is inverted from Mustache — a single `{` opens a placeholder and `{{`
emits a literal brace — so `{{data.firstName}}` is text, not a binding. (That
trap disappears under Decision 5(C), which removes the grammar; under (A) or
(B) it stays.) And
paths are fixed strings, so `context.rates[data.currency]` is not expressible:
host context has to be resolved per session rather than exposed as a lookup
table.

## Housekeeping

> **Closed:** `ajv-errors`, `ajv-keywords` and `ajv-i18n` were installed in
> the workspace but wired to nothing in the React packages. They are wired
> now, together with the extended `transform` and the extra `dynamicDefaults`,
> ported from the Vue 2 `common` package — see
> [portable contract](https://github.com/kchobantonov/jsonforms-extended-spec/blob/master/docs/spec.md). The `dynamic`
> default is gated behind `allowScriptEvaluation`, which the original is not.

`pnpm run lint` reports 11 pre-existing errors — `no-empty-function` on
`ResizeObserver` stubs in tests, `react/display-name`, and a deprecated
`ReactDOM.unmountComponentAtNode`. None are in files the recent work touched,
and `lint:fix` does not clear them.

The twenty per-file `ResizeObserver` stubs in
`jsonforms-react-antd-renderers` are now redundant — the package declares one
in `test/setup/jsdomShims.ts`. They are `??`-guarded, so they are harmless, and
they are most of the `no-empty-function` errors above. Removing them is one
sweep that would clear both.

## React adapter follow-up from the spec migration audit

These findings were transferred from the spec project. Verify them against the
current renderer code before starting work; their source audit predates later fixes.
Portable design proposals remain in the spec project’s `docs/todo.md`.

### Implementation and support verification

| Feature                                      | Remaining work                                                                                                                                                                                                | Published schemas                                                                                                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mixed-control `<type>-detail` options        | Implement lookup and dispatch for each supported type; test nested paths and registry precedence. The current mixed renderer does not consume these keys.                                                     | Removed seven type-specific detail definitions. Ordinary `detail` remains supported.                                                                                                                                                              |
| Composite dialog Remove action               | Implement `showRemoveButton` and `removeLabel`, including ownership, confirmation and mutation guards, or formally retire this proposed footer action. A cell's existing remove action is a separate feature. | Removed both option definitions from UI/cell/global configuration.                                                                                                                                                                                |
| `showClearButton`                            | Resolve whether a separate option is needed alongside `clearable`, and implement a consumer before exposing it.                                                                                               | Removed the unused global definition.                                                                                                                                                                                                             |
| Separate read-only and disabled presentation | Core provides the setting, but the reference adapter does not consistently consume separate read-only state. Verify mutation guards and presentation throughout controls/cells before advertising the opt-in. | `separateReadonlyFromDisabled` is typed as an existing core setting, with an explicit adapter-support caveat. It is not a promise of renderer support.                                                                                            |
| Config resolution and compound defaults      | Align namespace consumption, temporal versus flat restrict resolution, and compound-value merging across adapters. Base lodash merges arrays by index; Monaco/grid replace local option bags wholesale.       | Only traced config locations are declared. Unsupported namespaced defaults, global structural control options and layoutDefaults.minItemWidth were removed. See the complete configuration review in jsonforms-react-antd-implementation-gaps.md. |
| Interpolation/markup beyond Label            | Integrate the text pipeline into other text-bearing elements and test translation ordering.                                                                                                                   | Shared option shapes do not promise support on every element.                                                                                                                                                                                     |
| Pending validation and submit integration    | Finish a consistent pending-analysis contract, stale-result handling and host submit policy. Preserve the implemented owner-based additional-error store.                                                     | No speculative pending-state configuration.                                                                                                                                                                                                       |
| File additional-error publication            | Verify/publish local read and conversion failures through the existing owner-based error integration; test cleanup and valid committed data.                                                                  | Duration and registered cron validation use the schema validator; invalid duration drafts retain local feedback and pending-edit validity without additional-error publication.                                                                   |
| Container pre-touch summaries                | Define and implement touch-aware descendant summaries consistently across container families.                                                                                                                 | Existing indicator/filter options describe their implemented uses, not universal coverage.                                                                                                                                                        |
| Structured diagnostics                       | Implement consistent stable codes and reporting across all required paths.                                                                                                                                    | A diagnostic requirement in prose is not proof of a runtime emitter.                                                                                                                                                                              |

The implementation audit uses the Ant Design adapter plus its shared renderer
logic and installed JSON Forms core. Relevant evidence includes
`jsonforms-react-renderer-common/src/layoutSizing.ts`,
`jsonforms-react-antd-renderers/src/complex/MixedRenderer.tsx`,
`jsonforms-react-antd-renderers/src/cells/CompositeDetailDialog.tsx`,
`jsonforms-react-extended-renderers/src/util/interpolate.ts`, and
`jsonforms-react-extended-renderers/src/util/additionalErrors.tsx`.
The portable feature descriptions remain independent of component-library APIs.
