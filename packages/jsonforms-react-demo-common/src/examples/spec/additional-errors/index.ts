import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { registerSpecExamples } from '../registry';
import config from './config.json';
import data from './data.json';
import schema from './schema.json';
import translations from './translations.json';
import uischema from './uischema.json';

/**
 * Errors that are not the schema's, from the two places they come from.
 *
 * A server rejecting a submit and a code editor's language service look like
 * completely different problems and are the same mechanism: an owner
 * publishes, the errors appear under the fields they name, and each owner's
 * errors clear on that owner's terms - the server's when the field is edited,
 * the editor's when it republishes.
 *
 * The example needs a **host** that installs the store's middleware; the
 * demo's `App` does. Without one the editors still mark their code - Monaco
 * always does - and the Submit button reports nothing, which is the honest
 * degradation rather than a broken example.
 */

registerSpecExamples([
  {
    id: 'additional-errors',
    label: 'Additional errors: server and editor',
    schema: schema as JsonSchema,
    uischema: uischema as unknown as UISchemaElement,
    data,
    config,
    translations,
  },
]);

export { config, data, schema, translations, uischema };
