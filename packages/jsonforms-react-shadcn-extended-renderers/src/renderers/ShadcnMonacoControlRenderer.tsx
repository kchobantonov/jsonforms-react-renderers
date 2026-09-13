import { createMonacoControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from '@chobantonov/jsonforms-react-shadcn-renderers';
import { ShadcnEditorFrame } from './ShadcnEditorFrame';
export const ShadcnMonacoControlRenderer = createMonacoControlRenderer({
  Frame: ShadcnEditorFrame,
  Button,
});
