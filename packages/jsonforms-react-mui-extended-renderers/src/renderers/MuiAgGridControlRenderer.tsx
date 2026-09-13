import { createAgGridControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from '@mui/material';
import { MuiEditorFrame } from './MuiEditorFrame';
export const MuiAgGridControlRenderer = createAgGridControlRenderer({
  Frame: MuiEditorFrame,
  Button,
});
