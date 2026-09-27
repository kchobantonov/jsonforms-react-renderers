# Authoring schemas

JSON Schemas for the two documents a form author writes by hand: the global
`config` bag and the UI schema.

| File | Describes |
| --- | --- |
| [`jsonforms-config.schema.json`](jsonforms-config.schema.json) | The `config` object, for a host on **core + the antd renderer set** |
| [`jsonforms-extended-config.schema.json`](jsonforms-extended-config.schema.json) | The same, **plus** what the extended renderers read |
| [`jsonforms-uischema.schema.json`](jsonforms-uischema.schema.json) | The UI schema, for a host on **core + the antd renderer set** |
| [`jsonforms-extended-uischema.schema.json`](jsonforms-extended-uischema.schema.json) | The same, **plus** the extended elements and options |

Both pairs mirror the package layering. Pick the narrower file when a host
builds on the base renderer set alone: it will not offer completion for an
option nothing in that build consumes, and it turns an element that set cannot
draw into an authoring error rather than a silently blank space.

**The base file is the source of truth in each pair**, and neither declares an
`$id`, so relative references resolve against the file. A validator loading an
extended file must register its base first — without it, compilation fails
rather than silently accepting everything.

### How each extended file relates to its base

They differ, and the difference is forced rather than chosen.

**Config** is a pure reference. The extended file adds properties to an open
object, so `allOf` expresses it exactly:

```json
{
  "allOf": [
    { "$ref": "jsonforms-config.schema.json" },
    { "properties": { "jsonformsExtended": { "$ref": "#/$defs/extendedOnly" } } }
  ]
}
```

It restates nothing, and has no top-level properties of its own.

**UI schema** cannot do that. A UI schema is one mutually-recursive graph
rooted at `element` — `controlOptions` reaches `element` through `detail` —
and the extended file has to **widen** that union so an extended element is
valid *nested inside* a base layout. `allOf` intersects rather than widens, so
the config trick would reject the very documents the file exists to accept.
Draft 2020-12's `$dynamicRef` is the mechanism for this, but it needs a
dialect the sibling schemas and the repository's validator do not use, and
editor support for it is poor — which matters, because editor completion is
what these files are for.

So the UI-schema pair does both:

- every definition that **can** be shared is shared by reference —
  `rule`, `dimension`, and the two layout option bags;
- `label` is the third case: the extended set adds options to it (`markup`,
  `typography`), so the extended file wraps the base definition in an `allOf`
  rather than copying it. `text` and `options.format` keep one home;
- the recursive spine is **generated from the base** rather than written
  twice, and `docsSchemas.test.ts` asserts it has not drifted, that the shared
  definitions are references rather than copies, and that an extended element
  nested in a base layout is accepted by one file and refused by the other.

## What they are, and are not

They describe **what this implementation reads**, derived from the code rather
than from the portable specification alone. An option is in here because a
renderer does something with it; a specified option this repository does not
implement is either absent or marked as such in its `description`. That makes
them useful for authoring — editor completion, and catching a typo before it
becomes a silently ignored option — and it makes them a poor conformance test
for a different renderer family.

**They are not validators of correctness.** `additionalProperties` is `true`
almost everywhere, deliberately: §1 requires unknown renderer namespaces and
unknown options to be *preserved and ignored*, so a schema that rejected them
would call a conformant portable document invalid. What these catch is the
misspelled option and the element the chosen renderer set cannot draw — not
everything that could be wrong.

## Using them

```jsonc
// .vscode/settings.json
{
  "json.schemas": [
    {
      "fileMatch": ["**/uischema.json"],
      "url": "./client/docs/schemas/jsonforms-extended-uischema.schema.json"
    },
    {
      "fileMatch": ["**/config.json"],
      "url": "./client/docs/schemas/jsonforms-extended-config.schema.json"
    }
  ]
}
```

Point each at its **base** file instead when a form must run on the antd
renderer set alone. The editor resolves the relative reference to the base
from the file next to it, so both files must stay in this directory together.

rather than a blank space on the page.

## Keeping them honest

A hand-written schema of a hand-written surface rots the moment an option is
added, and a rotted one is worse than none — it rejects valid documents, and so
teaches authors to ignore it.

`docsSchemas.test.ts` in `jsonforms-react-extended-renderers` is what stops
that: it compiles all four and validates **every** `uischema.json` and
`config.json` in the repository against them. A new option that the schema does
not know about will not fail that test — `additionalProperties` is open — but a
new *element type*, or a value outside an enum, will.

An example that authors something invalid **on purpose** — to show what a
renderer does with it — goes in that test's `DELIBERATELY_INVALID` map, paired
with the error the schema must raise. Being listed there asserts the catch
rather than waiving it: the example drops off the sweep only by proving the
schema still notices it. `markup-label` is the current entry, for a `Label`
asking for a markup language this renderer set does not implement.

The antd schema is **generated** from the full one rather than maintained
beside it, so the two cannot disagree about a shared definition. The generator
is in the commit that introduced it; re-run it by pruning the extended-only
`$defs` and options and restricting `$defs/element/properties/type`.

Three things the fixtures taught the schema, all of which had it too strict:

- **`options.format` is not an enumeration.** It is a renderer-selection hint,
  distinct from the *schema's* `format` that core's `formatIs` reads. The
  fixtures alone use `radio`, `date`, `date-time`, `time`, `password` and
  `table`. It is an open string.
- **`options.detail` may have no `type`.** JSON Forms reads a bare
  `{ "elements": [...] }` as a vertical layout, and several fixtures rely on it.
- **Overlapping alternatives need `anyOf`, not `oneOf`.** A detail written
  *with* a `type` matches both the element branch and the bare-layout branch,
  and `oneOf` calls that ambiguity an error.
