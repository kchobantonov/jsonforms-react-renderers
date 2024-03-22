/*
  The MIT License

  Copyright (c) 2018-2019 EclipseSource Munich
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
  and,
  ControlProps,
  ControlState,
  EnumCellProps,
  JsonSchema,
  RankedTester,
  rankWith,
  schemaMatches,
  uiTypeIs,
  WithClassname,
} from '@jsonforms/core';
import { Control, withJsonFormsControlProps } from '@jsonforms/react';
import merge from 'lodash/merge';
import React, { useMemo, useState } from 'react';
import { useDebouncedChange } from '../util';
import { InputControl } from './InputControl';
import { AutoComplete } from 'antd';

interface AutoCompleteOption {
  value: string;
}

const findEnumSchema = (schemas: JsonSchema[]) =>
  schemas.find(
    (s) => s.enum !== undefined && (s.type === 'string' || s.type === undefined)
  );
const findTextSchema = (schemas: JsonSchema[]) =>
  schemas.find((s) => s.type === 'string' && s.enum === undefined);

const AntdAutocompleteInputText = (props: EnumCellProps & WithClassname) => {
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
  } = props;
  const enumSchema = findEnumSchema(schema.anyOf);
  const stringSchema = findTextSchema(schema.anyOf);
  const maxLength = stringSchema.maxLength;
  const appliedUiSchemaOptions = useMemo(
    () => merge({}, config, uischema.options),
    [config, uischema.options]
  );
  const options: AutoCompleteOption[] = enumSchema.enum?.map((value) => ({
    value,
  }));
  const [filteredOptions, setFilteredOptions] =
    useState<AutoCompleteOption[]>(options);
  const [inputText, onChange] = useDebouncedChange(
    handleChange,
    '',
    data,
    path,
    (ev: any) => ev || undefined
  );
  const onSearch = (searchText: string) => {
    setFilteredOptions(
      !searchText
        ? options
        : options.filter((option) =>
            option.value.toLowerCase().includes(searchText)
          )
    );
  };
  const inputStyle =
    !appliedUiSchemaOptions.trim || maxLength === undefined
      ? { width: '100%' }
      : {};
  return (
    <AutoComplete
      value={inputText}
      onSearch={onSearch}
      onChange={onChange}
      onSelect={onChange}
      options={filteredOptions}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      maxLength={maxLength}
      style={inputStyle}
      allowClear={true}
    />
  );
};

export class AnyOfStringOrEnumControl extends Control<
  ControlProps,
  ControlState
> {
  render() {
    return <InputControl {...this.props} input={AntdAutocompleteInputText} />;
  }
}
const hasEnumAndText = (schemas: JsonSchema[]) => {
  // idea: map to type,enum and check that all types are string and at least one item is of type enum,
  const enumSchema = findEnumSchema(schemas);
  const stringSchema = findTextSchema(schemas);
  const remainingSchemas = schemas.filter(
    (s) => s !== enumSchema || s !== stringSchema
  );
  const wrongType = remainingSchemas.find((s) => s.type && s.type !== 'string');
  return enumSchema && stringSchema && !wrongType;
};
const simpleAnyOf = and(
  uiTypeIs('Control'),
  schemaMatches(
    (schema) =>
      Object.prototype.hasOwnProperty.call(schema, 'anyOf') &&
      hasEnumAndText(schema.anyOf)
  )
);
export const anyOfStringOrEnumControlTester: RankedTester = rankWith(
  5,
  simpleAnyOf
);
export default withJsonFormsControlProps(AnyOfStringOrEnumControl);
