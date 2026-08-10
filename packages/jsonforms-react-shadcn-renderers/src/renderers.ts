import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import {
  withJsonFormsArrayLayoutProps,
  withJsonFormsControlProps,
  withJsonFormsEnumProps,
  withJsonFormsLabelProps,
  withJsonFormsLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import { ShadcnLabelRenderer, labelRendererTester } from './additional';
import { shadcnCells } from './cells';
import {
  MixedRenderer,
  ShadcnArrayRenderer,
  ShadcnObjectRenderer,
  arrayControlTester,
  mixedControlTester,
  objectControlTester,
} from './complex';
import {
  ShadcnBooleanControl,
  ShadcnDateControl,
  ShadcnDateTimeControl,
  ShadcnEnumControl,
  ShadcnIntegerControl,
  ShadcnNumberInputControl,
  ShadcnTextControl,
  ShadcnTimeControl,
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
  ShadcnCategorizationLayout,
  ShadcnGroupLayout,
  ShadcnHorizontalLayout,
  ShadcnVerticalLayout,
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

export const shadcnRenderers: JsonFormsRendererRegistryEntry[] = [
  { tester: mixedControlTester, renderer: MixedRenderer },
  {
    tester: arrayControlTester,
    renderer: withJsonFormsArrayLayoutProps(ShadcnArrayRenderer),
  },
  {
    tester: objectControlTester,
    renderer: withJsonFormsControlProps(ShadcnObjectRenderer),
  },
  {
    tester: booleanControlTester,
    renderer: withJsonFormsControlProps(ShadcnBooleanControl),
  },
  {
    tester: enumControlTester,
    renderer: withJsonFormsEnumProps(
      withTranslateProps(ShadcnEnumControl),
      false
    ),
  },
  {
    tester: integerControlTester,
    renderer: withJsonFormsControlProps(ShadcnIntegerControl),
  },
  {
    tester: numberControlTester,
    renderer: withJsonFormsControlProps(ShadcnNumberInputControl),
  },
  {
    tester: dateTimeControlTester,
    renderer: withJsonFormsControlProps(ShadcnDateTimeControl),
  },
  {
    tester: dateControlTester,
    renderer: withJsonFormsControlProps(ShadcnDateControl),
  },
  {
    tester: timeControlTester,
    renderer: withJsonFormsControlProps(ShadcnTimeControl),
  },
  {
    tester: textControlTester,
    renderer: withJsonFormsControlProps(ShadcnTextControl),
  },
  {
    tester: groupTester,
    renderer: withJsonFormsLayoutProps(ShadcnGroupLayout),
  },
  {
    tester: horizontalLayoutTester,
    renderer: withJsonFormsLayoutProps(ShadcnHorizontalLayout),
  },
  {
    tester: verticalLayoutTester,
    renderer: withJsonFormsLayoutProps(ShadcnVerticalLayout),
  },
  {
    tester: categorizationTester,
    renderer: withJsonFormsLayoutProps(ShadcnCategorizationLayout),
  },
  {
    tester: labelRendererTester,
    renderer: withJsonFormsLabelProps(ShadcnLabelRenderer),
  },
];

export { shadcnCells };
export const advancedShadcnRenderers = shadcnRenderers;
