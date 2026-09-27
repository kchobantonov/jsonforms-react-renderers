import { registerProjectExamples } from '../registry';
import config from './config.json';
import schema from './schema.json';
import data from './data.json';
import uischema from './uischema.json';

registerProjectExamples([
  {
    name: 'presentation-renderers',
    label: 'Presentation Renderers',
    schema,
    data,
    uischema,
    /*
      The images here are inline `data:` URLs so the example needs no network,
      and inline image payloads are off by default under the URL policy.
    */
    config,
  },
]);
