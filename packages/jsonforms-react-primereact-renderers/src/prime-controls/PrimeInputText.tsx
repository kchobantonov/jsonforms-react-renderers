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
import { CellProps, WithClassname } from '@jsonforms/core';
import every from 'lodash/every';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import merge from 'lodash/merge';
import { AutoComplete, AutoCompleteProps } from 'primereact/autocomplete';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Password, PasswordProps } from 'primereact/password';
import React, { CSSProperties, useState } from 'react';
import { useDebouncedChange } from '../util';

const eventToValue = (ev: any) =>
  ev.target.value === '' ? undefined : ev.target.value;

export const PrimeInputText = React.memo(function PrimeInputText(
  props: CellProps &
    WithClassname & {
      inputProps?: React.ComponentProps<
        | typeof InputText
        | typeof InputTextarea
        | typeof Password
        | typeof AutoComplete
      >;
    }
) {
  const {
    data,
    config,
    className,
    id,
    enabled,
    uischema,
    path,
    handleChange,
    schema,
    errors,
    inputProps,
  } = props;
  const maxLength = schema.maxLength;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);

  const [inputText, onChange, _onClear] = useDebouncedChange(
    handleChange,
    '',
    data,
    path,
    eventToValue
  );

  let InputComponent: React.ComponentType<any> = InputText;

  const specificProps: Record<string, any> = {};

  const suggestions = appliedUiSchemaOptions?.suggestion;

  if (isArray(suggestions) && every(suggestions, isString)) {
    const options = suggestions as string[];
    InputComponent = AutoComplete;

    const search = (event: { query: string }) => {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(event.query.toLowerCase())
      );
      setFilteredOptions(filtered);
    };

    (specificProps as AutoCompleteProps).suggestions = filteredOptions;
    (specificProps as AutoCompleteProps).completeMethod = search;
    (specificProps as AutoCompleteProps).inputStyle = { width: '100%' };
  }

  const inputStyle: CSSProperties =
    !appliedUiSchemaOptions.trim || maxLength === undefined
      ? { width: '100%' }
      : {};

  if (appliedUiSchemaOptions.multi) {
    inputStyle.resize = 'vertical';
    inputStyle.overflow = 'auto';
    InputComponent = InputTextarea;

    specificProps.rows = 5;
  }

  if (schema.format === 'password') {
    InputComponent = Password;

    (specificProps as PasswordProps).toggleMask = true; // be able to display the password as plain text
    (specificProps as PasswordProps).feedback = false; // do not show how strong is the password
    (specificProps as PasswordProps).inputStyle = { width: '100%' };
  }

  return (
    <InputComponent
      value={inputText}
      onChange={onChange}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      style={inputStyle}
      maxLength={maxLength}
      placeholder={appliedUiSchemaOptions.placeholder}
      {...specificProps}
      invalid={!!errors}
      {...inputProps}
    />
  );
});
