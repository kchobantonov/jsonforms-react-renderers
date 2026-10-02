import { useContainerValidation } from '@chobantonov/jsonforms-react-renderer-common/validationIndicator';
import { ContainerValidationIndicator } from './ValidationIndicator';
import { resolveCollapsed } from '@chobantonov/jsonforms-react-renderer-common/groupState';
import ArrowDownOutlined from '@ant-design/icons/ArrowDownOutlined';
import ArrowUpOutlined from '@ant-design/icons/ArrowUpOutlined';
import DeleteFilled from '@ant-design/icons/DeleteFilled';
import {
  ArrayLayoutProps,
  ArrayTranslations,
  OwnPropsOfJsonFormsRenderer,
  Resolve,
  composePaths,
  computeLabel,
  createDefaultValue,
  errorsAt,
  findUISchema,
  formatErrorMessage,
  getFirstPrimitiveProp,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  JsonFormsStateContext,
  withJsonFormsContext,
} from '@jsonforms/react';
import {
  Avatar,
  Button,
  Collapse,
  Empty,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import map from 'lodash/map';
import merge from 'lodash/merge';
import range from 'lodash/range';
import React, { ComponentType, useCallback, useMemo, useState } from 'react';
import { useI18n } from '../util/translate';
import { useConfirmation } from '../util/useConfirmation';
import { ArrayLayoutToolbar } from './ArrayToolbar';

/*
  `hideAvatar` hides the *marker*, not the item's identity - "without
  suppressing accessible item identity or validation feedback". So the index
  stays in the accessibility tree when the badge goes; `clip` rather than
  `display: none`, which would take it out of that tree too.
*/
const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

interface ExtraProps {
  rowIndex: number;
  enableUp: boolean;
  enableDown: boolean;
  showSortButtons: boolean;
  disableRemove?: boolean;
}

const ArrayLayoutComponent = (
  props: { ctx: JsonFormsStateContext } & ArrayLayoutProps & {
      translations: ArrayTranslations;
    }
) => {
  /*
    The expanded item is tracked by **index**, not by panel key, because the
    index is what every other operation here speaks: add appends at `data`,
    the sort buttons swap neighbours, and delete shifts everything after it
    down. Keeping a key would mean re-deriving the index on each of those.

    This used to be `useState<string | boolean>(false)` with a curried
    `handleChange(panel)(event, expanded)` that the `Collapse` called as
    `handleChange(value)` - producing the inner function and discarding it. So
    `setExpanded` never ran, the state was permanently `false`, and the
    `Collapse` was left uncontrolled. `collapsed` and `collapseNewItems`
    could not be implemented on top of that, and the only visible symptom was
    an avatar highlight that never appeared.
  */
  const [expandedIndex, setExpandedIndex] = useState<number | undefined>(() => {
    // "False: initially open the first item if present." Initialization only.
    const collapsed = resolveCollapsed(
      props.uischema.options,
      props.config,
      'array'
    );
    return collapsed || props.data === 0 ? undefined : 0;
  });
  const innerCreateDefaultValue = useCallback(
    () => createDefaultValue(props.schema, props.rootSchema),
    [props.schema]
  );
  const {
    arraySchema,
    enabled,
    data,
    path,
    schema,
    uischema,
    errors,
    addItem,
    renderers,
    cells,
    label,
    required,
    rootSchema,
    config,
    uischemas,
    description,
    disableAdd,
    disableRemove,
    translations,
    moveUp,
    moveDown,
    removeItems,
  } = props;

  const t = useI18n();
  const confirmation = useConfirmation();
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const showSortButtons =
    appliedUiSchemaOptions.showSortButtons ||
    appliedUiSchemaOptions.showArrayLayoutSortButtons;

  const hideAvatar = appliedUiSchemaOptions.hideAvatar === true;
  const avatarStyle = useMemo(
    (): React.CSSProperties => ({ marginRight: '10px' }),
    []
  );

  /*
    "True: hide that summary only; retain validation and field/item error
    feedback." The `errors` prop is the array's own errors followed by a
    combined child summary, so hiding the summary means showing only the
    array's own - not showing nothing.
  */
  const ownErrors = useMemo(
    () =>
      formatErrorMessage(
        errorsAt(
          path,
          schema,
          (errorPath: string) => errorPath === path
        )(props.ctx.core?.errors ?? []).map((error) => error.message)
      ),
    [path, schema, props.ctx.core]
  );
  const summaryErrors = appliedUiSchemaOptions.hideArraySummaryValidation
    ? ownErrors
    : errors;

  /*
    Expansion follows the *item*, not the slot. Reordering swaps two
    neighbours, so the open panel has to move with the item the user opened -
    "track the logical item through renderer-owned reorder operations rather
    than transferring expansion to the item now at its old index".
  */
  const trackSwap = useCallback((from: number, to: number) => {
    setExpandedIndex((current) =>
      current === from ? to : current === to ? from : current
    );
  }, []);
  // Deletion shifts every later item down one; the open panel must not end up
  // on a different item, and must close if it was the one removed.
  const trackRemoval = useCallback((removed: number) => {
    setExpandedIndex((current) =>
      current === undefined || current < removed
        ? current
        : current === removed
        ? undefined
        : current - 1
    );
  }, []);
  const handleAddItem = useCallback(
    (p: string, value: any) => () => {
      // Add appends, so the new item's index is the old count.
      const inserted = data;
      addItem(p, value)();
      // "False: open the newly added item. True: leave it closed and preserve
      // existing expansion."
      if (!appliedUiSchemaOptions.collapseNewItems) {
        setExpandedIndex(inserted);
      }
    },
    [addItem, data, appliedUiSchemaOptions.collapseNewItems]
  );

  const getExtra = ({
    rowIndex,
    enableUp,
    enableDown,
    showSortButtons,
    disableRemove,
  }: ExtraProps) => {
    return (
      <>
        {showSortButtons ? (
          <>
            <Tooltip title={translations.up}>
              <Button
                shape='circle'
                aria-label={translations.upAriaLabel}
                icon={<ArrowUpOutlined rev={undefined} />}
                onClick={(event) => {
                  event.stopPropagation();
                  trackSwap(rowIndex, rowIndex - 1);
                  moveUp(path, rowIndex)();
                }}
                disabled={!enabled || !enableUp}
              />
            </Tooltip>
            <Tooltip title={translations.down}>
              <Button
                shape='circle'
                aria-label={translations.downAriaLabel}
                icon={<ArrowDownOutlined rev={undefined} />}
                onClick={(event) => {
                  event.stopPropagation();
                  trackSwap(rowIndex, rowIndex + 1);
                  moveDown(path, rowIndex)();
                }}
                disabled={!enabled || !enableDown}
              />
            </Tooltip>
          </>
        ) : null}
        <Tooltip key='tooltip-remove' title={translations.removeTooltip}>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              // Section 14's `always` fallback: this used to delete silently.
              confirmation.request({
                operation: 'delete',
                catalogId: 'arrayLayout',
                /*
                  `data` here is the item *count*, not the array, so the value
                  being discarded is read from the form's own data at the
                  item's path.
                */
                discarded: [
                  Resolve.data(
                    props.ctx.core.data,
                    composePaths(path, `${rowIndex}`)
                  ),
                ],
                options: uischema?.options,
                config,
                perform: () => {
                  trackRemoval(rowIndex);
                  removeItems(path, [rowIndex])();
                },
              });
            }}
            shape='circle'
            disabled={!enabled || disableRemove}
            icon={<DeleteFilled rev={undefined} />}
            aria-label={translations.removeAriaLabel}
          />
        </Tooltip>
      </>
    );
  };

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

  const doDisableAdd =
    disableAdd ||
    appliedUiSchemaOptions.disableAdd ||
    (appliedUiSchemaOptions.restrict &&
      arraySchema !== undefined &&
      arraySchema.maxItems !== undefined &&
      data >= arraySchema.maxItems);

  const doDisableRemove =
    disableRemove ||
    appliedUiSchemaOptions.disableRemove ||
    (appliedUiSchemaOptions.restrict &&
      arraySchema !== undefined &&
      arraySchema.minItems !== undefined &&
      data <= arraySchema.minItems);

  const childLabelForIndex = (childPath: string, index: number) => {
    const childLabelProp =
      uischema.options?.elementLabelProp ??
      uischema.options?.childLabelProp ??
      getFirstPrimitiveProp(schema);
    if (!childLabelProp) {
      return `${index}`;
    }
    const labelValue = Resolve.data(
      props.ctx.core.data,
      composePaths(childPath, childLabelProp)
    );
    if (
      labelValue === undefined ||
      labelValue === null ||
      Number.isNaN(labelValue)
    ) {
      return '';
    }
    return `${labelValue}`;
  };

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
        addItem={handleAddItem}
        createDefault={innerCreateDefaultValue}
        disableAdd={doDisableAdd}
      >
        {data > 0 ? (
          <Collapse
            accordion
            expandIconPlacement='end'
            activeKey={
              expandedIndex === undefined ? [] : [String(expandedIndex)]
            }
            onChange={(value) => {
              // `accordion` gives at most one key back, and an empty list when
              // the open panel is closed.
              const key = Array.isArray(value) ? value[0] : value;
              setExpandedIndex(key === undefined ? undefined : Number(key));
            }}
            items={map(range(data), (index) => {
              const childPath = composePaths(path, `${index}`);

              const text = childLabelForIndex(childPath, index);

              return {
                key: String(index),
                label: (
                  <>
                    {/*
                      "True: hide that marker, without suppressing accessible
                      item identity." With the marker gone the header still has
                      to say which item it is, so the index moves onto the
                      header's own accessible name.
                    */}
                    {hideAvatar ? (
                      <span style={SR_ONLY}>
                        {t('array.indexLabel')} {index + 1}
                      </span>
                    ) : (
                      <Avatar
                        aria-label={t('array.indexLabel')}
                        style={avatarStyle}
                      >
                        {index + 1}
                      </Avatar>
                    )}
                    <Space
                      size='small'
                      align='center'
                      style={{ verticalAlign: 'middle' }}
                    >
                      {text ? <Typography.Text>{text}</Typography.Text> : null}
                      <ItemValidationIndicator
                        path={childPath}
                        options={props.uischema.options}
                        config={props.config}
                      />
                    </Space>
                  </>
                ),
                extra: (
                  <Space>
                    {getExtra({
                      rowIndex: index,
                      enableUp: index !== 0,
                      enableDown: index !== props.data - 1,
                      showSortButtons: showSortButtons,
                      disableRemove: doDisableRemove,
                    })}
                  </Space>
                ),
                children: (
                  <JsonFormsDispatch
                    schema={schema}
                    uischema={foundUISchema}
                    path={childPath}
                    key={childPath}
                    renderers={renderers}
                    cells={cells}
                  />
                ),
              };
            })}
          ></Collapse>
        ) : (
          <Empty description={translations.noDataMessage} />
        )}
      </ArrayLayoutToolbar>
    </>
  );
};

export const withContextToJsonFormsRendererProps = (
  Component: ComponentType<ArrayLayoutProps>
): ComponentType<OwnPropsOfJsonFormsRenderer> =>
  function WithContextToJsonFormsRendererProps({
    ctx,
    props,
  }: JsonFormsStateContext & ArrayLayoutProps) {
    return <Component {...props} ctx={ctx} />;
  };

export const ArrayLayout = React.memo(
  withJsonFormsContext(
    withContextToJsonFormsRendererProps(ArrayLayoutComponent)
  )
);

const ItemValidationIndicator = ({
  path,
  options,
  config,
}: {
  path: string;
  options?: Record<string, any>;
  config?: Record<string, any>;
}) => {
  const indicator = useContainerValidation(
    { type: 'Control', scope: '#', options } as any,
    path,
    config,
    false
  );
  return indicator.show ? (
    <ContainerValidationIndicator count={indicator.count} />
  ) : null;
};
