# Example: markup labels

**Example ID:** `markup-label`\
**Demo entry:** **Spec: Markup labels** (`#spec-markup-label`)\
**Domain:** a workshop registration form\
**Specs covered:**

- [Consolidated spec §10 — Markdown policy](../../../../../../docs/jsonforms-extended-ui-model-consolidated-spec.md)
- [Consolidated spec §12 — URL policy](../../../../../../docs/jsonforms-extended-ui-model-consolidated-spec.md)
- [Consolidated spec §9 — Text, markup and interpolation](../../../../../../docs/jsonforms-extended-ui-model-consolidated-spec.md)
- [Adjustments §35 — The markup label](../../../../../../docs/jsonforms-extended-ui-model-adjustments.md)

A `Label` whose `options.markup` is `"markdown"` renders through the
restricted Markdown profile instead of as a string. Everything here is a
`Label`; the controls at the bottom are there only so the labels sit in a real
form.

## Files

| File | Role |
| --- | --- |
| `schema.json` | Four properties, so the page has something to fill in. |
| `uischema.json` | Seven labels: five Markdown (one of them with `typography: false`), one explicitly plain, one asking for a markup this renderer set does not implement. |
| `data.json` | A filled-in registration. |
| `config.json` | The Markdown gate, and a URL policy narrowed to `https` and `mailto`. |
| `translations.json` | English and Bulgarian. The **catalog** carries the Markdown, not just the element. |
| `index.ts` | Registers the example with the demo. |

## It is a `Label`, not a new element type

There is no `MarkdownLabel`. An element type the base renderer set does not
know renders as **nothing at all**, so a form authored that way and opened on
a base-only build would lose its text. `Label` with an option degrades
instead: the base renderer still claims it at rank 1 and still shows the
words, unparsed. §1's "unknown options are preserved and ignored" is what
makes that work, and it works for options, not for types.

## What the basic profile draws

The joining-instructions and "please bring" labels between them use every
construct §10's basic profile lists: **bold**, *italic*, ~~strikethrough~~,
`inline code`, links, and ordered and unordered lists.

The cancellation label starts with `# Cancellation`, which the basic profile
excludes. It renders as those characters — the **rule** is disabled, so the
`#` is never consumed. Filtering the heading out of the output instead would
have silently promoted the line to an ordinary paragraph, and an author would
be left wondering where their heading went.

Turn `markup.markdown.profile` to `"extended"` in `config.json` and that label
becomes a real heading. Extended adds exactly four things — headings,
blockquotes, tables and fenced code — and keeps every security rule.

## Links go through the URL policy

`config.json` narrows `allowedSchemes` to `https` and `mailto`. The joining
label's two links survive; the refunds label's `http://` link does not, and
renders as plain text with its words intact, the same way a refused `Link`
element does.

This is worth seeing because markdown-it has a scheme check of its own, which
this implementation **replaces** rather than layers on top of. Two checks in
series would make the effective policy their intersection, so a host that
widened `allowedSchemes` would silently get nothing for the schemes
markdown-it happens to dislike — and a link refused before parsing raises no
diagnostic at all.

## Refusals show the text as well as the reason

The last label asks for `"asciidoc"`. It gets a diagnostic **and** its text.
The same is true when a host sets `markdown.enabled: false`.

That differs from a refused `TemplateLayout`, which renders nothing but its
diagnostic, and the difference is the point: a template is a program, and
running it is the whole reason it is there. A label's text is inert content,
readable whether or not its asterisks became bold. Hiding it would turn a
policy decision into missing information on the page.

## The catalog carries the Markdown

`translations.json` holds Markdown in both languages, not only the English
fallback in the UI schema. A label's text resolves through the translator
first (`i18n` prefix, then `.text`), and it is the **resolved** string that is
parsed. Switch the demo to Bulgarian and the bold, the code span and both
links are still there.

## Typography

Rendered text is wrapped in the UI library's own text component by default, so
it picks up the theme's colour, size and link styling.

The fine-print label sets `options.typography: false` and sits directly above
the controls, which is where the option earns its keep: antd gives its text
components a bottom margin, and one label carrying a margin its neighbours do
not is exactly the unexplained gap the option exists to close. Compare it with
the joining-instructions label above, which says nothing and keeps the
wrapper.

The same switch exists form-wide as
`jsonformsExtended.markup.typography: false`, and the element option wins over
it. Either way it governs the **box**, not the Markdown: the fine print is
still parsed, still bold, and its link still goes through the URL policy.
