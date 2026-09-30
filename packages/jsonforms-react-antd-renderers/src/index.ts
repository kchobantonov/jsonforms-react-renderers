import AntdCompositeCell, {
  antdCompositeCellTester,
} from './cells/AntdCompositeCell';
import { MixedRenderer, mixedControlTester } from './complex/MixedRenderer';
import ChipsControl, { chipsControlTester } from './complex/ChipsControl';
import MultiSelectControl, {
  multiSelectControlTester,
} from './complex/MultiSelectControl';
import {
  TupleControlRenderer,
  tupleControlRendererTester,
} from './complex/TupleControlRenderer';
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import {
  allOfControlTester,
  AllOfRenderer,
  anyOfControlTester,
  AnyOfRenderer,
  ArrayControlRenderer,
  arrayControlTester,
  objectControlTester,
  ObjectRenderer,
  oneOfControlTester,
  OneOfRenderer,
  scalarCompositionTester,
  ScalarCompositionRenderer,
  EnumArrayRenderer,
  enumArrayRendererTester,
} from './complex';
import {
  LabelRenderer,
  labelRendererTester,
  ListWithDetailRenderer,
  listWithDetailTester,
} from './additional';
import {
  AnyOfStringOrEnumControl,
  anyOfStringOrEnumControlTester,
  BooleanControl,
  booleanControlTester,
  BooleanToggleControl,
  booleanToggleControlTester,
  DateControl,
  dateControlTester,
  DateTimeControl,
  dateTimeControlTester,
  TimeControl,
  timeControlTester,
  EnumControl,
  enumControlTester,
  IntegerControl,
  integerControlTester,
  NativeControl,
  nativeControlTester,
  NumberControl,
  numberControlTester,
  OneOfEnumControl,
  oneOfEnumControlTester,
  PasswordControl,
  passwordControlTester,
  PasswordOtpControl,
  passwordOtpControlTester,
  RadioGroupControl,
  radioGroupControlTester,
  SliderControl,
  sliderControlTester,
  TextControl,
  textControlTester,
  OneOfRadioGroupControl,
  oneOfRadioGroupControlTester,
  FileControl,
  fileControlTester,
} from './controls';
import {
  ArrayLayout,
  arrayLayoutTester,
  CategorizationLayout,
  categorizationTester,
  GroupLayout,
  antdGroupTester,
  HorizontalLayout,
  horizontalLayoutTester,
  VerticalLayout,
  verticalLayoutTester,
} from './layouts';
import {
  BooleanCell,
  booleanCellTester,
  BooleanToggleCell,
  booleanToggleCellTester,
  DateCell,
  dateCellTester,
  EnumCell,
  enumCellTester,
  IntegerCell,
  integerCellTester,
  NumberCell,
  numberCellTester,
  NumberFormatCell,
  numberFormatCellTester,
  OneOfEnumCell,
  oneOfEnumCellTester,
  PasswordCell,
  passwordCellTester,
  TextCell,
  textCellTester,
  TimeCell,
  timeCellTester,
} from './cells';
import CategorizationStepperLayout, {
  categorizationStepperTester,
} from './layouts/CategorizationStepperLayout';
import CategorizationAccordionLayout, {
  categorizationAccordionTester,
} from './layouts/CategorizationAccordionLayout';

export * from './additional';
export * from './cells';
export * from './complex';
export * from './controls';
export * from './layouts';
export * from './util';
export * from './locale';

export const antdRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
  { tester: mixedControlTester, renderer: MixedRenderer },
  { tester: multiSelectControlTester, renderer: MultiSelectControl },
  { tester: chipsControlTester, renderer: ChipsControl },
  { tester: tupleControlRendererTester, renderer: TupleControlRenderer },
  {
    tester: arrayControlTester,
    renderer: ArrayControlRenderer,
  },
  { tester: booleanControlTester, renderer: BooleanControl },
  {
    tester: booleanToggleControlTester,
    renderer: BooleanToggleControl,
  },
  { tester: nativeControlTester, renderer: NativeControl },
  { tester: enumControlTester, renderer: EnumControl },
  { tester: integerControlTester, renderer: IntegerControl },
  { tester: numberControlTester, renderer: NumberControl },
  { tester: textControlTester, renderer: TextControl },
  { tester: passwordControlTester, renderer: PasswordControl },
  { tester: passwordOtpControlTester, renderer: PasswordOtpControl },
  { tester: dateTimeControlTester, renderer: DateTimeControl },
  { tester: dateControlTester, renderer: DateControl },
  { tester: timeControlTester, renderer: TimeControl },
  { tester: sliderControlTester, renderer: SliderControl },
  { tester: objectControlTester, renderer: ObjectRenderer },
  /*
    Above the three combinator renderers: a composition that describes one
    scalar editor gets one input rather than a branch selector. Below the
    finite-choice renderers at rank 5, which keep their own conventions.
  */
  {
    tester: scalarCompositionTester,
    renderer: ScalarCompositionRenderer,
  },
  { tester: allOfControlTester, renderer: AllOfRenderer },
  { tester: anyOfControlTester, renderer: AnyOfRenderer },
  { tester: oneOfControlTester, renderer: OneOfRenderer },
  { tester: fileControlTester, renderer: FileControl },
  {
    tester: radioGroupControlTester,
    renderer: RadioGroupControl,
  },
  {
    tester: oneOfRadioGroupControlTester,
    renderer: OneOfRadioGroupControl,
  },
  {
    tester: oneOfEnumControlTester,
    renderer: OneOfEnumControl,
  },
  // layouts
  { tester: antdGroupTester, renderer: GroupLayout },
  {
    tester: horizontalLayoutTester,
    renderer: HorizontalLayout,
  },
  { tester: verticalLayoutTester, renderer: VerticalLayout },
  {
    tester: categorizationTester,
    renderer: CategorizationLayout,
  },
  {
    tester: categorizationStepperTester,
    renderer: CategorizationStepperLayout,
  },
  {
    tester: categorizationAccordionTester,
    renderer: CategorizationAccordionLayout,
  },
  { tester: arrayLayoutTester, renderer: ArrayLayout },
  // additional
  { tester: labelRendererTester, renderer: LabelRenderer },
  {
    tester: listWithDetailTester,
    renderer: ListWithDetailRenderer,
  },
  {
    tester: anyOfStringOrEnumControlTester,
    renderer: AnyOfStringOrEnumControl,
  },
  {
    tester: enumArrayRendererTester,
    renderer: EnumArrayRenderer,
  },
];

export const antdCells: JsonFormsCellRendererRegistryEntry[] = [
  // Rank 1 fallback: objects and arrays that no specialised cell handles get a
  // summary plus a detail dialog instead of rendering nothing.
  { tester: antdCompositeCellTester, cell: AntdCompositeCell },
  { tester: booleanCellTester, cell: BooleanCell },
  { tester: booleanToggleCellTester, cell: BooleanToggleCell },
  { tester: dateCellTester, cell: DateCell },
  { tester: enumCellTester, cell: EnumCell },
  { tester: integerCellTester, cell: IntegerCell },
  { tester: numberCellTester, cell: NumberCell },
  { tester: numberFormatCellTester, cell: NumberFormatCell },
  { tester: oneOfEnumCellTester, cell: OneOfEnumCell },
  { tester: textCellTester, cell: TextCell },
  { tester: passwordCellTester, cell: PasswordCell },
  { tester: timeCellTester, cell: TimeCell },
];

import { UnwrappedAdditional } from './additional/unwrapped';
import { UnwrappedComplex } from './complex/unwrapped';
import { UnwrappedControls } from './controls/unwrapped';
import { UnwrappedLayouts } from './layouts/unwrapped';

export const Unwrapped = {
  ...UnwrappedAdditional,
  ...UnwrappedComplex,
  ...UnwrappedControls,
  ...UnwrappedLayouts,
};

export * from './antd-controls';

export { RowDetailFrame } from './complex/RowDetailFrame';
