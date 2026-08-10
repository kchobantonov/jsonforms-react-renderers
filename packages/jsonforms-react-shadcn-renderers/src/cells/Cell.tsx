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
import React from 'react';

export const ShadcnCell = ({ data }: CellProps) => (
  <span>{data === undefined || data === null ? '' : String(data)}</span>
);

export const shadcnCells: JsonFormsCellRendererRegistryEntry[] = [
  {
    tester: rankWith(1, isBooleanControl),
    cell: withJsonFormsCellProps(ShadcnCell),
  },
  {
    tester: rankWith(1, isEnumControl),
    cell: withJsonFormsCellProps(ShadcnCell),
  },
  {
    tester: rankWith(1, isIntegerControl),
    cell: withJsonFormsCellProps(ShadcnCell),
  },
  {
    tester: rankWith(1, isNumberControl),
    cell: withJsonFormsCellProps(ShadcnCell),
  },
  {
    tester: rankWith(1, isStringControl),
    cell: withJsonFormsCellProps(ShadcnCell),
  },
];
