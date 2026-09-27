import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { registerSpecExamples } from '../registry';
import data from './data.json';
import schema from './schema.json';
import translations from './translations.json';
import uischema from './uischema.json';

registerSpecExamples([
  {
    id: 'temporal-controls',
    label: 'Temporal controls',
    schema: schema as JsonSchema,
    uischema: uischema as UISchemaElement,
    data,
    translations,
  },
]);

export { data, schema, translations, uischema };
