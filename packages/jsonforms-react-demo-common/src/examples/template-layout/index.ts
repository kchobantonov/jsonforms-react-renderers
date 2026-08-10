import { type JsonSchema } from '@jsonforms/core';
import { registerExamples } from '@jsonforms/examples';
import data from './data.json';
//import i18n from './i18n.json';
import schema from './schema.json';
import uischema from './uischema.json';

registerExamples([
  {
    name: 'template-layout',
    label: 'Template Layout',
    data,
    schema: schema as any as JsonSchema,
    uischema,
  },
]);
