import {
  JsonFormsRendererRegistryEntry,
  RankedTester,
} from '@jsonforms/core';
import {
  createButtonRenderer,
  createExtendedRenderers,
  buttonRendererTester,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { Alert, Button } from 'antd';
import React from 'react';

export type AntdExtendedRendererOptions = {
  components?: Record<string, React.ComponentType<any>>;
};

export const createAntdExtendedRenderers = (
  options: AntdExtendedRendererOptions = {}
): JsonFormsRendererRegistryEntry[] => {
  const buttonRenderer = createButtonRenderer({
    ButtonComponent: Button,
    buttonProps: {
      type: 'primary',
      htmlType: 'button',
    },
  });

  return [
    {
      tester: buttonRendererTester as RankedTester,
      renderer: buttonRenderer,
    },
    ...createExtendedRenderers({
      components: {
        Alert,
        Button,
        ...(options.components ?? {}),
      },
      includeButtonRenderer: false,
    }),
  ];
};

export const antdExtendedRenderers = createAntdExtendedRenderers();
export const advancedAntdRenderers = antdExtendedRenderers;

export * from '@chobantonov/jsonforms-react-extended-renderers';
