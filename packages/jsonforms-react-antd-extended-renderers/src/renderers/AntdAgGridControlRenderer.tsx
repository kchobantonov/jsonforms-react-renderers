import { createAgGridControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from 'antd';
import { AntdEditorFrame } from './AntdEditorFrame';
export const AntdAgGridControlRenderer = createAgGridControlRenderer({
  Frame: AntdEditorFrame,
  Button,
});
