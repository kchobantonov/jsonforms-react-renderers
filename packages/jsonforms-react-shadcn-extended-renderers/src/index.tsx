import { extendedAgGridTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { ShadcnAgGridControlRenderer } from './renderers/ShadcnAgGridControlRenderer';
import { monacoControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { ShadcnMonacoControlRenderer } from './renderers/ShadcnMonacoControlRenderer';
import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { createExtendedRenderers } from '@chobantonov/jsonforms-react-extended-renderers';
import {
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
} from './renderers';

export const createShadcnExtendedRenderers =
  (): JsonFormsRendererRegistryEntry[] => {
    return [
      { tester: extendedAgGridTester, renderer: ShadcnAgGridControlRenderer },
      { tester: monacoControlTester, renderer: ShadcnMonacoControlRenderer },
      {
        tester: shadcnButtonRendererTester,
        renderer: ShadcnButtonRendererWithProps,
      },
      { tester: colorControlTester, renderer: ColorControlRenderer },
      { tester: durationControlTester, renderer: DurationControlRenderer },
      { tester: fileControlTester, renderer: FileControlRenderer },
      { tester: nullControlTester, renderer: NullControlRenderer },
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

export * from './renderers/ShadcnMonacoControlRenderer';

export * from './renderers/ShadcnAgGridControlRenderer';
