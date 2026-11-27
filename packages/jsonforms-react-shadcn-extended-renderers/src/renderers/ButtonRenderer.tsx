import React from 'react';
import { withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import {
  buttonRendererTester,
  createButtonRenderer,
  type ButtonUiSchema,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from '@jsonforms-react-shadcn-ui/button';

export type ShadcnButtonElement = ButtonUiSchema;
export const shadcnButtonRendererTester = buttonRendererTester;

const variants = {
  primary: 'default',
  secondary: 'outline',
  alternative: 'secondary',
  success: 'default',
  warning: 'outline',
  error: 'destructive',
} as const;

/** Keep action, script, permission and pending semantics shared across adapters. */
export const ShadcnButtonRenderer = createButtonRenderer({
  withProps: false,
  ButtonComponent: ({ icon, children, ...props }) => (
    <Button {...props}>
      {icon ? <span aria-hidden='true'>{icon}</span> : null}
      {children}
    </Button>
  ),
  getButtonProps: ({ color, icon, uischema }) => ({
    icon,
    variant:
      uischema.options?.variant ??
      (color ? variants[color] : undefined) ??
      'default',
    className:
      [
        color === 'warning' && 'text-destructive',
        uischema.options?.fullWidth === true && 'w-full',
      ]
        .filter(Boolean)
        .join(' ') || undefined,
  }),
});

export const ShadcnButtonRendererWithProps = withJsonFormsLayoutProps(
  withTranslateProps(ShadcnButtonRenderer as any) as any,
);
