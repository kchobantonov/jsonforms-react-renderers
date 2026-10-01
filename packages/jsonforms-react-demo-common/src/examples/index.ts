import './extended-controls';
import * as file from './file';
import './template-layout';
import * as presentation from './presentation';
import './horizontal-sizing';
import './presentation-renderers';
import './collapsible-groups';
import './split-layout';
import './spec';
import { listExamples } from './registry';

// Every import above has run, so the registry now holds this project's
// examples plus the official ones `@jsonforms/examples` registers on import.
// `listExamples` re-registers the official ones under `jsonforms-<name>` /
// `JsonForms: <label>` and returns only the prefixed copies alongside ours.
const examples = listExamples();

export { file, presentation };
export * from './registry';
export * from './spec';
export default examples;
