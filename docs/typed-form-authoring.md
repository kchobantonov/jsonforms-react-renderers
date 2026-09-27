# Authoring forms in TypeScript, type-safely

A JSON Schema and a UI schema are two documents that have to agree about one
thing — **paths** — and nothing in JSON checks that they do. A `scope` with a
typo is valid JSON, valid against the UI-model schema, and renders a control
that is bound to nothing. It fails at runtime by showing an empty field, which
is the hardest kind of failure to notice.

If both documents are written in TypeScript instead, the compiler can check
that agreement. This is what that looks like, what it catches, and — the part
that matters more — what it does not.

Helpers: `@chobantonov/jsonforms-react-extended-renderers`
([`src/authoring/`](../packages/jsonforms-react-extended-renderers/src/authoring/)).
Everything below is compiled and asserted in
[`test/typedAuthoring.test.ts`](../packages/jsonforms-react-extended-renderers/test/typedAuthoring.test.ts).

## The shape of it

```ts
import { forSchema, type DataOf } from '@chobantonov/jsonforms-react-extended-renderers';

// 1. The schema, `as const` — see "Why `as const`" below.
export const schema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 0 },
    subscribed: { type: 'boolean' },
    address: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        postcode: { type: 'string' },
      },
    },
    orders: {
      type: 'array',
      items: { type: 'object', properties: { reference: { type: 'string' } } },
    },
  },
} as const;

// 2. Bind the helpers to it. The argument is used for inference only.
const f = forSchema(schema);

// 3. The UI schema, written against it.
export const uischema = f.layout({
  type: 'VerticalLayout',
  options: { gap: 16 },
  elements: [
    f.control('email'),
    f.control('age', { options: { slider: true } }),
    f.control('address.city', { label: 'Town' }),
    f.control('orders', { options: { table: true, variant: 'ag-grid' } }),
    f.control('subscribed', {
      rule: {
        effect: 'HIDE',
        condition: { scope: f.scope('age'), schema: { maximum: 17 } },
      },
    }),
  ],
});

// 4. The data type falls out of the schema.
export type Data = DataOf<typeof schema>;
// { email: string; age?: number; subscribed?: boolean;
//   address?: { city?: string; postcode?: string };
//   orders?: { reference?: string }[] }
```

`f.control('address.city')` produces exactly
`{ type: 'Control', scope: '#/properties/address/properties/city' }` — an
ordinary portable element. Nothing about the runtime changes, and the output
is still plain JSON you could have written by hand. The helpers exist so that
writing it by hand wrongly stops compiling.

Paths are **dotted data paths**, not pointers: you write `address.city`, not
`properties/address/properties/city`. The `properties` segments are noise that
comes from the schema's own shape, and making an author repeat them is making
them repeat something the compiler already knows.

## What it catches

Every line below is a compile error. Each is asserted with `@ts-expect-error`
in the test, so if any of them ever starts compiling, the build fails.

```ts
f.control('emial');                            // a misspelled property
f.control('address.postcod');                  // misspelled, nested
f.control('address.city.suburb');              // a path past a leaf
f.control('orders.reference');                 // an array is terminal
f.control('email', { options: { slider: true } });  // numeric option on a string
f.control('age', { options: { multi: true } });     // string option on a number
f.control('age', { options: { slider: 'yes' } });   // right option, wrong value
f.control('email', { labl: 'typo' });          // a misspelled element key

f.control('email', {
  rule: {
    effect: 'HIDE',
    condition: { scope: f.scope('nope'), schema: {} },  // a rule's scope, too
  },
});

const wrong: Data = { email: 'a@b.c', age: 'old' };  // wrong data type
const missing: Data = { age: 3 };                    // `email` is required
```

The scope also comes back as a **literal type**, not `string`:

```ts
const s: '#/properties/address/properties/city' = f.scope('address.city');
```

which means an editor shows you the pointer on hover, and a wrong annotation
is an error rather than a comment that drifts.

### Why arrays are terminal

`orders.reference` is rejected on purpose. A control inside an array's
`detail` is scoped **relative to the item** — `#/properties/reference` — so
the through-path would be a pointer that resolves to nothing. The array itself
is addressable; its items are addressed from the detail's own uischema:

```ts
const item = forSchema(schema.properties.orders.items);
f.control('orders', {
  options: {
    detail: item.layout({
      type: 'VerticalLayout',
      elements: [item.control('reference')],
    }),
  },
});
```

The same trick applies anywhere the scope resets: bind a second `forSchema` to
the sub-schema and carry on.

## Property names that collide with the addressing scheme

Paths are dotted, so a property name can collide with the syntax that
addresses it. Three cases, three different answers — all pinned in
[`typedAuthoringNames.test.ts`](../packages/jsonforms-react-antd-extended-renderers/test/typedAuthoringNames.test.ts),
which resolves each pointer against the schema rather than only comparing
strings.

### A property named `properties` — fine

```ts
f.scope('properties')        // '#/properties/properties'
f.scope('properties.city')   // '#/properties/properties/properties/city'
```

Nothing is ambiguous: the first `properties` is the keyword, the second is
the property. The same holds for names that look like other keywords —
`items`, `type`, `required` — because they are only ever read as names under
`properties`.

### `/` and `~` — addressable, and escaped for you

JSON Pointer reserves both, so a property called `a/b` is addressed as
`a~1b`:

```ts
f.scope('a/b')   // '#/properties/a~1b'
f.scope('c~d')   // '#/properties/c~0d'
```

This is the same escaping core's own `getPropPath` applies, and core
`decode`s on the way back. Left raw, `#/properties/a/b` would walk into a
property called `a` and resolve to nothing.

### A dot in a name — **not addressable**, and refused

```ts
f.scope('first.name');   // compile error
```

JSON Forms addresses data with dotted paths and **the grammar has no
escape**, so a property literally called `first.name` has no scope at all:
it splits into two segments and yields `#/properties/first/properties/name`,
which is well-formed, points at nothing, and reports no error anywhere. Core
has the same limitation — `getPropPath` splits on `.` too — so it is not
something these helpers could route around.

So such a name is left out of the offered paths. A compile error is the
honest answer; a pointer that silently resolves to nothing is not.

The name itself is perfectly legal, and the data validates — this is an
addressing limit, not a restriction on JSON.
[Adjustment 14](jsonforms-extended-ui-model-adjustments.md) covers the
runtime half: such properties are not refused, and are edited through a
control that uses no path at all.

## Sizing options are the one narrow type

`width`, `height`, `minWidth`, `maxWidth`, `gap` and `minItemWidth` take a
`CssLength` rather than `number | string`, so `width: '100'` and
`width: 'pixels'` are compile errors.

This is the only place where the types are **narrower than the runtime**:
`toCss` passes any string through as authored, so `CssLength` can only ever
be a subset of what works. That inverts the usual risk — a false rejection
turns correct CSS into a build failure — which is why the shape of it is
pinned in
[`typedAuthoringCssLength.test.ts`](../packages/jsonforms-react-antd-extended-renderers/test/typedAuthoringCssLength.test.ts)
rather than left to whoever next edits the unit list.

Three calibration decisions worth knowing:

- **The functional notations are all admitted**, not only `calc()`.
  `clamp()`, `min()`, `max()`, `var()` and `fit-content()` are ordinary in
  responsive layouts; a type that allows only `calc()` rejects correct CSS.
- **The unit list is long on purpose.** `vmin`, `dvh`, `pt`, `lh`, `ch` and
  the rest are all accepted. A short, tidy list turns each of them into an
  error on a value that works.
- **`fr` is deliberately excluded.** These layout containers are
  `display: flex`, and item sizing sets `flex-basis` and `width`. `fr` is a
  grid unit and means nothing in either, so admitting it would type-approve a
  value the browser silently ignores — which is worse than rejecting it.

`'0'` is accepted as the one unitless length. TypeScript's `${number}` is
lenient enough that `'100 px'` also gets through; narrowing that is not worth
the type it would take.

### The option names are the ones the renderer reads

`layout` takes `minWidth` / `maxWidth` / `minHeight` / `maxHeight`, not
`min` / `max`. An earlier draft of this module had the short forms, which
`itemSizing` reads nowhere: it would have type-approved a dead option while
rejecting the one that works. If you are adding an option here, check it
against `LayoutItemOptions` in `layoutSizing.ts` rather than against the
specification prose.

## Why `as const`

This is the one thing that decides how much of the above works, and it fails
quietly if you forget it.

| Schema declared as | Paths checked | Options checked | `DataOf` |
| --- | --- | --- | --- |
| `{ … }` | **yes** | no | `unknown` |
| `{ … } as const` | yes | yes | yes |
| `{ … } as const satisfies AuthoredSchema` | yes | yes | yes, **and the schema itself is checked** |

Property *names* are keys, and keys survive widening — so paths keep being
checked even without `as const`. Property *values* do not: `type: 'integer'`
widens to `type: string`, every kind test stops matching, and both the option
map and the data type fall back to "anything". You get an authoring experience
that looks identical and checks half as much.

Prefer the third form. `as const satisfies` keeps the literal inference **and**
makes TypeScript check that what you wrote is a schema at all, which the first
two do not.

**`satisfies JsonSchema` does not work**, which is worth stating because it is
the obvious thing to reach for. `as const` freezes `required: ['email']` into
a `readonly` tuple, and `JsonSchema` declares `required` as a mutable
`string[]`; the two do not overlap, so every schema with a `required` is
rejected. `AuthoredSchema` is the same type made deeply readonly, and exists
only to be `satisfies`-ed against.

## Can it express everything the JSON way can?

**Yes — nothing is unauthorable.** But the checking is not uniform, and it is
worth knowing which of three buckets a thing falls into before you commit.

Every element kind and awkward schema shape below is built in
[`typedAuthoringCoverage.test.ts`](../packages/jsonforms-react-antd-extended-renderers/test/typedAuthoringCoverage.test.ts),
which is what keeps this section from drifting.

### 1. Modelled, and checked

Controls, the four layouts, `Category`, `Label`, rules — including `AND`/`OR`
composition and `failWhenUndefined` — `i18n` prefixes, `label` as a string, a
boolean or a `{ text, show }` descriptor, and the root scope (`f.control('')`
→ `#`).

```ts
f.layout({
  type: 'Categorization',
  elements: [
    f.category({
      label: 'Contact',
      elements: [
        f.label({ text: 'Tell us how to reach you' }),
        f.control('email', { i18n: 'email' }),
        f.control('kind', {
          rule: {
            effect: 'HIDE',
            condition: {
              type: 'AND',
              conditions: [{ scope: f.scope('email'), schema: { minLength: 1 } }],
            },
          },
        }),
      ],
    }),
  ],
});
```

### 2. Expressible through `raw`, unchecked

Anything this module does not model — an extended element (`Button`,
`SplitLayout`, `TemplateLayout`, `ImageView`, `Separator`), a layout from
another family, or an option the curated map does not carry:

```ts
f.raw({ type: 'Button', label: 'Go', action: 'submit' })
```

For an **unmodelled option**, use `raw` for the element but keep the typed
scope — you lose the option checking and keep the path checking, which is the
half that actually catches mistakes:

```ts
f.raw({
  type: 'Control',
  scope: f.scope('email'),        // still checked
  options: { autocomplete: true },  // not checked
})
```

`raw` is deliberately a **named** escape rather than a permissive member of
the element union. A permissive member would also swallow a mistyped
`Control`; `f.raw(` is greppable, and the loss of checking is visible where it
happens.

### 3. Addressable as a whole, not traversable

A combinator (`oneOf`/`anyOf`/`allOf`), a tuple array, an
`additionalProperties` map and a `$ref` are all bindable — `f.control('choice')`,
`f.control('home')` — but the types do not see inside them. Their `DataOf`
degrades to `unknown` rather than guessing.

For `$ref` and array items there is a good answer: point a second `forSchema`
at the sub-schema, which restores full checking from there down. That is the
same move the array `detail` example uses.

```ts
const addr = forSchema(schema.$defs.addr);
f.control('home', { options: { detail: addr.layout({ … }) } });
```

**Two things are impossible, not merely unimplemented**, and no amount of type
machinery will change them:

- **A dynamic property name.** `extras.anything` under `additionalProperties`
  has no name until runtime. The map is addressable; its members are not.
- **A schema that does not exist at compile time** — fetched over the network,
  assembled at runtime, or narrowed by `if`/`then`/`else`. There is nothing to
  infer from.

Both fall back to plain objects, which still work, because the output was
always ordinary JSON.

### The practical answer

Adopt it per form. A typed uischema is an ordinary uischema, so a form that
turns out to be awkward can stay JSON, and a form can be half-and-half without
anything special. You are never choosing between the two for the whole
project.

## What it does not catch

Worth reading in full before relying on any of this.

**1. Which renderer will be chosen.** Selection is done by testers at runtime,
from the schema and the options together. The types know the option is
*admissible*; they cannot know that `{ slider: true }` will actually reach the
slider rather than losing a rank contest. Nothing at the type level models
tester ranks.

**2. Options this map does not know.** `OptionsFor` is a curated subset — the
options these renderers read for each schema kind — not something generated
from the published JSON Schemas in [`schemas/`](schemas/). It will lag them.
Adding one is a line in `forSchema.ts`.

**3. Anything built as a variable first.** TypeScript's excess property
checking applies only to a *fresh object literal*:

```ts
const opts = { slider: true, notAnOption: 1 };
f.control('age', { options: opts });   // compiles. No error.
```

A real hole, and an unreliable escape hatch: it only works while the object
shares **at least one** property with the expected type. An options object
with nothing in common is still rejected, with
`has no properties in common with type 'OptionsFor<…>'`. Use `f.raw` for that
case — it is the escape that always works, and it says so at the call site.

**4. `$ref`.** Nothing resolves one. A property whose schema is
`{ $ref: '#/$defs/address' }` has no `properties` at the type level, so it is
terminal — `home` is offered, `home.city` is not. Point a second `forSchema`
at the definition, as with array items.

**5. The runtime schema, if it is not the same object.** All of this checks
the schema *as a TypeScript type*. A schema fetched over the network, built at
runtime, or narrowed by an `if/then/else` is outside it entirely.

**6. That the pointer is correct.** `Scope<P>` and the string the builder
returns are tied together by a cast, which is precisely where a type and a
value drift apart unnoticed. The test asserts they agree on concrete paths;
that assertion is the only thing holding them together.

## How this differs from typing the element itself

Another approach — used by the `workflowbuilder` project, which is where this
one started — gives every control its own element `type`:
`{ type: 'Text', scope, placeholder }`, with options flat on the element and
a discriminated union over `type`. Renderers are then selected by
`uiTypeIs('Text')` at a fixed rank.

It buys sharper option checking, because the element names its own renderer.
It costs portability: those uischemas are not JSON Forms uischemas any more,
schema-driven selection is gone (nothing picks a date control because
`format: 'date'`), and the same document cannot be handed to another renderer
family.

The approach here keeps `type: 'Control'` and tester-based selection, so a
uischema written this way is still an ordinary portable one — it can be
serialised, stored, sent to a server, and rendered by a family that has never
heard of these helpers. The type checking is a **development-time** aid over
an unchanged document, which is also why it can be adopted one form at a time.

## Using it with `<JsonForms>`

The output is an ordinary UI schema, so nothing special is needed:

```tsx
import { asJsonSchema, asUiSchema } from '@chobantonov/jsonforms-react-extended-renderers';

<JsonForms
  schema={asJsonSchema(schema)}
  uischema={asUiSchema(uischema)}
  data={data}
  renderers={renderers}
  cells={cells}
  onChange={({ data }) => setData(data as Data)}
/>
```

Those two helpers are widening casts, and they are helpers rather than inline
casts for a reason: `schema as JsonSchema` **does not compile**. `as const`
makes every array readonly, `JsonSchema` wants mutable ones, and TypeScript
refuses a direct cast between types that "do not sufficiently overlap" — so
the inline version has to be `as unknown as JsonSchema`, which is the kind of
thing that gets copied into places it should not be. Doing it once, in a named
function, keeps it to one place.

The widening is safe in the direction that matters: the value really is a
schema and really is a UI schema, JSON Forms does not mutate either, and what
is lost at the boundary is only the extra precision — lost *after* every check
above has already run.
