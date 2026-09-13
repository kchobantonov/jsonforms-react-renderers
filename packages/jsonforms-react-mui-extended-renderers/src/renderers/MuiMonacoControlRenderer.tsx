import { createMonacoControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from '@mui/material';
import { MuiEditorFrame } from './MuiEditorFrame';
export const MuiMonacoControlRenderer = createMonacoControlRenderer({
  Frame: MuiEditorFrame,
  Button,
});
