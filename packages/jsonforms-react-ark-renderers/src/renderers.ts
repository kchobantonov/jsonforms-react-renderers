import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import {
  withJsonFormsArrayLayoutProps,
  withJsonFormsControlProps,
  withJsonFormsEnumProps,
  withJsonFormsLabelProps,
  withJsonFormsLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import { ArkLabelRenderer, labelRendererTester } from './additional';
import { arkCells } from './cells';
import {
  ArkArrayRenderer,
  ArkObjectRenderer,
  arrayControlTester,
  MixedRenderer,
  mixedControlTester,
  objectControlTester,
} from './complex';
import {
  ArkBooleanControl,
  ArkDateControl,
  ArkDateTimeControl,
  ArkEnumControl,
  ArkIntegerControl,
  ArkNumberInputControl,
  ArkTextControl,
  ArkTimeControl,
  booleanControlTester,
  dateControlTester,
  dateTimeControlTester,
  enumControlTester,
  integerControlTester,
  numberControlTester,
  textControlTester,
  timeControlTester,
} from './controls';
import {
  ArkCategorizationLayout,
  ArkGroupLayout,
  ArkHorizontalLayout,
  ArkVerticalLayout,
  categorizationTester,
  groupTester,
  horizontalLayoutTester,
  verticalLayoutTester,
} from './layouts';

export * from './additional';
export * from './cells';
export * from './complex';
export * from './controls';
export * from './layouts';

export const arkRenderers: JsonFormsRendererRegistryEntry[] = [
  { tester: mixedControlTester, renderer: MixedRenderer },
  {
    tester: arrayControlTester,
    renderer: withJsonFormsArrayLayoutProps(ArkArrayRenderer),
  },
  {
    tester: objectControlTester,
    renderer: withJsonFormsControlProps(ArkObjectRenderer),
  },
  {
    tester: booleanControlTester,
    renderer: withJsonFormsControlProps(ArkBooleanControl),
  },
  {
    tester: enumControlTester,
    renderer: withJsonFormsEnumProps(withTranslateProps(ArkEnumControl), false),
  },
  {
    tester: integerControlTester,
    renderer: withJsonFormsControlProps(ArkIntegerControl),
  },
  {
    tester: numberControlTester,
    renderer: withJsonFormsControlProps(ArkNumberInputControl),
  },
  {
    tester: dateTimeControlTester,
    renderer: withJsonFormsControlProps(ArkDateTimeControl),
  },
  {
    tester: dateControlTester,
    renderer: withJsonFormsControlProps(ArkDateControl),
  },
  {
    tester: timeControlTester,
    renderer: withJsonFormsControlProps(ArkTimeControl),
  },
  {
    tester: textControlTester,
    renderer: withJsonFormsControlProps(ArkTextControl),
  },
  { tester: groupTester, renderer: withJsonFormsLayoutProps(ArkGroupLayout) },
  {
    tester: horizontalLayoutTester,
    renderer: withJsonFormsLayoutProps(ArkHorizontalLayout),
  },
  {
    tester: verticalLayoutTester,
    renderer: withJsonFormsLayoutProps(ArkVerticalLayout),
  },
  {
    tester: categorizationTester,
    renderer: withJsonFormsLayoutProps(ArkCategorizationLayout),
  },
  {
    tester: labelRendererTester,
    renderer: withJsonFormsLabelProps(ArkLabelRenderer),
  },
];

export { arkCells };
export const advancedArkRenderers = arkRenderers;
