import { createAgGridControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { ShadcnEditorButton } from './ShadcnEditorButton';
import { ShadcnEditorFrame } from './ShadcnEditorFrame';
export const ShadcnAgGridControlRenderer = createAgGridControlRenderer({
  Frame: ShadcnEditorFrame,
  Button: ShadcnEditorButton,
});
