import { PrimeSplitLayoutRenderer, primeSplitLayoutTester } from './renderers/SplitLayoutRenderer';
import {
  JsonFormsRendererRegistryEntry,
  RankedTester,
} from '@jsonforms/core';
import {
  createButtonRenderer,
  createExtendedRenderers,
  buttonRendererTester,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import React from 'react';

export type PrimeReactExtendedRendererOptions = {
  components?: Record<string, React.ComponentType<any>>;
};

export const createPrimeReactExtendedRenderers = (
  options: PrimeReactExtendedRendererOptions = {}
): JsonFormsRendererRegistryEntry[] => {
  const buttonRenderer = createButtonRenderer({
    ButtonComponent: Button,
    buttonProps: {
      severity: 'secondary',
      size: 'small',
    },
  });

  return [
    { tester: primeSplitLayoutTester, renderer: PrimeSplitLayoutRenderer },
    {
      tester: buttonRendererTester as RankedTester,
      renderer: buttonRenderer,
    },
    ...createExtendedRenderers({
      components: {
        Button,
        Message,
        ...(options.components ?? {}),
      },
      includeButtonRenderer: false,
    }),
  ];
};

export const primereactExtendedRenderers = createPrimeReactExtendedRenderers();
export const advancedPrimeReactRenderers = primereactExtendedRenderers;

export * from '@chobantonov/jsonforms-react-extended-renderers';

export * from './renderers/SplitLayoutRenderer';
