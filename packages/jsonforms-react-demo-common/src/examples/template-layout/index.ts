import { type JsonSchema } from '@jsonforms/core';
import { registerProjectExamples } from '../registry';
import config from './config.json';
import data from './data.json';
//import i18n from './i18n.json';
import schema from './schema.json';
import uischema from './uischema.json';

registerProjectExamples([
  {
    name: 'template-layout',
    label: 'Template Layout',
    data,
    schema: schema as any as JsonSchema,
    uischema,
    /*
      The JSX profile compiles the template and evaluates it, which the
      portable contract treats as string evaluation - so the example has to
      grant the permission a host would.
    */
    config,
  },
]);
