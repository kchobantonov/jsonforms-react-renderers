import {
  and,
  ArrayLayoutProps,
  ArrayTranslations,
  composePaths,
  Resolve,
  computeLabel,
  createDefaultValue,
  deriveTypes,
  errorsAt,
  findUISchema,
  formatErrorMessage,
  RankedTester,
  rankWith,
  schemaTypeIs,
  uiTypeIs,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  withArrayTranslationProps,
  withJsonFormsArrayLayoutProps,
  withTranslateProps,
  useJsonForms,
} from '@jsonforms/react';
import { Empty, Listy, Splitter } from 'antd';

import range from 'lodash/range';
import React, { useCallback, useMemo, useState } from 'react';
import { useConfirmation } from '../util/useConfirmation';
import { ArrayLayoutRenderer } from '../layouts/ArrayLayoutRenderer';
import { ArrayLayoutToolbar } from '../layouts/ArrayToolbar';
import ListWithDetailMasterItem from './ListWithDetailMasterItem';
import merge from 'lodash/merge';

export const ListWithDetailRenderer = (
  props: ArrayLayoutProps & { translations: ArrayTranslations }
) => {
  const {
    uischemas,
    schema,
    uischema,
    path,
    enabled,
    errors,
    visible,
    label,
    required,
    removeItems,
    addItem,
    data,
    renderers,
    cells,
    config,
    rootSchema,
    description,
    disableAdd,
    disableRemove,
    translations,
  } = props;
  const [selectedIndex, setSelectedIndex] = useState(undefined);
  const confirmation = useConfirmation();
  const ctx = useJsonForms();
  const handleRemoveItem = useCallback(
    (p: string, value: any) => () => {
      const remove = () => {
        removeItems(p, [value])();
        if (selectedIndex === value) {
          setSelectedIndex(undefined);
        } else if (selectedIndex > value) {
          setSelectedIndex(selectedIndex - 1);
        }
      };
      // Section 14's `always` fallback: this used to remove silently.
      confirmation.request({
        operation: 'delete',
        catalogId: 'listWithDetail',
        /*
          `data` on an array layout is the item **count**, not the array, so
          the item has to be read from the form's own data. Reading it from
          `data` yielded `undefined`, and a policy told nothing is being
          discarded does not prompt.
        */
        discarded: [Resolve.data(ctx.core?.data, composePaths(p, `${value}`))],
        options: props.uischema?.options as Record<string, unknown> | undefined,
        config,
        perform: remove,
      });
    },
    [
      confirmation,
      config,
      ctx.core?.data,
      props.uischema,
      removeItems,
      selectedIndex,
    ]
  );
  const handleListItemClick = useCallback(
    (index: number) => () => setSelectedIndex(index),
    [setSelectedIndex]
  );
  const handleCreateDefaultValue = useCallback(
    () => createDefaultValue(schema, rootSchema),
    [createDefaultValue]
  );
  const foundUISchema = useMemo(
    () =>
      findUISchema(
        uischemas,
        schema,
        uischema.scope,
        path,
        undefined,
        uischema,
        rootSchema
      ),
    [uischemas, schema, uischema.scope, path, uischema, rootSchema]
  );
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  /*
    `errors` on an array control is the control's own errors followed by a
    combined child summary; hiding the summary shows only the former.
  */
  const ownErrors = formatErrorMessage(
    errorsAt(
      path,
      schema,
      (errorPath: string) => errorPath === path
    )(ctx.core?.errors ?? []).map((error) => error.message)
  );
  const summaryErrors = appliedUiSchemaOptions.hideArraySummaryValidation
    ? ownErrors
    : errors;
  const doDisableAdd = disableAdd || appliedUiSchemaOptions.disableAdd;
  const doDisableRemove = disableRemove || appliedUiSchemaOptions.disableRemove;

  React.useEffect(() => {
    setSelectedIndex(undefined);
  }, [schema]);

  if (!visible) {
    return null;
  }

  // Primitive list-with-detail examples use the same accordion presentation
  // as other primitive arrays. Object arrays retain the master/detail layout.
  // Object items may infer their type from properties or use allOf/$ref,
  // as in Huge Test. Only known non-object items use the accordion fallback.
  const itemTypes = deriveTypes(schema);
  if (itemTypes.length > 0 && !itemTypes.includes('object')) {
    return <ArrayLayoutRenderer {...props} />;
  }

  return (
    <>
      {confirmation.dialog}
      <ArrayLayoutToolbar
        options={uischema.options}
        config={config}
        translations={translations}
        label={computeLabel(
          label,
          required,
          appliedUiSchemaOptions.hideRequiredAsterisk
        )}
        description={description}
        errors={summaryErrors}
        path={path}
        enabled={enabled}
        addItem={addItem}
        createDefault={handleCreateDefaultValue}
        disableAdd={doDisableAdd}
      >
        <Splitter orientation='horizontal'>
          <Splitter.Panel defaultSize='25%' min='15%' max='60%'>
            <div style={{ maxHeight: '20rem', overflowY: 'auto', overscrollBehaviorY: 'contain' }}>
            {data > 0 ? (
              <Listy
                items={range(data)}
                rowKey={(index) => index}
                styles={{ item: { padding: 0 } }}
                itemRender={(index) => (
                  <ListWithDetailMasterItem
                    index={index}
                    path={path}
                    schema={schema}
                    enabled={enabled}
                    handleSelect={handleListItemClick}
                    removeItem={handleRemoveItem}
                    selected={selectedIndex === index}
                    key={index}
                    uischema={foundUISchema}
                    childLabelProp={appliedUiSchemaOptions.elementLabelProp}
                    translations={translations}
                    disableRemove={doDisableRemove}
                    hideAvatar={appliedUiSchemaOptions.hideAvatar === true}
                  />
                )}
              />
            ) : (
              <Empty description={translations.noDataMessage} />
            )}
            </div>
          </Splitter.Panel>
          <Splitter.Panel min='25%'>
            <div style={{ minWidth: 0, paddingInlineStart: 12 }}>
              {selectedIndex !== undefined ? (
                <JsonFormsDispatch
                  renderers={renderers}
                  cells={cells}
                  visible={visible}
                  schema={schema}
                  uischema={foundUISchema}
                  path={composePaths(path, `${selectedIndex}`)}
                />
              ) : (
                <Empty description={translations.noSelection} />
              )}
            </div>
          </Splitter.Panel>
        </Splitter>
      </ArrayLayoutToolbar>
    </>
  );
};

export const listWithDetailTester: RankedTester = rankWith(
  4,
  and(uiTypeIs('ListWithDetail'), schemaTypeIs('array'))
);

export default withJsonFormsArrayLayoutProps(
  withTranslateProps(withArrayTranslationProps(ListWithDetailRenderer))
);
