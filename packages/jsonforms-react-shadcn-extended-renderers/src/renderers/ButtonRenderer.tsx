import {
  LayoutProps,
  RankedTester,
  UISchemaElement,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { useJsonForms, withJsonFormsLayoutProps } from '@jsonforms/react';
import { useHandleAction } from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from '@chobantonov/jsonforms-react-shadcn-renderers';
import React from 'react';

export type ShadcnButtonElement = UISchemaElement & {
  label?: string;
  text?: string;
  name?: string;
  action?: string;
  icon?: string;
  params?: Record<string, unknown>;
  script?: string;
  options?: Record<string, any>;
};

export const shadcnButtonRendererTester: RankedTester = rankWith(
  1,
  uiTypeIs('Button')
);

export const ShadcnButtonRenderer = ({
  enabled,
  visible,
  uischema,
}: LayoutProps & { uischema: ShadcnButtonElement }) => {
  const handleAction = useHandleAction();
  const jsonforms = useJsonForms();
  const [loading, setLoading] = React.useState(false);
  if (!visible) return null;
  const options = uischema.options ?? {};
  const label =
    options.label ??
    options.text ??
    uischema.label ??
    uischema.text ??
    uischema.name ??
    'Action';
  const configuredAction = options.action ?? uischema.action;
  const action = configuredAction ?? uischema.name ?? label;
  const params = options.params ?? uischema.params;
  const script = options.script ?? uischema.script;
  return (
    <Button
      className='shadcn-jsonforms-button'
      type='button'
      variant={options.variant}
      disabled={!enabled || options.disabled || loading}
      aria-busy={loading || undefined}
      onClick={async () => {
        if (loading) return;
        setLoading(true);
        try {
          if (configuredAction && handleAction) {
            await handleAction({ action, label, params, element: uischema });
          } else if (script) {
            const AsyncFunction = Object.getPrototypeOf(
              async function () {}
            ).constructor;
            await new AsyncFunction(script).call({
              action,
              context: jsonforms,
              params: params ? { ...params } : {},
              element: uischema,
            });
          } else if (handleAction) {
            await handleAction({ action, label, params, element: uischema });
          }
        } finally {
          setLoading(false);
        }
      }}
    >
      {uischema.icon ? <span aria-hidden='true'>{uischema.icon}</span> : null}
      {loading ? `${label}…` : label}
    </Button>
  );
};

export const ShadcnButtonRendererWithProps =
  withJsonFormsLayoutProps(ShadcnButtonRenderer);
