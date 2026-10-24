import { ControlProps, RankedTester } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { InputControl } from '@chobantonov/jsonforms-react-antd-renderers';
import { extendedMaskTester } from '@chobantonov/jsonforms-react-extended-renderers';
import React from 'react';
import { AntdMaskInput } from './AntdMaskInput';

/**
 * Selection is `options.mask` carrying a pattern, on a string with no format of
 * its own. See `maskControls.ts` for why presence alone is not enough.
 */
export const antdMaskControlTester: RankedTester = extendedMaskTester;

export const AntdMaskControl = (props: ControlProps) => (
  <InputControl {...props} input={AntdMaskInput} />
);

export const AntdMaskControlRenderer =
  withJsonFormsControlProps(AntdMaskControl);
