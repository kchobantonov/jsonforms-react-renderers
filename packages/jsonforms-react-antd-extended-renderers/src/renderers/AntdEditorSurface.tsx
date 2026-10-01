import React from 'react';
import { theme as antTheme } from 'antd';
import type { EditorSurfaceProps } from '@chobantonov/jsonforms-react-extended-renderers';

/**
 * Chrome matching antd's Input.TextArea: same border, radius, background and
 * hover/focus/error transitions, with the editor in place of the textarea.
 */
export const AntdEditorSurface = ({
  children,
  hovered,
  focused,
  disabled,
  invalid,
  maximized,
}: EditorSurfaceProps) => {
  const { token } = antTheme.useToken();
  const borderColor = invalid
    ? focused || hovered
      ? token.colorErrorBorderHover
      : token.colorError
    : disabled
    ? token.colorBorder
    : focused
    ? token.colorPrimary
    : hovered
    ? token.colorPrimaryHover
    : token.colorBorder;
  return (
    <div
      style={{
        position: 'relative',
        height: maximized ? '100%' : undefined,
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: `${token.lineWidth}px ${token.lineType} ${borderColor}`,
        borderRadius: token.borderRadius,
        background: disabled
          ? token.colorBgContainerDisabled
          : token.colorBgContainer,
        boxShadow: focused
          ? `0 0 0 ${token.controlOutlineWidth}px ${
              invalid ? token.colorErrorOutline : token.controlOutline
            }`
          : undefined,
        transition: `border-color ${token.motionDurationMid}, box-shadow ${token.motionDurationMid}`,
      }}
    >
      {children}
    </div>
  );
};
