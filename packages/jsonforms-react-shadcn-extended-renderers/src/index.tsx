import { MaskControlRenderer, maskControlTester } from './renderers/MaskControlRenderer';
export * from './renderers/MaskControlRenderer';
import { extendedAgGridTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { ShadcnAgGridControlRenderer } from './renderers/ShadcnAgGridControlRenderer';
import { monacoControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { ShadcnMonacoControlRenderer } from './renderers/ShadcnMonacoControlRenderer';
import { asShadcnCell } from '@chobantonov/jsonforms-react-shadcn-renderers';
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import { createExtendedRenderers } from '@chobantonov/jsonforms-react-extended-renderers';
import {
  ShadcnButtonRendererWithProps,
  ColorControlRenderer,
  CronControlRenderer,
  cronControlTester,
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
      { tester: maskControlTester, renderer: MaskControlRenderer },
      { tester: extendedAgGridTester, renderer: ShadcnAgGridControlRenderer },
      { tester: monacoControlTester, renderer: ShadcnMonacoControlRenderer },
      {
        tester: shadcnButtonRendererTester,
        renderer: ShadcnButtonRendererWithProps,
      },
      { tester: cronControlTester, renderer: CronControlRenderer },
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

export const createShadcnExtendedCells =
  (): JsonFormsCellRendererRegistryEntry[] => [
    { tester: fileControlTester, cell: asShadcnCell(FileControlRenderer) as any },
    {
      tester: colorControlTester,
      cell: asShadcnCell(ColorControlRenderer) as any,
    },
    {
      tester: durationControlTester,
      cell: asShadcnCell(DurationControlRenderer) as any,
    },
    {
      tester: cronControlTester,
      cell: asShadcnCell(CronControlRenderer) as any,
    },
    {
      tester: nullControlTester,
      cell: asShadcnCell(NullControlRenderer) as any,
    },
  ];
export const shadcnExtendedCells = createShadcnExtendedCells();
