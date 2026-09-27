import React from 'react';
import { Button } from 'antd';
import type { EditorActionProps } from '@chobantonov/jsonforms-react-extended-renderers';

/**
 * Maps the renderer-agnostic action props onto antd's Button.
 * Follows Ant Design Pro's toolbar convention: the primary action carries an
 * icon and a label, destructive ones are icon-only with a tooltip.
 */
export const AntdEditorButton = ({
  variant,
  icon,
  children,
  ...props
}: EditorActionProps) => (
  <Button
    {...props}
    icon={icon}
    type={variant === 'primary' ? 'primary' : 'default'}
    danger={variant === 'danger'}
  >
    {children}
  </Button>
);

/** Borderless variant used for the editor's maximize/restore toggle. */
export const AntdEditorToggleButton = ({
  icon,
  children,
  // our own union; antd's Button has an unrelated `variant` prop
  variant: _variant,
  ...props
}: EditorActionProps) => (
  <Button {...props} icon={icon} type='text' size='small'>
    {children}
  </Button>
);
