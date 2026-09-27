import { createAgGridControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { MuiEditorButton } from './MuiEditorButton';
import { MuiEditorFrame } from './MuiEditorFrame';
export const MuiAgGridControlRenderer = createAgGridControlRenderer({
  Frame: MuiEditorFrame,
  Button: MuiEditorButton,
});
