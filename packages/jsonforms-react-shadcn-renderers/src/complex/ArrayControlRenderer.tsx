import { resolveCollapsed } from '@chobantonov/jsonforms-react-renderer-common/layout/groupState';
import { ArrayPanelToggle } from './ArrayPanelToggle';
import { findDetailUISchema as findUISchema } from '@chobantonov/jsonforms-react-renderer-common/core/detailUiSchema';
import { usePathErrorIndicator } from '@chobantonov/jsonforms-react-renderer-common/validation/errorSummary';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@jsonforms-react-shadcn-ui/tooltip';
import { ErrorIndicator } from './ErrorIndicator';
import { useColumnWidths } from '@chobantonov/jsonforms-react-renderer-common/collections/columnResize';
import { useTableSelection } from '@chobantonov/jsonforms-react-renderer-common/collections/useTableSelection';
import { PendingChangesProvider } from '@chobantonov/jsonforms-react-renderer-common/interaction/pendingChanges';
import { useCollectionPagination } from '@chobantonov/jsonforms-react-renderer-common/collections/collectionPagination';
import { useRowDetail } from '@chobantonov/jsonforms-react-renderer-common/collections/rowDetail';
import { CollectionPager } from './CollectionPager';
import { RowDetailToggle } from './RowDetailFrame';
import { useArrayPanelState } from '@chobantonov/jsonforms-react-renderer-common/collections/useArrayPanelState';
import {
  and,
  ArrayLayoutProps,
  JsonSchema,
  composePaths,
  createControlElement,
  createDefaultValue,
  getFirstPrimitiveProp,
  isObjectArrayWithNesting,
  schemaTypeIs,
  or,
  uiTypeIs,
  RankedTester,
  rankWith,
  Resolve,
} from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { shouldConfirm } from '@chobantonov/jsonforms-react-renderer-common/interaction/confirmation';
import { DeleteDialog } from './DeleteDialog';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { ArrayTable } from './array/ArrayTable';
import { ArrayItemPanels } from './array/ArrayItemPanels';
import { ArrayListDetail } from './array/ArrayListDetail';

function usesDefaultDetail(detail: unknown) {
  return (
    !detail ||
    (typeof detail === 'string' && detail.toUpperCase() === 'DEFAULT')
  );
}

function supportsDefaultTable(
  { arraySchema, rootSchema, config }: ArrayLayoutProps,
  schema: JsonSchema,
) {
  const nestedItems = isObjectArrayWithNesting(
    createControlElement('#'),
    arraySchema ?? ({ type: 'array', items: schema } as JsonSchema),
    { rootSchema, config },
  );
  if (nestedItems) return false;
  return (
    Boolean(schema.properties) ||
    ['string', 'number', 'integer', 'boolean', 'null'].includes(
      schema.type as string,
    )
  );
}

function arrayPresentation(
  props: ArrayLayoutProps,
  schema: JsonSchema,
  options: NonNullable<ArrayLayoutProps['uischema']['options']>,
): 'list' | 'table' | 'panels' {
  if (String(props.uischema.type) === 'ListWithDetail') return 'list';
  if (options.table === true || options.format === 'table') return 'table';
  if (options.table === false || !usesDefaultDetail(options.detail))
    return 'panels';
  return supportsDefaultTable(props, schema) ? 'table' : 'panels';
}

export const ShadcnArrayRenderer = (props: ArrayLayoutProps) => {
  const {
    addItem,
    moveUp,
    moveDown,
    cells,
    config,
    readonly,
    data,
    enabled,
    label,
    required,
    path,
    removeItems,
    renderers,
    rootSchema,
    schema = {},
    arraySchema,
    uischema,
    visible,
  } = props;
  const ctx = useJsonForms();
  const options = { ...config, ...uischema.options };
  const arrayErrors = usePathErrorIndicator(
    path,
    uischema.options,
    !options.hideArraySummaryValidation,
  );
  const [expandedIndex, setExpandedIndex] = React.useState<number | undefined>(
    () =>
      data > 0 && !resolveCollapsed(uischema.options, config, 'array')
        ? 0
        : undefined,
  );
  const removeItem = (index: number) => {
    setExpandedIndex((current) =>
      current === undefined || current < index
        ? current
        : current === index
          ? undefined
          : current - 1,
    );
    removeItems?.(path, [index])();
  };
  const moveItem = (index: number, direction: -1 | 1) => {
    if (!enabled || readonly) return;
    const target = index + direction;
    if (target < 0 || target >= data) return;
    setExpandedIndex((current) =>
      current === index ? target : current === target ? index : current,
    );
    (direction === -1 ? moveUp : moveDown)?.(path, index)();
  };
  const translate = (key: string, fallback: string) =>
    ctx.i18n?.translate?.(key, fallback) ?? fallback;
  const translations = {
    addAriaLabel: translate('array.addAriaLabel', 'Add'),
    addTooltip: translate('array.addTooltip', 'Add item'),
    removeAriaLabel: translate('array.removeAriaLabel', 'Remove'),
    removeTooltip: translate('array.removeTooltip', 'Remove item'),
    upAriaLabel: translate('array.upAriaLabel', 'Move up') || 'Move up',
    up: translate('array.up', 'Move up') || 'Move up',
    downAriaLabel: translate('array.downAriaLabel', 'Move down') || 'Move down',
    down: translate('array.down', 'Move down') || 'Move down',
  };
  const selection = useTableSelection({
    path,
    schema,
    uischema,
    config,
    enabled,
    readonly,
    removeItems,
  });
  const columnSizes = useColumnWidths();
  const [selectedItem, setSelectedItem] = React.useState(0);
  const [pendingIndex, setPendingIndex] = React.useState<number>();
  const panel = useArrayPanelState(uischema.options, config);
  const canAdd =
    enabled &&
    !readonly &&
    !options.disableAdd &&
    !(
      options.restrict &&
      arraySchema.maxItems !== undefined &&
      data >= arraySchema.maxItems
    );
  const canRemove =
    !!removeItems &&
    enabled &&
    !readonly &&
    !options.disableRemove &&
    !(
      options.restrict &&
      arraySchema.minItems !== undefined &&
      data <= arraySchema.minItems
    );
  const requestRemove = (index: number) => {
    if (!canRemove) return;
    const value = Resolve.data(
      ctx.core?.data,
      composePaths(path, String(index)),
    );
    if (
      shouldConfirm(
        {
          options: uischema.options,
          config,
          catalogId: 'arrayLayout',
          operation: 'delete',
        },
        [value],
      )
    )
      setPendingIndex(index);
    else removeItem(index);
  };
  const detail = React.useMemo(
    () =>
      findUISchema(
        ctx.uischemas ?? [],
        schema,
        uischema.scope,
        path,
        // `items: true` resolves to a boolean schema; its generated layout is empty.
        typeof schema === 'boolean' && schema
          ? () => createControlElement('#')
          : undefined,
        uischema,
        rootSchema,
      ),
    [ctx.uischemas, schema, uischema, path, rootSchema],
  );
  const childLabelProp =
    uischema.options?.elementLabelProp ?? getFirstPrimitiveProp(schema);

  const presentation = arrayPresentation(props, schema, options);
  const table = presentation === 'table';
  const page = useCollectionPagination(
    Array.from({ length: data }, (_, i) => i),
    uischema.options?.pagination,
    config,
    'array',
    table,
  );
  const rowDetail = useRowDetail({
    schema,
    rootSchema,
    uischema,
    config,
    path,
    enabled,
    readonly,
    renderers,
    cells,
  });
  if (!visible) return null;
  const childLabelForIndex = (childPath: string, index: number) => {
    if (!childLabelProp) {
      return `${index}`;
    }
    const labelValue = Resolve.data(
      ctx.core?.data,
      composePaths(childPath, childLabelProp),
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

  const itemView = {
    schema,
    path,
    renderers,
    cells,
    enabled,
    detail,
    indices: page.indices,
    hideAvatar: Boolean(options.hideAvatar),
    canRemove,
    requestRemove,
    childLabelForIndex,
    removeLabel: translations.removeAriaLabel,
    removeTooltip: translations.removeTooltip,
  };
  return (
    <PendingChangesProvider changes={page.pending}>
      <div className='shadcn-jsonforms-array'>
        <div className='shadcn-jsonforms-array-header'>
          <div className='flex items-center gap-2'>
            <h3>
              {label}
              {required && !options.hideRequiredAsterisk && (
                <span aria-hidden='true'> *</span>
              )}
            </h3>
            {arrayErrors && (
              <ErrorIndicator
                local
                errors={arrayErrors}
                className='shadcn-jsonforms-array-errors'
              />
            )}
          </div>
          <div className='shadcn-jsonforms-array-actions'>
            <RowDetailToggle state={rowDetail} />
            {table && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type='button'
                      size='icon-sm'
                      variant='destructive'
                      aria-label={rowDetail.t('collection.deleteSelected')}
                      disabled={!selection.canDelete}
                      onClick={selection.request}
                    >
                      <Trash2 aria-hidden='true' className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {rowDetail.t('collection.deleteSelected')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              type='button'
              size='icon-sm'
              aria-label={translations?.addAriaLabel || 'Add'}
              title={translations?.addTooltip || 'Add item'}
              disabled={!canAdd}
              onClick={() => {
                if (!canAdd) return;
                if (!options.collapseNewItems) setExpandedIndex(data);
                addItem(path, createDefaultValue(schema, rootSchema))();
              }}
            >
              <Plus className='h-4 w-4' aria-hidden='true' />
            </Button>
            <ArrayPanelToggle panel={panel} label={label} />
          </div>
        </div>
        <div id={panel.contentId} hidden={panel.collapsed}>
          {presentation === 'list' ? (
            <ArrayListDetail
              {...itemView}
              count={data}
              label={label}
              readonly={readonly}
              selectedItem={selectedItem}
              onSelect={setSelectedItem}
              emptyMessage={() => translate('array.noDataMessage', 'No data')}
            />
          ) : table ? (
            <ArrayTable
              {...props}
              schema={schema}
              options={options}
              rowDetail={rowDetail}
              page={page}
              selection={selection}
              columnSizes={columnSizes}
              translations={translations}
            />
          ) : (
            <ArrayItemPanels
              {...itemView}
              config={config}
              uischema={uischema}
              expandedIndex={expandedIndex}
              onExpand={setExpandedIndex}
              onMove={moveItem}
              canMove={enabled && !readonly}
              count={data}
              translations={translations}
            />
          )}
          {!table && <CollectionPager page={page} />}
        </div>
        <DeleteDialog
          open={selection.confirming}
          onCancel={selection.cancel}
          onConfirm={selection.confirm}
        />
        <DeleteDialog
          open={pendingIndex !== undefined}
          onCancel={() => setPendingIndex(undefined)}
          onConfirm={() => {
            if (canRemove && pendingIndex !== undefined && pendingIndex < data)
              removeItem(pendingIndex);
            setPendingIndex(undefined);
          }}
        />
      </div>
    </PendingChangesProvider>
  );
};

export const arrayControlTester: RankedTester = rankWith(
  3,
  and(
    or(uiTypeIs('Control'), uiTypeIs('ListWithDetail')),
    schemaTypeIs('array'),
  ),
);
