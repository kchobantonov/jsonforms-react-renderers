import { RankedTester } from '@jsonforms/core';
import {
  buttonRendererTester,
  createButtonRenderer,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from '@mui/material';

export const muiButtonRendererTester = buttonRendererTester as RankedTester;

export const MuiButtonRenderer = createButtonRenderer({
  ButtonComponent: Button,
  buttonProps: {
    variant: 'contained',
    size: 'small',
  },
});
