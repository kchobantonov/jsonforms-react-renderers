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
import isEmpty from 'lodash/isEmpty';
import React, { useCallback, useState } from 'react';

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
import { JsonFormsDispatch, withJsonFormsOneOfProps } from '@jsonforms/react';
import merge from 'lodash/merge';
import { Dropdown } from 'primereact/dropdown';
import { FormEvent } from 'primereact/ts-helpers';
import { useFocus } from '../util';
import CombinatorProperties from './CombinatorProperties';

export interface OwnOneOfProps extends OwnPropsOfControl {
  indexOfFittingSchema?: number;
}

export const OneOfRenderer = (props: CombinatorRendererProps) => {
  const {
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
    errors,
    label,
    required,
    description,
  } = props;

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
    (event: FormEvent<number | null | undefined>) => {
      const newOneOfIndex =
        event.value === null || event.value === undefined ? null : event.value;

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
  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );
  const help = !isValid ? errors : showDescription ? description : null;

  const selectStyle = appliedUiSchemaOptions.trim ? {} : { width: '100%' };

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

      <div className='flex flex-column gap-2' id={id} style={selectStyle}>
        <label htmlFor={id + '-input'}>{label}</label>
        <Dropdown
          id={id + '-input'}
          disabled={!enabled}
          autoFocus={appliedUiSchemaOptions.focus}
          value={selectedIndex}
          onChange={handleTabChange}
          style={selectStyle}
          showClear={enabled}
          checkmark={true}
          onFocus={onFocus}
          onBlur={onBlur}
          options={oneOfRenderInfos.map((oneOfRenderInfo, idx) => ({
            value: idx,
            label: oneOfRenderInfo.label,
          }))}
          required={required}
          invalid={!!errors}
        ></Dropdown>
        {help && (
          <small
            className={!isValid ? 'p-error' : 'p-description'}
            style={{ display: 'block', marginTop: '5px' }}
          >
            {help}
          </small>
        )}
      </div>

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
