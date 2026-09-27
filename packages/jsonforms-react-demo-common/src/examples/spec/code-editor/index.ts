import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { registerSpecExamples } from '../registry';
import schema from './schema.json';
import uischema from './uischema.json';
import data from './data.json';
import translations from './translations.json';

registerSpecExamples([
  {
    id: 'code-editor',
    label: 'Code editor',
    schema: schema as JsonSchema,
    uischema: uischema as UISchemaElement,
    data,
    translations,
  },
]);

export { schema, uischema, data, translations };
