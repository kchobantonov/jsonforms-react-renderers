import { createMonacoControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { ShadcnEditorButton } from './ShadcnEditorButton';
import { ShadcnEditorFrame } from './ShadcnEditorFrame';
export const ShadcnMonacoControlRenderer = createMonacoControlRenderer({
  Frame: ShadcnEditorFrame,
  Button: ShadcnEditorButton,
});
