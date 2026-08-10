/// <reference path='./ark-ui-react-factory.d.ts' />

import {
  JsonFormsRendererRegistryEntry,
  RankedTester,
} from '@jsonforms/core';
import {
  buttonRendererTester,
  createButtonRenderer,
  createExtendedRenderers,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { ark } from '@ark-ui/react/factory';
import React from 'react';

export type ArkExtendedRendererOptions = {
  components?: Record<string, React.ComponentType<any>>;
};

export const ArkButton = (props: React.ComponentPropsWithoutRef<'button'>) => (
  <ark.button className='ark-jsonforms-button' {...props} />
);

export const ArkAlert = ({
  children,
  type,
  ...props
}: React.PropsWithChildren<{ type?: string }>) => (
  <ark.div className={`ark-jsonforms-alert ark-jsonforms-alert-${type ?? 'info'}`} {...props}>
    {children}
  </ark.div>
);

export const createArkExtendedRenderers = (
  options: ArkExtendedRendererOptions = {}
): JsonFormsRendererRegistryEntry[] => {
  const buttonRenderer = createButtonRenderer({
    ButtonComponent: ArkButton,
  });

  return [
    {
      tester: buttonRendererTester as RankedTester,
      renderer: buttonRenderer,
    },
    ...createExtendedRenderers({
      components: {
        Alert: ArkAlert,
        Button: ArkButton,
        ...(options.components ?? {}),
      },
      includeButtonRenderer: false,
    }),
  ];
};

export const arkExtendedRenderers = createArkExtendedRenderers();
export const advancedArkRenderers = arkExtendedRenderers;

export * from './theme';
export * from '@chobantonov/jsonforms-react-extended-renderers';
