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
import React, { useCallback, useState } from 'react';
import isEmpty from 'lodash/isEmpty';

import { TabSwitchConfirmDialog } from './TabSwitchConfirmDialog';

import {
  CombinatorRendererProps,
  createCombinatorRenderInfos,
  createDefaultValue,
  isDescriptionHidden,
  isOneOfControl,
  JsonSchema,
  OwnPropsOfControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { Select, Form } from 'antd';
import { JsonFormsDispatch, withJsonFormsOneOfProps } from '@jsonforms/react';
import CombinatorProperties from './CombinatorProperties';
import merge from 'lodash/merge';
import { useFocus } from '../util';
const { Option } = Select;

export interface OwnOneOfProps extends OwnPropsOfControl {
  indexOfFittingSchema?: number;
}

export const OneOfRenderer = ({
  handleChange,
  schema,
  path,
  renderers,
  cells,
  rootSchema,
  id,
  visible,
  indexOfFittingSchema,
  uischema,
  uischemas,
  data,
  enabled,
  config,
  required,
  errors,
  label,
  description,
}: CombinatorRendererProps) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(
    indexOfFittingSchema !== null && indexOfFittingSchema !== undefined
      ? indexOfFittingSchema
      : !isEmpty(data)
      ? 0 // uses the first schema and report errors if not empty
      : null
  );
  const [newSelectedIndex, setNewSelectedIndex] = useState(0);
  const handleClose = useCallback(
    () => setConfirmDialogOpen(false),
    [setConfirmDialogOpen]
  );
  const cancel = useCallback(() => {
    setConfirmDialogOpen(false);
  }, [setConfirmDialogOpen]);
  const oneOfRenderInfos = createCombinatorRenderInfos(
    (schema as JsonSchema).oneOf,
    rootSchema,
    'oneOf',
    uischema,
    path,
    uischemas
  );

  const openNewTab = (newIndex: number | null) => {
    handleChange(
      path,
      newIndex !== null
        ? createDefaultValue(oneOfRenderInfos[newIndex].schema, rootSchema)
        : undefined
    );
    setSelectedIndex(newIndex);
  };

  const confirm = useCallback(() => {
    openNewTab(newSelectedIndex);
    setConfirmDialogOpen(false);
  }, [handleChange, createDefaultValue, newSelectedIndex]);

  const handleTabChange = useCallback(
    (value: string | null) => {
      const newOneOfIndex =
        value === null || value === undefined ? null : parseInt(value, 10);

      setNewSelectedIndex(newOneOfIndex);
      if (isEmpty(data)) {
        openNewTab(newOneOfIndex);
      } else {
        setConfirmDialogOpen(true);
      }
    },
    [setConfirmDialogOpen, setSelectedIndex, data]
  );

  const [focused, onFocus, onBlur] = useFocus();

  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const isValid = errors.length === 0;
  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  const help = !isValid ? errors : showDescription ? description : null;
  const style = !appliedUiSchemaOptions.trim ? { width: '100%' } : {};

  if (!visible) {
    return null;
  }

  return (
    <>
      <CombinatorProperties
        schema={schema}
        combinatorKeyword={'oneOf'}
        path={path}
        rootSchema={rootSchema}
      />
      <Form.Item
        required={required}
        hasFeedback={!isValid}
        validateStatus={isValid ? 'success' : 'error'}
        label={label}
        help={help}
        style={style}
        htmlFor={id + '-input'}
        id={id}
      >
        <Select
          id={id + '-input'}
          disabled={!enabled}
          autoFocus={appliedUiSchemaOptions.focus}
          placeholder={appliedUiSchemaOptions.placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          value={selectedIndex?.toString()}
          onChange={handleTabChange}
          allowClear={enabled}
        >
          {oneOfRenderInfos.map((oneOfRenderInfo, idx) => (
            <Option value={String(idx)} key={String(idx)}>
              {oneOfRenderInfo.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {selectedIndex !== undefined && selectedIndex !== null && (
        <JsonFormsDispatch
          uischema={oneOfRenderInfos[selectedIndex].uischema}
          schema={oneOfRenderInfos[selectedIndex].schema}
          path={path}
          renderers={renderers}
          cells={cells}
        />
      )}

      <TabSwitchConfirmDialog
        cancel={cancel}
        confirm={confirm}
        id={'oneOf-' + id}
        open={confirmDialogOpen}
        handleClose={handleClose}
      />
    </>
  );
};

export const oneOfControlTester: RankedTester = rankWith(3, isOneOfControl);

export default withJsonFormsOneOfProps(OneOfRenderer);
