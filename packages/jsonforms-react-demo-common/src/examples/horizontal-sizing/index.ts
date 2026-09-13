import { registerExamples } from '@jsonforms/examples';
import schema from './schema.json';
import data from './data.json';
import uischema from './uischema.json';

registerExamples([
  {
    name: 'horizontal-sizing',
    label: 'Horizontal Layout Sizing',
    schema,
    data,
    uischema,
  },
]);
