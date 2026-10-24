import React from 'react';
import {
  CombinatorRendererProps,
  isOneOfControl,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsOneOfProps } from '@jsonforms/react';
import { ShadcnAnyOfRenderer } from './AnyOfRenderer';

export const ShadcnOneOfRenderer = (props: CombinatorRendererProps) => (
  <ShadcnAnyOfRenderer {...props} combinator='oneOf' />
);
export const oneOfControlTester = rankWith(3, isOneOfControl);
export const ShadcnOneOfControl = withJsonFormsOneOfProps(ShadcnOneOfRenderer);
