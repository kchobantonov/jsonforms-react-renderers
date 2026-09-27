import { RankedTester } from '@jsonforms/core';
import {
  buttonRendererTester,
  createButtonRenderer,
} from '@chobantonov/jsonforms-react-extended-renderers';

/*
  Section 14's closed set, restated rather than imported: the base package
  publishes its types from a build, and a renderer set should not need that
  build to be up to date before it can compile.
*/
type ButtonSemanticColor =
  | 'primary'
  | 'secondary'
  | 'alternative'
  | 'success'
  | 'warning'
  | 'error';
import { Button } from 'antd';

export const antdButtonRendererTester = buttonRendererTester as RankedTester;

/**
 * Section 14's semantic colors, mapped onto antd's button props.
 *
 * The names are semantic rather than visual on purpose - `error` rather than
 * `red` - so a theme decides what they look like. antd expresses the
 * destructive one as a separate `danger` flag rather than a type, and has no
 * distinct `warning` button, which takes the same treatment.
 */
const COLORS: Record<ButtonSemanticColor, Record<string, unknown>> = {
  primary: { type: 'primary' },
  secondary: { type: 'default' },
  alternative: { type: 'dashed' },
  success: { type: 'primary' },
  warning: { type: 'default', danger: true },
  error: { type: 'primary', danger: true },
};

export const AntdButtonRenderer = createButtonRenderer({
  ButtonComponent: Button,
  buttonProps: { htmlType: 'button', type: 'primary' },
  getButtonProps: ({ pending, color }: any) => ({
    // "Pending/loading covers the complete fireActionEvent promise."
    loading: pending,
    ...(color ? COLORS[color] ?? {} : {}),
  }),
});
