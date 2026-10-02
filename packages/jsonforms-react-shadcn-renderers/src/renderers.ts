import { ChoiceCards } from './controls/ChoiceCards';
import { choiceCardsTester } from '@chobantonov/jsonforms-react-renderer-common/choiceCards';
import {
  ShadcnArrayChoicesControl,
  chipsControlTester,
  multiSelectControlTester,
  enumArrayControlTester,
} from './complex/ArrayChoicesControl';
import ScalarCompositionRenderer, {
  scalarCompositionTester,
} from './complex/ScalarCompositionRenderer';
import {
  and,
  isOneOfEnumControl,
  optionIs,
  rankWith,
  JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import {
  ShadcnPasswordControl,
  ShadcnPasswordOtpControl,
  passwordControlTester,
  passwordOtpControlTester,
} from './controls/PasswordControl';
import {
  TupleControlRenderer,
  tupleControlRendererTester,
} from './complex/TupleControlRenderer';
import {
  anyOfStringOrEnumControlTester,
  ShadcnAnyOfStringOrEnumControl,
} from './controls/AnyOfStringOrEnumControl';
import {
  withJsonFormsArrayLayoutProps,
  withJsonFormsControlProps,
  withJsonFormsEnumProps,
  withJsonFormsOneOfEnumProps,
  withJsonFormsLabelProps,
  withJsonFormsLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import { ShadcnLabelRenderer, labelRendererTester } from './additional';
import {
  oneOfControlTester,
  ShadcnOneOfControl,
  allOfControlTester,
  anyOfControlTester,
  MixedRenderer,
  ShadcnAllOfControl,
  ShadcnAnyOfControl,
  ShadcnArrayRenderer,
  ShadcnObjectRenderer,
  arrayControlTester,
  mixedControlTester,
  objectControlTester,
} from './complex';
import {
  ShadcnOneOfEnumControl,
  oneOfEnumControlTester,
  ShadcnBooleanToggleControl,
  booleanToggleControlTester,
  ShadcnRadioGroupControl,
  radioGroupControlTester,
  ShadcnSliderControl,
  sliderControlTester,
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
  categorizationAccordionTester,
  categorizationStepperTester,
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
  { tester: choiceCardsTester, renderer: ChoiceCards },
  ...[chipsControlTester, multiSelectControlTester, enumArrayControlTester].map(
    (tester) => ({
      tester,
      renderer: withJsonFormsControlProps(ShadcnArrayChoicesControl),
    })
  ),
  { tester: scalarCompositionTester, renderer: ScalarCompositionRenderer },
  {
    tester: rankWith(20, and(isOneOfEnumControl, optionIs('format', 'radio'))),
    renderer: withJsonFormsOneOfEnumProps(ShadcnRadioGroupControl),
  },
  {
    tester: passwordControlTester,
    renderer: withJsonFormsControlProps(ShadcnPasswordControl),
  },
  {
    tester: passwordOtpControlTester,
    renderer: withJsonFormsControlProps(ShadcnPasswordOtpControl),
  },
  { tester: tupleControlRendererTester, renderer: TupleControlRenderer },
  {
    tester: anyOfStringOrEnumControlTester,
    renderer: withJsonFormsControlProps(ShadcnAnyOfStringOrEnumControl),
  },
  {
    tester: categorizationAccordionTester,
    renderer: withJsonFormsLayoutProps(ShadcnCategorizationLayout),
  },
  {
    tester: categorizationStepperTester,
    renderer: withJsonFormsLayoutProps(ShadcnCategorizationLayout),
  },
  {
    tester: booleanToggleControlTester,
    renderer: withJsonFormsControlProps(ShadcnBooleanToggleControl),
  },
  {
    tester: radioGroupControlTester,
    renderer: withJsonFormsEnumProps(ShadcnRadioGroupControl),
  },
  {
    tester: sliderControlTester,
    renderer: withJsonFormsControlProps(ShadcnSliderControl),
  },
  { tester: oneOfEnumControlTester, renderer: ShadcnOneOfEnumControl },
  { tester: oneOfControlTester, renderer: ShadcnOneOfControl },
  { tester: allOfControlTester, renderer: ShadcnAllOfControl },
  { tester: anyOfControlTester, renderer: ShadcnAnyOfControl },
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

export const advancedShadcnRenderers = shadcnRenderers;
