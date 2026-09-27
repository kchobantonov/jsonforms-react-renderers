# File control

**Example ID:** `file-control` · **Domain:** Supplier attachments

Covers the [portable UI model, §18 — File control](../../../../../../docs/jsonforms-extended-ui-model-spec.md): renderer selection, storage encodings, media filters and byte-size bounds.

## Files

| File                | Purpose                                                                     |
| ------------------- | --------------------------------------------------------------------------- |
| `schema.json`       | Four selection/storage paths and a text attachment.                         |
| `uischema.json`     | Inclusive and exclusive limits on original file bytes.                      |
| `data.json`         | Small preloaded attachments; the image and bounded attachment start absent. |
| `translations.json` | Matching English and Bulgarian labels and instructions.                     |
| `index.ts`          | Registers the runnable example.                                             |

No global configuration or detail registry is needed.

## What the form contains

```text
Supplier logo        image filter, data URL, at most 1 MiB
Signed contract      data URL with encoded filename, at most 1 MiB
Encoded attachment   base64 payload, at most 1 MiB
Receipt              format: byte, base64 payload, at most 1 MiB
Small text attachment text filter, more than 0 and less than 1024 bytes
```

The logo combines `contentEncoding: "base64"` with `format: "uri"` to
select the file editor and preserve the complete data URL. `format: "binary"`
is the project's filename-bearing data URL convention. Neither branch sends
files to a server.

## Validation state

The supplied data has **no schema errors** under the demo validator. The
preloaded payloads encode “Signed.”, “Supplier” and “Paid”. This does not prove
that attachment sizes have been checked: size enforcement occurs when a local
file is selected, using its original byte size.

Bounds are numeric UI options here. This keeps the example compatible with
the demo validator's temporal format-bound keywords; those keywords do not
provide a general validator for the decoded size of an attachment.

## Expected behavior

Select a small file in each field and inspect the demo's data pane. The first
two controls store data URLs, while the next two store only the base64 payload.
Select an image for the logo to see the schema-derived media filter.

For the bounded text attachment, try files of 0, 1, 1023 and 1024 bytes: only
the middle two satisfy both exclusive bounds. Main attachments accept exactly
1048576 bytes and reject larger selections. A rejected replacement must leave
the previous committed attachment intact.

## Fallback behavior

Without a size option there is no example-defined size limit. Without a media
type there is no schema-derived chooser filter. Filters are chooser hints,
not verification of file contents. Without a file renderer, a string fallback
cannot demonstrate selection-time size checks or file conversion.

Schema validation modes control schema-error presentation; they do not supply
missing file validation or change the stored representation.

## Status

The example demonstrates existing storage paths and selection-time bounds.
The wider portable contract also specifies `accept` overrides, cancellation,
`restrict: false`, and publishing read/size failures to the form's additional
errors. Those capabilities need adapter-level verification; this fixture does
not claim they work uniformly across renderer sets.
