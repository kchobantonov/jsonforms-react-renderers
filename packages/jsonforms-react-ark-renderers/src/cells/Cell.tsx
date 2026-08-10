/// <reference path='../ark-ui-react-factory.d.ts' />

import {
  CellProps,
  isBooleanControl,
  isEnumControl,
  isIntegerControl,
  isNumberControl,
  isStringControl,
  JsonFormsCellRendererRegistryEntry,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { ark } from '@ark-ui/react/factory';
import React from 'react';

export const ArkCell = ({ data }: CellProps) => (
  <ark.span>{data === undefined || data === null ? '' : String(data)}</ark.span>
);

export const arkCells: JsonFormsCellRendererRegistryEntry[] = [
  {
    tester: rankWith(1, isBooleanControl),
    cell: withJsonFormsCellProps(ArkCell),
  },
  { tester: rankWith(1, isEnumControl), cell: withJsonFormsCellProps(ArkCell) },
  {
    tester: rankWith(1, isIntegerControl),
    cell: withJsonFormsCellProps(ArkCell),
  },
  {
    tester: rankWith(1, isNumberControl),
    cell: withJsonFormsCellProps(ArkCell),
  },
  {
    tester: rankWith(1, isStringControl),
    cell: withJsonFormsCellProps(ArkCell),
  },
];
