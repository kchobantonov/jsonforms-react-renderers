import React from 'react';
import { isOneOfEnumControl, rankWith } from '@jsonforms/core';
import {
  withJsonFormsOneOfEnumProps,
  withTranslateProps,
} from '@jsonforms/react';
import { ShadcnEnumControl } from './EnumControl';

export const oneOfEnumControlTester = rankWith(5, isOneOfEnumControl);
export const ShadcnOneOfEnumControl = withJsonFormsOneOfEnumProps(
  withTranslateProps(React.memo(ShadcnEnumControl)),
  false
);
