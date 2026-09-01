import { RankedTester } from '@jsonforms/core';
import {
  buttonRendererTester,
  createButtonRenderer,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from 'antd';

export const antdButtonRendererTester = buttonRendererTester as RankedTester;

export const AntdButtonRenderer = createButtonRenderer({
  ButtonComponent: Button,
  buttonProps: { htmlType: 'button', type: 'primary' },
});
