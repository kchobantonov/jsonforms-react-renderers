# Example: button actions

**Example ID:** `button-actions`\
**Demo entry:** **Spec: Button actions** (`#spec-button-actions`)\
**Domain:** a subscription sign-up\
**Specs covered:**

- [Portable spec §14 — Button, actions and script](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §14 — Action path and Script path](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Portable spec §9 — Internationalizable text](../../../../../../docs/jsonforms-extended-ui-model-spec.md)
- [Adjustments §24 — The Button contract](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

A Button does not know what its command means: it hands the command to the
host and waits. That is the whole example, and it has **three tabs**, because
a Button has three ways of being told what to do and they are not
interchangeable.

## Layout of the page

| Tab | The path | Portable |
| --- | --- | --- |
| **Action** | A name and some params, handed to the host. Language switching, colours, disabled, pending, and the button that declares nothing. | yes |
| **Script** | A string of code, run in place. Needs permission. Also the button that declares an action *and* a script. | yes |
| **TypeScript** | A `script` that is a **function**. Needs no permission — and cannot be serialized. | **no** |

The form's own controls sit *above* the tabs: all three tabs act on the same
data, so it has to stay on screen.

The tabs are not decoration. The first two come from `uischema.json` and
travel; the third is appended in `index.ts` and cannot, so the boundary is
something you navigate rather than something you read past. **Open the UI
schema panel on the TypeScript tab:** the buttons are there and their `script`
is not.

The language buttons live on the **Action** tab, and switching language
retitles the tabs themselves — they are ordinary elements taking their text
from the catalog.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Three ordinary properties, so there is a form to act on. |
| `uischema.json` | The **Action** and **Script** tabs: everything a Button can express portably, plain JSON, unchanged over the wire. |
| `index.ts` | Appends the **TypeScript** tab — three **function** scripts, which have no JSON spelling. |
| `data.json` | A filled-in sign-up. |
| `config.json` | `allowScriptEvaluation: true`, for the string script button only. |
| `translations.json` | English and Bulgarian — the catalogs the buttons switch between, including the tab labels. |

## Changing the language

```json
{ "type": "Button", "label": "Български", "action": "setLocale", "params": { "locale": "bg" } }
```

Press it and every label, message and piece of help text comes back in
Bulgarian — including the buttons themselves, which are ordinary elements and
take their own text from the catalog through `i18n`.

**`params` is what makes this one command.** Without it the schema would need
a `setLocaleBg` action and the host a branch per language. With it, the host
handles `setLocale` once:

```ts
const handleAction = (event: ActionEvent) => {
  if (event.action === 'setLocale' && typeof event.params?.locale === 'string') {
    setLocale(event.params.locale);
  }
};
```

That is the entire host side, and it is what the demo application does.

### What the renderer does and does not do

The renderer **fires the event and awaits it**. It does not know what
`setLocale` means, it does not change the locale itself, and it does not touch
the form data. A Button invokes a command; a `Link` navigates; neither is a
way to spell the other.

While the promise is outstanding the button is **pending**: it shows a
spinner, reports `aria-busy`, and **refuses a second activation**. Press it
three times quickly and the host is called once. When the promise settles —
including when it rejects — pending clears and the button works again.

## Colours are semantic

`color` takes one of `primary`, `secondary`, `alternative`, `success`,
`warning`, `error`. They are names for *intent*, not paint: the renderer set
maps them onto its own component's semantic styling.

## Everything a Button can do

| Case | Tab | What to look for |
| --- | --- | --- |
| `action` with `params` | Action | The two language buttons; one command, two arguments |
| `action` alone | Action | Submit / Reset / Discard |
| `color` | Action | The semantic names, mapped by the renderer set |
| `options.disabled` | Action | **Unavailable** — still readable, fires nothing |
| A slow `action` | Action | **Submit slowly** — spinner, and a second press is refused |
| Neither | Action | **Declares neither** — still fires, with an empty action |
| `script` as a string | Script | **Log the form data** — needs permission |
| `action` **and** `script` | Script | **Declares both** — the action runs, the console warns |
| `script` as a function | TypeScript | **Arrow function**, **Classic function**, **Async function** |

The last row is the only one that is not in `uischema.json`, and that is the
point — see below.

**Why "Declares neither" is on the Action tab and "Declares both" is on the
Script tab.** A button with nothing declared still takes the action path, with
an empty action; a button with both is a question about *precedence*, which
only arises once a script is in the picture.

## The script path

```json
{ "type": "Button", "label": "Log the form data", "script": "console.log(this.context.core.data);" }
```

A **string** `script` is an async function body, invoked with the ActionEvent
as `this`. So `this.context`, `this.params` and `this.element` are reachable,
and top-level `await` works. It runs directly and never reaches the host.

It needs permission: `config.json` grants
`jsonformsExtended.security.allowScriptEvaluation`, and without it the button
is replaced by a message naming the key. The renderer reports the refusal
rather than weakening CSP. The specification calls script "a last-resort,
non-portable runtime escape hatch", and this example is the one place it
appears.

### Or a function, for a model authored in TypeScript

```ts
script: (event) => log(`saw ${JSON.stringify(event.params)}`)
script: function () { log(`saw ${JSON.stringify(this.params)}`); }
script: async () => { await save(); }
```

The event arrives as an **argument**, and `this` is bound as well. Both, on
purpose: `.call()` cannot bind an arrow function's `this` — it is lexical — so
an idiomatic `() => this.context` would compile, run and read `undefined` with
no diagnostic. Passing it as an argument costs one word and makes the mistake
unreachable, while binding `this` keeps a body pasted over from the string
form working.

**A function needs no `allowScriptEvaluation`.** That permission exists
because compiling a string needs CSP `unsafe-eval`; a function the build
already compiled needs nothing of the sort. The three buttons at the bottom of
the form run with the permission removed, while the string one is refused.

### `action` wins when an element declares both

Section 14 states the exclusivity without saying which takes precedence,
because carrying both is an authoring mistake — so the question is which
failure is least harmful.

An action goes to the host's handler, where it can be logged, refused or
authorised. A script runs arbitrary code with no such oversight, and the
section itself calls it "a last-resort, non-portable runtime escape hatch".
And if a JSON form carries a string script while the host has not granted the
permission, the script cannot run **at all** — so any other precedence would
make the button dead rather than merely surprising.

The conflict is a **console warning**, not a rendered message: replacing the
button would break a form that works today the moment somebody adds a stray
`action`. In TypeScript it cannot be written at all:

```ts
const bad = {
  type: 'Button',
  label: 'Both',
  action: 'submit',
  script: () => log('never runs'),
} satisfies ButtonUiSchema;

//  Type '{ type: "Button"; … }' is not assignable to type
//  '{ action?: never; script?: never; }'.
//    Types of property 'action' are incompatible.
//      Type 'string' is not assignable to type 'never'.
```

### The script's signature comes from the type

`satisfies ButtonUiSchema` is what makes the TypeScript form worth having.
It checks the element *and* contextually types the script, so the event is
inferred rather than annotated:

```ts
const arrowScript = {
  type: 'Button',
  label: 'Arrow function',
  params: { tier: 'express' },
  script: (event) => log(`arrow saw ${JSON.stringify(event.params)}`),
  //       ^ ActionEvent, inferred
} satisfies ButtonUiSchema;
```

Write `event.noSuchField` and the compiler says *Property 'noSuchField' does
not exist on type 'ActionEvent'* — the signature is known, not described.

## The portable boundary

`uischema.json` is the **Action** and **Script** tabs. The **TypeScript** tab
is appended in `index.ts` as a whole `Category`, because section 14 allows a
function-valued `script` only for a model held in memory: "an in-memory JS/TS
UI model can carry them directly while JSON serialization cannot."

A whole tab rather than a few more buttons, on purpose. The portable half stays
a complete, valid form on its own — delete `index.ts`'s contribution and
`uischema.json` still renders two working tabs — and a reader cannot drift from
what travels to what does not without noticing they changed tab.

**Open the UI schema panel on that tab.** The three buttons are there and their
`script` is not — `JSON.stringify` drops a function silently. That is the
boundary, shown rather than described: the JSON half can be sent to another
renderer set on another platform; the TypeScript half cannot leave this build.

The tab is located **structurally**, by finding the `Categorization` rather
than by indexing into `elements`, so reordering `uischema.json` cannot silently
attach it to the wrong parent.

## Expected behaviour

| Action | Result |
| --- | --- |
| Press **Български** | The whole form re-renders in Bulgarian, tab labels included. |
| Press **English** | And back again. |
| Press a button three times quickly | The host is called once. |
| Press **Discard** | `discard` reaches the host; the colour is the only thing the renderer decided. |
| Press **Unavailable** | Nothing. It is disabled, and still readable. |
| Press **Log the form data** | The data appears in the console; the host is not called. |
| Remove `allowScriptEvaluation` | The **Script** tab's button is replaced by an explanation; the **TypeScript** tab keeps working. |
| Press **Submit slowly** twice | The second press does nothing while the first is outstanding. |
| Press **Declares both** | `submit` reaches the host; the console warns `action.conflict`. |
| Press **Declares neither** | An event with an empty action still reaches the host. |
| Press **Async function** | A spinner for as long as the promise is outstanding. |

## Fallback behaviour

| Situation | Result |
| --- | --- |
| No `action`, no `script` | The element's `name`, then its label, is used as the action name. |
| No host handler registered | The press is a no-op; pending still clears. |
| Host rejects | Pending clears and the rejection propagates to the application's error handling. |
| `options.action` / `options.label` | Still read, below the top-level fields. |
| Both `action` and `script` | `action.conflict`, and neither runs. |

## Status

**Implemented** for both paths. The renderer previously read only
`options.action` and `options.label`, dropped `params` entirely, had no
pending state, no duplicate-activation guard, no `color` and no `script`
support; see
[adjustments §24](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md).

**Not implemented:** `icon` is accepted and passed to the renderer set but no
icon set is wired up, so nothing is drawn for it.

Covered by `buttonActionsExample.test.tsx`.
