import { extendedAgGridTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { AntdAgGridControlRenderer } from './renderers/AntdAgGridControlRenderer';
import { monacoControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { AntdMonacoControlRenderer } from './renderers/AntdMonacoControlRenderer';
import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { createExtendedRenderers } from '@chobantonov/jsonforms-react-extended-renderers';
import { Alert, Button } from 'antd';
import React from 'react';
import {
  AntdButtonRenderer,
  AntdColorControlRenderer,
  AntdDurationControlRenderer,
  AntdNullControlRenderer,
  AntdSplitLayoutRenderer,
  antdButtonRendererTester,
  antdColorControlTester,
  antdDurationControlTester,
  antdNullControlTester,
  antdSplitLayoutTester,
} from './renderers';

export type AntdExtendedRendererOptions = {
  components?: Record<string, React.ComponentType<any>>;
};

export const createAntdExtendedRenderers = (
  options: AntdExtendedRendererOptions = {}
): JsonFormsRendererRegistryEntry[] => {
  return [
    { tester: extendedAgGridTester, renderer: AntdAgGridControlRenderer },
    { tester: monacoControlTester, renderer: AntdMonacoControlRenderer },
    {
      tester: antdButtonRendererTester,
      renderer: AntdButtonRenderer,
    },
    { tester: antdColorControlTester, renderer: AntdColorControlRenderer },
    {
      tester: antdDurationControlTester,
      renderer: AntdDurationControlRenderer,
    },
    { tester: antdNullControlTester, renderer: AntdNullControlRenderer },
    { tester: antdSplitLayoutTester, renderer: AntdSplitLayoutRenderer },
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
export * from './renderers';

export * from './renderers/AntdMonacoControlRenderer';

export * from './renderers/AntdAgGridControlRenderer';
