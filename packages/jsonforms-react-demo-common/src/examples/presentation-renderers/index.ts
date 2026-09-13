import { registerExamples } from '@jsonforms/examples';
import schema from './schema.json';
import data from './data.json';
import uischema from './uischema.json';

registerExamples([
  {
    name: 'presentation-renderers',
    label: 'Presentation Renderers',
    schema,
    data,
    uischema,
  },
]);
