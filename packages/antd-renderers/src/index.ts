/*
  The MIT License

  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
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
  RadioGroupControl,
  radioGroupControlTester,
  SliderControl,
  sliderControlTester,
  TextControl,
  textControlTester,
  OneOfRadioGroupControl,
  oneOfRadioGroupControlTester,
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
  TextCell,
  textCellTester,
  TimeCell,
  timeCellTester,
} from './cells';
import CategorizationStepperLayout, {
  categorizationStepperTester,
} from './layouts/CategorizationStepperLayout';

export * from './additional';
export * from './cells';
export * from './complex';
export * from './controls';
export * from './layouts';
export * from './util';

export const antdRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
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
  { tester: dateTimeControlTester, renderer: DateTimeControl },
  { tester: dateControlTester, renderer: DateControl },
  { tester: timeControlTester, renderer: TimeControl },
  { tester: sliderControlTester, renderer: SliderControl },
  { tester: objectControlTester, renderer: ObjectRenderer },
  { tester: allOfControlTester, renderer: AllOfRenderer },
  { tester: anyOfControlTester, renderer: AnyOfRenderer },
  { tester: oneOfControlTester, renderer: OneOfRenderer },
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
  { tester: booleanCellTester, cell: BooleanCell },
  { tester: booleanToggleCellTester, cell: BooleanToggleCell },
  { tester: dateCellTester, cell: DateCell },
  { tester: enumCellTester, cell: EnumCell },
  { tester: integerCellTester, cell: IntegerCell },
  { tester: numberCellTester, cell: NumberCell },
  { tester: numberFormatCellTester, cell: NumberFormatCell },
  { tester: oneOfEnumCellTester, cell: OneOfEnumCell },
  { tester: textCellTester, cell: TextCell },
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
