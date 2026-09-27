import React, { useCallback, useState } from 'react';
import isEmpty from 'lodash/isEmpty';

import { TabSwitchConfirmDialog } from './TabSwitchConfirmDialog';

import {
  and,
  CombinatorRendererProps,
  createCombinatorRenderInfos,
  createDefaultValue,
  isOneOfControl,
  JsonSchema,
  optionIs,
  OwnPropsOfControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { Tabs } from 'antd';
import { JsonFormsDispatch, withJsonFormsOneOfProps } from '@jsonforms/react';
import CombinatorProperties from './CombinatorProperties';

export interface OwnOneOfProps extends OwnPropsOfControl {
  indexOfFittingSchema?: number;
}

export const OneOfTabRenderer = ({
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
}: CombinatorRendererProps) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(indexOfFittingSchema || 0);
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

  const openNewTab = (newIndex: number) => {
    handleChange(
      path,
      createDefaultValue(oneOfRenderInfos[newIndex].schema, rootSchema)
    );
    setSelectedIndex(newIndex);
  };

  const confirm = useCallback(() => {
    openNewTab(newSelectedIndex);
    setConfirmDialogOpen(false);
  }, [handleChange, createDefaultValue, newSelectedIndex]);

  const handleTabChange = useCallback(
    (value: string) => {
      const newOneOfIndex = parseInt(value, 10);

      setNewSelectedIndex(newOneOfIndex);
      if (isEmpty(data)) {
        openNewTab(newOneOfIndex);
      } else {
        setConfirmDialogOpen(true);
      }
    },
    [setConfirmDialogOpen, setSelectedIndex, data]
  );

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
      <Tabs
        defaultActiveKey={selectedIndex?.toString()}
        onChange={handleTabChange}
        items={oneOfRenderInfos.map(
          (oneOfRenderInfo, idx) =>
            ({
              label: oneOfRenderInfo.label,
              key: String(idx),
              children: (
                <JsonFormsDispatch
                  schema={oneOfRenderInfo.schema}
                  uischema={oneOfRenderInfo.uischema}
                  path={path}
                  renderers={renderers}
                  cells={cells}
                />
              ),
            } as any)
        )}
      ></Tabs>
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

export const oneOfTabControlTester: RankedTester = rankWith(
  4,
  and(isOneOfControl, optionIs('variant', 'tab'))
);

export default withJsonFormsOneOfProps(OneOfTabRenderer);
