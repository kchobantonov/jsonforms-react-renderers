import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { registerSpecExamples } from '../registry';
import config from './config.json';
import data from './data.json';
import schema from './schema.json';
import translations from './translations.json';
import uischema from './uischema.json';

/**
 * Every array presentation, on one schema, one tab each.
 *
 * The example is arranged so the **selection rules** are visible rather than
 * described: `sessions` and `speakers` both nest, and they get different
 * renderers because one of them asks for a table; `sponsors` is a
 * `ListWithDetail` element rather than a `Control` with an option; `tickets`
 * names its renderer outright with `variant: "ag-grid"`.
 *
 * Nothing here is composed in TypeScript - it is all portable JSON, unlike
 * the button and template-layout examples.
 */

registerSpecExamples([
  {
    id: 'array-controls',
    label: 'Array controls',
    schema: schema as JsonSchema,
    uischema: uischema as unknown as UISchemaElement,
    data,
    config,
    translations,
  },
]);

export { config, data, schema, translations, uischema };
