import { registerProjectExamples } from '../registry';
import schema from './schema.json';
import data from './data.json';
import uischema from './uischema.json';

registerProjectExamples([
  {
    name: 'horizontal-sizing',
    label: 'Horizontal Layout Sizing',
    schema,
    data,
    uischema,
  },
]);
