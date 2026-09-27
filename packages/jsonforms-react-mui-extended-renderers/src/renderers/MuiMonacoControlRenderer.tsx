import { createMonacoControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { MuiEditorButton } from './MuiEditorButton';
import { MuiEditorFrame } from './MuiEditorFrame';
export const MuiMonacoControlRenderer = createMonacoControlRenderer({
  Frame: MuiEditorFrame,
  Button: MuiEditorButton,
});
