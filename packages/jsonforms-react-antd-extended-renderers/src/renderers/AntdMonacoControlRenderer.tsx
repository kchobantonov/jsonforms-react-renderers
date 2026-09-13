import { createMonacoControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from 'antd';
import { AntdEditorFrame } from './AntdEditorFrame';
export const AntdMonacoControlRenderer = createMonacoControlRenderer({
  Frame: AntdEditorFrame,
  Button,
});
