import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { createExtendedRenderers } from '@chobantonov/jsonforms-react-extended-renderers';
import React from 'react';
import {
  AgGridArrayControlRenderer,
  ShadcnButtonRendererWithProps,
  ColorControlRenderer,
  DurationControlRenderer,
  FileControlRenderer,
  NullControlRenderer,
  SplitLayoutRenderer,
  shadcnButtonRendererTester,
  colorControlTester,
  durationControlTester,
  fileControlTester,
  nullControlTester,
  splitLayoutTester,
  agGridArrayTester,
} from './renderers';

export type ShadcnExtendedRendererOptions = {
  components?: Record<string, React.ComponentType<any>>;
};

export const createShadcnExtendedRenderers = (
  options: ShadcnExtendedRendererOptions = {}
): JsonFormsRendererRegistryEntry[] => {
  return [
    { tester: shadcnButtonRendererTester, renderer: ShadcnButtonRendererWithProps },
    { tester: colorControlTester, renderer: ColorControlRenderer },
    { tester: durationControlTester, renderer: DurationControlRenderer },
    { tester: fileControlTester, renderer: FileControlRenderer },
    { tester: nullControlTester, renderer: NullControlRenderer },
    { tester: agGridArrayTester, renderer: AgGridArrayControlRenderer },
    { tester: splitLayoutTester, renderer: SplitLayoutRenderer },
    ...createExtendedRenderers({
      components: options.components,
      includeButtonRenderer: false,
    }),
  ];
};

export const shadcnExtendedRenderers = createShadcnExtendedRenderers();
export const advancedShadcnRenderers = shadcnExtendedRenderers;

export * from './theme';
export * from './renderers';
export * from '@chobantonov/jsonforms-react-extended-renderers';
