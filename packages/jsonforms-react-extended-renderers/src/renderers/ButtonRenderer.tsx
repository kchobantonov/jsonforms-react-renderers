import {
  LayoutProps,
  RankedTester,
  UISchemaElement,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';
import { useHandleAction } from './actionContext';

export type ButtonUiSchema = UISchemaElement & {
  label?: string;
  text?: string;
  name?: string;
  options?: {
    action?: string;
    label?: string;
    text?: string;
    disabled?: boolean;
    [key: string]: any;
  };
};

export type ButtonRendererComponentProps = LayoutProps & {
  uischema: ButtonUiSchema;
};

export type ButtonRendererOptions = {
  ButtonComponent?: React.ComponentType<any>;
  buttonProps?: Record<string, any>;
  getButtonProps?: (props: ButtonRendererComponentProps) => Record<string, any>;
};

export const buttonRendererTester: RankedTester = rankWith(2, uiTypeIs('Button'));

export const createButtonRenderer = ({
  ButtonComponent = 'button' as any,
  buttonProps = {},
  getButtonProps,
}: ButtonRendererOptions = {}) => {
  const ButtonRenderer = ({
    enabled,
    uischema,
    visible,
    ...props
  }: ButtonRendererComponentProps) => {
    const handleAction = useHandleAction();

    if (!visible) {
      return null;
    }

    const label =
      uischema.options?.label ??
      uischema.options?.text ??
      uischema.label ??
      uischema.text ??
      uischema.name ??
      'Action';
    const action = uischema.options?.action ?? uischema.name ?? label;
    const disabled = !enabled || uischema.options?.disabled;
    const mappedProps = getButtonProps?.({
      enabled,
      uischema,
      visible,
      ...props,
    } as ButtonRendererComponentProps);

    return (
      <ButtonComponent
        type='button'
        {...buttonProps}
        {...mappedProps}
        disabled={disabled}
        onClick={() =>
          handleAction?.({
            action,
            label,
            uischema,
          })
        }
      >
        {label}
      </ButtonComponent>
    );
  };

  return withJsonFormsLayoutProps(ButtonRenderer);
};

export const ButtonRenderer = createButtonRenderer();
