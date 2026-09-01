import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { createExtendedRenderers } from '@chobantonov/jsonforms-react-extended-renderers';
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

export const createShadcnExtendedRenderers =
  (): JsonFormsRendererRegistryEntry[] => {
    return [
      {
        tester: shadcnButtonRendererTester,
        renderer: ShadcnButtonRendererWithProps,
      },
      { tester: colorControlTester, renderer: ColorControlRenderer },
      { tester: durationControlTester, renderer: DurationControlRenderer },
      { tester: fileControlTester, renderer: FileControlRenderer },
      { tester: nullControlTester, renderer: NullControlRenderer },
      { tester: agGridArrayTester, renderer: AgGridArrayControlRenderer },
      { tester: splitLayoutTester, renderer: SplitLayoutRenderer },
      ...createExtendedRenderers({
        components: undefined,
        includeButtonRenderer: false,
      }),
    ];
  };

export const shadcnExtendedRenderers = createShadcnExtendedRenderers();
export const advancedShadcnRenderers = shadcnExtendedRenderers;

export * from './theme';
export * from './renderers';
export * from '@chobantonov/jsonforms-react-extended-renderers';
