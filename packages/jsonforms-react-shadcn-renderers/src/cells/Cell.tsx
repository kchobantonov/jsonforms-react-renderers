import {
  isIntegerControl,
  isDateControl,
  isTimeControl,
  isDateTimeControl,
  isBooleanControl,
  isEnumControl,
  isOneOfEnumControl,
  isNumberControl,
  isStringControl,
  JsonFormsCellRendererRegistryEntry,
  rankWith,
} from '@jsonforms/core';
import { asShadcnCell } from './asCell';
import { ShadcnDateControl } from '../controls/DateControl';
import { ShadcnTimeControl } from '../controls/TimeControl';
import { ShadcnDateTimeControl } from '../controls/DateTimeControl';
import {
  withJsonFormsControlProps,
  withJsonFormsCellProps,
} from '@jsonforms/react';
import {
  ShadcnCompositeCell,
  shadcnCompositeCellTester,
} from './CompositeCell';
import { ShadcnBooleanCell } from './BooleanCell';
import { ShadcnEnumCell } from './EnumCell';
import { ShadcnNumberCell } from './NumberCell';
import { ShadcnTextCell } from './TextCell';

export { ShadcnTextCell as ShadcnCell } from './TextCell';
export const shadcnCells: JsonFormsCellRendererRegistryEntry[] = [
  {
    tester: rankWith(5, isOneOfEnumControl),
    cell: withJsonFormsCellProps(ShadcnEnumCell),
  },
  {
    tester: rankWith(3, isDateControl),
    cell: asShadcnCell(withJsonFormsControlProps(ShadcnDateControl)) as any,
  },
  {
    tester: rankWith(3, isTimeControl),
    cell: asShadcnCell(withJsonFormsControlProps(ShadcnTimeControl)) as any,
  },
  {
    tester: rankWith(3, isDateTimeControl),
    cell: asShadcnCell(withJsonFormsControlProps(ShadcnDateTimeControl)) as any,
  },
  {
    tester: shadcnCompositeCellTester,
    cell: withJsonFormsCellProps(ShadcnCompositeCell),
  },
  {
    tester: rankWith(2, isIntegerControl),
    cell: withJsonFormsCellProps(ShadcnNumberCell),
  },
  {
    tester: rankWith(2, isBooleanControl),
    cell: withJsonFormsCellProps(ShadcnBooleanCell),
  },
  {
    tester: rankWith(3, isEnumControl),
    cell: withJsonFormsCellProps(ShadcnEnumCell),
  },
  {
    tester: rankWith(2, isNumberControl),
    cell: withJsonFormsCellProps(ShadcnNumberCell),
  },
  {
    tester: rankWith(1, isStringControl),
    cell: withJsonFormsCellProps(ShadcnTextCell),
  },
];
