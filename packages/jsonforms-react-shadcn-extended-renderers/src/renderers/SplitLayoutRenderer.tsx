import {
  RankedTester,
  UISchemaElement,
  and,
  or,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';

export const hasSplitLayoutVariant = (uischema: UISchemaElement): boolean =>
  String(uischema.options?.variant ?? '').toLowerCase() === 'splitter';

export const splitLayoutTester: RankedTester = rankWith(
  5,
  and(
    or(uiTypeIs('HorizontalLayout'), uiTypeIs('VerticalLayout')),
    hasSplitLayoutVariant
  )
);

export { SharedSplitLayout as ShadcnSplitLayout } from '@chobantonov/jsonforms-react-extended-renderers';
export { SharedSplitLayoutRenderer as SplitLayoutRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
