import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { registerSpecExamples } from '../registry';
import config from './config.json';
import data from './data.json';
import schema from './schema.json';
import translations from './translations.json';
import uischema from './uischema.json';

registerSpecExamples([
  {
    id: 'categorization',
    label: 'Categorization: tabs, stepper, accordion',
    schema: schema as JsonSchema,
    uischema: uischema as UISchemaElement,
    data,
    config,
    translations,
  },
]);

export { config, data, schema, translations, uischema };
