import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { registerSpecExamples } from '../registry';
import config from './config.json';
import data from './data.json';
import schema from './schema.json';
import translations from './translations.json';
import uischema from './uischema.json';

/**
 * The validator, rather than the renderers.
 *
 * Every tab here is something **Ajv** does before a renderer sees anything:
 * report a failure, rewrite a value, fill a field in, or say it in another
 * language. The UI schema is deliberately dull - four tabs of plain Controls -
 * because the point is that none of this is renderer behaviour.
 *
 * The one thing to check when reading the catalog: it contains **no error
 * text**. `enrolment.*` are the schema's own messages; the wording of
 * `must be >= 1` and its Bulgarian equivalent comes from `ajv-i18n`, through
 * `createFormsAjv`'s `localizers`.
 */

registerSpecExamples([
  {
    id: 'validator-profile',
    label: 'Validator profile (Ajv)',
    schema: schema as JsonSchema,
    uischema: uischema as unknown as UISchemaElement,
    data,
    config,
    translations,
  },
]);

export { config, data, schema, translations, uischema };
