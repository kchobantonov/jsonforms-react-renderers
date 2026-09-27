import {
  extendedAgGridTester,
  markupLabelTester,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { AntdAgGridControlRenderer } from './renderers/AntdAgGridControlRenderer';
import { monacoControlTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { AntdMonacoControlRenderer } from './renderers/AntdMonacoControlRenderer';
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import { createExtendedRenderers } from '@chobantonov/jsonforms-react-extended-renderers';
import { Alert, Button } from 'antd';
import React from 'react';
import {
  AntdButtonRenderer,
  AntdColorControlRenderer,
  AntdCronControlRenderer,
  AntdMarkupLabelRenderer,
  AntdDurationControlRenderer,
  AntdMaskControlRenderer,
  AntdNullControlRenderer,
  AntdSplitLayoutRenderer,
  antdButtonRendererTester,
  antdColorControlTester,
  antdCronControlTester,
  antdDurationControlTester,
  antdMaskControlTester,
  antdNullControlTester,
  antdSplitLayoutTester,
} from './renderers';
import { asCell } from './renderers/asCell';

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
    /*
      Ahead of the extended set's own entry for the same tester: both rank 3,
      and JSON Forms breaks a tie by taking the first maximum, so the one with
      antd's typography wins.
    */
    { tester: markupLabelTester, renderer: AntdMarkupLabelRenderer },
    { tester: antdCronControlTester, renderer: AntdCronControlRenderer },
    {
      tester: antdDurationControlTester,
      renderer: AntdDurationControlRenderer,
    },
    { tester: antdMaskControlTester, renderer: AntdMaskControlRenderer },
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

/**
 * The extended controls, registered as **cells**.
 *
 * Both array presentations - the AG Grid renderer and the antd table - draw a
 * column through `DispatchCell` against the *cells* registry, never the
 * renderer registry, because dispatching a renderer would pick the object
 * renderer and inline a whole detail form in the cell. The consequence is
 * easy to miss: a control that exists only as a **renderer** is unreachable
 * in a column, and the column silently falls back to `TextCell` - a colour
 * field shows `#3366ff` as text, a duration shows `P2DT3H`.
 *
 * These entries close that. They are the **same components**, not cell-only
 * copies: `ControlFormItem` already drops the label and the inline message
 * when it is inside a `CellModeProvider`, which is exactly what a column
 * needs, so there is nothing for a second implementation to do.
 *
 * Kept out of the base `antdCells` because the components live here, and the
 * base renderer set must not depend on the extended one. That makes this
 * opt-in: a host that does not concatenate it keeps the text fallback.
 *
 * `monacoControlTester` is deliberately absent. A code editor is not a cell -
 * it draws no `ControlFormItem`, it wants height a row does not have, and the
 * composite detail dialog is where a value that large belongs.
 */
export const createAntdExtendedCells =
  (): JsonFormsCellRendererRegistryEntry[] =>
    [
      {
        tester: antdColorControlTester,
        cell: asCell(AntdColorControlRenderer),
      },
      {
        tester: antdCronControlTester,
        cell: asCell(AntdCronControlRenderer),
      },
      {
        tester: antdDurationControlTester,
        cell: asCell(AntdDurationControlRenderer),
      },
      { tester: antdMaskControlTester, cell: asCell(AntdMaskControlRenderer) },
      { tester: antdNullControlTester, cell: asCell(AntdNullControlRenderer) },
      /*
        `asCell` is why these are not registered directly, and the cast is
        what is left after it: a cell entry is typed `CellProps` while these
        read `ControlProps`. See `asCell.tsx` for the one field the two
        registries genuinely disagree about.
      */
    ] as unknown as JsonFormsCellRendererRegistryEntry[];

export const antdExtendedCells = createAntdExtendedCells();
export const advancedAntdRenderers = antdExtendedRenderers;

export * from '@chobantonov/jsonforms-react-extended-renderers';
export * from './renderers';

export * from './renderers/AntdMonacoControlRenderer';

export * from './renderers/AntdAgGridControlRenderer';

export * from './util/colorFormat';

export * from './util/maskFormat';

/*
  Re-exported so a consumer of this renderer set - the web component, in
  particular - gets the validator these renderers expect without also having
  to depend on the base extended package directly.
*/
export { createFormsAjv } from '@chobantonov/jsonforms-react-extended-renderers';
export type { FormsAjvOptions } from '@chobantonov/jsonforms-react-extended-renderers';
