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
  ControlProps,
  isDateControl,
  isTimeControl,
  or,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import merge from 'lodash/merge';
import { InputText } from 'primereact/inputtext';
import React from 'react';
import { useDebouncedChange } from '../util';
import { InputControl } from './InputControl';

export const NativeControl = (props: ControlProps) => {
  const { id, schema, enabled, visible, path, handleChange, data, config } =
    props;
  const appliedUiSchemaOptions = merge({}, config, props.uischema.options);
  const [inputValue, onChange] = useDebouncedChange(
    handleChange,
    '',
    data,
    path
  );
  const fieldType = appliedUiSchemaOptions.format ?? schema.format;

  const inputStyle = appliedUiSchemaOptions.trim ? {} : { width: '100%' };

  if (!visible) {
    return null;
  }

  return (
    <InputControl
      {...props}
      input={
        <InputText
          id={id + '-input'}
          type={fieldType}
          disabled={!enabled}
          style={inputStyle}
          value={inputValue}
          onChange={onChange}
        />
      }
    />
  );
};

export const nativeControlTester: RankedTester = rankWith(
  2,
  or(isDateControl, isTimeControl)
);

export default withJsonFormsControlProps(NativeControl);
