import { ControlProps } from '@jsonforms/core';
import React from 'react';
export type EditorControlFrameProps = React.PropsWithChildren<ControlProps>;
export type EditorActionProps = React.PropsWithChildren<{
  disabled?: boolean;
  onClick?: React.MouseEventHandler<any>;
}>;
export type EditorRendererComponents = {
  Frame: React.ComponentType<EditorControlFrameProps>;
  Button: React.ComponentType<EditorActionProps>;
};
