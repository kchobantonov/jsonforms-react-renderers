import { getExamples } from '@jsonforms/examples';
import * as file from './file';
import * as templateLayout from './template-layout';
import * as presentation from './presentation';
import * as horizontalSizing from './horizontal-sizing';
import * as presentationRenderers from './presentation-renderers';
import './collapsible-groups';

const examples = getExamples();

export {
  file,
  templateLayout,
  presentation,
  horizontalSizing,
  presentationRenderers,
};
export default examples;
