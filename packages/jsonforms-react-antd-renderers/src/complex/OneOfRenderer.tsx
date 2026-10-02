import { CombinatorBranch } from '@chobantonov/jsonforms-react-renderer-common/CombinatorBranch';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import { shouldConfirm } from '../util/confirmation';

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
import { branchChangeData, discardedByBranchChange } from '../util/combinators';

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

  /*
    The displayed branch follows the data until the user picks one.

    Section 18 asks the form to show the branch that fits the existing value -
    "if the value matches a later oneOf branch, display that branch" - and the
    selection was derived once, at mount, and never again. A discriminated
    oneOf therefore went stale the moment its discriminator changed: choosing
    "Post" left the collection-point field on screen, which is the whole
    mechanism by which a schema, with no UI rule, decides which fields exist.

    Once the user selects a branch themselves the choice is theirs, and the
    write that selection makes puts the data on the branch anyway. A value
    that fits *nothing* leaves the display where it is: section 18 keeps a
    fallback branch on screen "alongside validation errors, while retaining
    the incoming data for correction", and blanking the form mid-edit would
    hide the very field the correction needs.
  */
  const chosen = useRef(false);
  useEffect(() => {
    if (
      !chosen.current &&
      indexOfFittingSchema !== null &&
      indexOfFittingSchema !== undefined
    ) {
      setSelectedIndex(indexOfFittingSchema);
    }
  }, [indexOfFittingSchema]);
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

  /*
    A branch change initializes from the new branch's generated defaults and
    carries the enclosing schema's own properties across. It used to write the
    generated defaults alone, which silently dropped every enclosing value -
    `name` in the specification's worked example - on every switch, and on a
    clear.
  */
  const openNewTab = (newIndex: number | null) => {
    const defaults =
      newIndex !== null
        ? createDefaultValue(oneOfRenderInfos[newIndex].schema, rootSchema)
        : undefined;
    handleChange(path, branchChangeData(data, defaults, schema));
    setSelectedIndex(newIndex);
  };

  const confirm = useCallback(() => {
    openNewTab(newSelectedIndex);
    setConfirmDialogOpen(false);
  }, [handleChange, createDefaultValue, newSelectedIndex, data, schema]);

  const handleTabChange = useCallback(
    (value: string | null) => {
      const newOneOfIndex =
        value === null || value === undefined ? null : parseInt(value, 10);

      // Re-selecting the branch already in use is not a change.
      if (newOneOfIndex === selectedIndex) {
        return;
      }
      chosen.current = true;

      setNewSelectedIndex(newOneOfIndex);
      /*
        Was `!isEmpty(data)`, which is close to `always` but not the policy:
        it could not be configured, and lodash's `isEmpty` calls `0` and `false`
        empty - values section 14 explicitly counts as existing. Clearing the
        selection (`null`) is a branchChange too, and used to skip the prompt
        entirely.
      */
      if (
        shouldConfirm(
          {
            options: uischema.options as Record<string, unknown> | undefined,
            config,
            catalogId: 'oneOf',
            operation: 'branchChange',
          },
          // Only what the switch actually discards: the enclosing properties
          // survive it, so they are not values being thrown away.
          [discardedByBranchChange(data, schema)]
        )
      ) {
        setConfirmDialogOpen(true);
        return;
      }
      openNewTab(newOneOfIndex);
    },
    [config, data, schema, selectedIndex, uischema]
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
  const style = { width: '100%' };

  if (!visible) {
    return null;
  }

  if (oneOfRenderInfos.length === 1) {
    const branch = oneOfRenderInfos[0];
    return (
      <>
        <CombinatorProperties
          schema={schema}
          combinatorKeyword={'oneOf'}
          path={path}
          rootSchema={rootSchema}
        />
        <CombinatorBranch
          options={uischema.options}
          schema={branch.schema}
          path={path}
        >
          <JsonFormsDispatch
            schema={branch.schema}
            uischema={branch.uischema}
            path={path}
            renderers={renderers}
            cells={cells}
            enabled={enabled}
          />
        </CombinatorBranch>
      </>
    );
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
          options={oneOfRenderInfos.map((info, idx) => ({
            value: String(idx),
            label: info.label,
          }))}
        />
      </Form.Item>

      {selectedIndex !== undefined && selectedIndex !== null && (
        <CombinatorBranch
          options={uischema.options}
          schema={oneOfRenderInfos[selectedIndex].schema}
          path={path}
        >
          <JsonFormsDispatch
            uischema={oneOfRenderInfos[selectedIndex].uischema}
            schema={oneOfRenderInfos[selectedIndex].schema}
            path={path}
            renderers={renderers}
            cells={cells}
          />
        </CombinatorBranch>
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
