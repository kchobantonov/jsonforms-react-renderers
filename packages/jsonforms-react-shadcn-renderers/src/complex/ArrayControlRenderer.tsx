import { ColumnResizeHandle, useColumnWidths } from '@chobantonov/jsonforms-react-renderer-common/columnResize';
import { tableColumnFields, tableColumnStyle, TableColumnDefinition } from '@chobantonov/jsonforms-react-renderer-common/tableColumns';
import { useTableSelection } from '@chobantonov/jsonforms-react-renderer-common/tableSelection';
import { Checkbox } from '@jsonforms-react-shadcn-ui/checkbox';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@jsonforms-react-shadcn-ui/resizable';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@jsonforms-react-shadcn-ui/tooltip';
import {
  ErrorSummaryList,
  useErrorSummary,
} from '@chobantonov/jsonforms-react-renderer-common/errorSummary';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@jsonforms-react-shadcn-ui/popover';
import { PendingChangesProvider } from '@chobantonov/jsonforms-react-renderer-common/pendingChanges';
import { useCollectionPagination } from '@chobantonov/jsonforms-react-renderer-common/collectionPagination';
import { useRowDetail } from '@chobantonov/jsonforms-react-renderer-common/rowDetail';
import { CollectionPager } from './CollectionPager';
import { RowDetailFrame, RowDetailToggle } from './RowDetailFrame';
import { useArrayPanelState } from '@chobantonov/jsonforms-react-renderer-common/arrayPanelState';
import {
  and,
  ArrayLayoutProps,
  CellProps,
  composePaths,
  createDefaultValue,
  createCleanLabel,
  Generate,
  getFirstPrimitiveProp,
  schemaTypeIs,
  or,
  uiTypeIs,
  RankedTester,
  rankWith,
  Resolve,
} from '@jsonforms/core';
import {
  DispatchCell,
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsCellProps,
} from '@jsonforms/react';
import React from 'react';
import {
  Check,
  Pencil,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CircleAlert,
} from 'lucide-react';
import { shouldConfirm } from '@chobantonov/jsonforms-react-renderer-common/confirmation';
import { DeleteDialog } from './DeleteDialog';
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemActions,
} from '@jsonforms-react-shadcn-ui/item';
import { Avatar, AvatarFallback } from '@jsonforms-react-shadcn-ui/avatar';
import { Button } from '@jsonforms-react-shadcn-ui/button';

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@jsonforms-react-shadcn-ui/collapsible';

const ArrayItemPanel = ({
  label,
  index,
  initiallyOpen,
  hideAvatar,
  actions,
  children,
}: React.PropsWithChildren<{
  label: string;
  index: number;
  initiallyOpen: boolean;
  hideAvatar: boolean;
  actions: React.ReactNode;
}>) => {
  const [open, setOpen] = React.useState(initiallyOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className='shadcn-jsonforms-array-item'
    >
      <div className='relative flex items-center'>
        <CollapsibleTrigger
          render={<Button type='button' variant='ghost' />}
          className='h-auto min-w-0 flex-1 justify-start gap-3 whitespace-normal text-left'
          aria-label={label || String(index + 1)}
        >
          {!hideAvatar && (
            <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground'>
              {index + 1}
            </span>
          )}
          <span className='min-w-0 flex-1 pr-10'>{label}</span>
          {open ? (
            <ChevronUp aria-hidden='true' />
          ) : (
            <ChevronDown aria-hidden='true' />
          )}
        </CollapsibleTrigger>
        <div className='absolute right-10 flex items-center gap-1'>
          {actions}
        </div>
      </div>
      <CollapsibleContent keepMounted hidden={!open} className='px-3 pb-3'>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const ErrorIndicator = ({
  errors,
  className,
  path,
}: {
  errors: string;
  className?: string;
  path?: string;
}) => {
  const entries = useErrorSummary(errors, path);
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  const trigger = React.useRef<HTMLButtonElement>(null);
  const content = React.useRef<HTMLDivElement>(null);
  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const show = () => {
    cancelClose();
    setOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    timer.current = setTimeout(() => {
      if (
        trigger.current !== document.activeElement &&
        !content.current?.contains(document.activeElement)
      )
        setOpen(false);
    }, 200);
  };
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  if (entries.length <= 1)
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              className={`h-6 w-6 shrink-0 p-0 text-destructive ${
                className ?? ''
              }`}
              aria-label={errors}
            >
              <CircleAlert className='h-4 w-4' aria-hidden='true' />
            </Button>
          </TooltipTrigger>
          <TooltipContent className='max-w-sm whitespace-pre-line'>
            {errors}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          ref={trigger}
          onPointerEnter={show}
          onPointerLeave={scheduleClose}
          onFocus={show}
          onBlur={scheduleClose}
          onClick={(event) => {
            event.preventDefault();
            show();
          }}
          className={`h-6 w-6 shrink-0 p-0 text-destructive ${className ?? ''}`}
          aria-label={errors}
        >
          <CircleAlert className='h-4 w-4' aria-hidden='true' />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className='w-auto'
        align='start'
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
        onFocusCapture={cancelClose}
        onBlurCapture={scheduleClose}
      >
        <div ref={content}>
          <ErrorSummaryList
            entries={entries}
            renderToggle={(label, toggle, expanded) => (
              <Button
                type='button'
                variant='link'
                onClick={toggle}
                aria-expanded={expanded}
              >
                {label}
              </Button>
            )}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
const TableCellErrors = withJsonFormsCellProps(({ errors, path }: CellProps) =>
  errors ? (
    <ErrorIndicator
      errors={errors}
      path={path}
      className='shadcn-jsonforms-cell-error'
    />
  ) : null
);

export const ShadcnArrayRenderer = ({
  addItem,
  cells,
  config,
  readonly,
  data,
  enabled,
  errors,
  label,
  required,
  path,
  removeItems,
  moveUp,
  moveDown,
  renderers,
  rootSchema,
  schema = {},
  arraySchema,
  uischema,
  visible,
}: ArrayLayoutProps) => {
  const ctx = useJsonForms();
  const translate = (key: string, fallback: string) =>
    ctx.i18n?.translate?.(key, fallback) ?? fallback;
  const translations = {
    addAriaLabel: translate('array.addAriaLabel', 'Add'),
    addTooltip: translate('array.addTooltip', 'Add item'),
    removeAriaLabel: translate('array.removeAriaLabel', 'Remove'),
    removeTooltip: translate('array.removeTooltip', 'Remove item'),
    upAriaLabel: translate('array.upAriaLabel', 'Move up'),
    up: translate('array.up', 'Move up'),
    downAriaLabel: translate('array.downAriaLabel', 'Move down'),
    down: translate('array.down', 'Move down'),
  };
  const selection = useTableSelection({ path, schema, uischema, config, enabled, readonly, removeItems });
  const [columnWidths, setColumnWidths] = useColumnWidths();
  const [selectedItem, setSelectedItem] = React.useState(0);
  const [pendingIndex, setPendingIndex] = React.useState<number>();
  const options = { ...config, ...uischema.options };
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
      ctx.core.data,
      composePaths(path, String(index))
    );
    if (
      shouldConfirm(
        {
          options: uischema.options,
          config,
          catalogId: 'arrayLayout',
          operation: 'delete',
        },
        [value]
      )
    )
      setPendingIndex(index);
    else removeItems(path, [index])();
  };
  const detail =
    (uischema.options?.detail as any) ??
    Generate.uiSchema(schema, 'VerticalLayout', undefined, rootSchema);
  const childLabelProp =
    uischema.options?.elementLabelProp ??
    uischema.options?.childLabelProp ??
    (typeof options.labelRef === 'string'
      ? options.labelRef
          .split('/properties/')
          .slice(1)
          .map((part: string) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
          .join('.') || undefined
      : undefined) ??
    getFirstPrimitiveProp(schema);

  const listWithDetail = (uischema.type as string) === 'ListWithDetail';
  const table =
    !listWithDetail &&
    (options.table === true ||
      options.format === 'table' ||
      (options.table !== false &&
        !options.detail &&
        (Boolean(schema.properties) ||
          ['string', 'number', 'integer', 'boolean', 'null'].includes(
            schema.type as string
          ))));
  const page = useCollectionPagination(
    Array.from({ length: data }, (_, i) => i),
    uischema.options?.pagination,
    config,
    'array',
    table
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
  const definitions = uischema.options?.columnDefs as TableColumnDefinition[] | undefined;
  const properties = schema.properties ?? { value: schema };
  const columns = tableColumnFields(properties, schema.properties ? definitions : undefined, Object.keys(properties)).map((field) => [field, properties[field]] as const).map(
    ([field, column]) =>
      [
        field,
        column.$ref ? Resolve.schema(column, '#', rootSchema) : column,
      ] as const
  );
  const objectRows = Boolean(schema.properties);
  const childLabelForIndex = (childPath: string, index: number) => {
    if (!childLabelProp) {
      return `${index}`;
    }
    const labelValue = Resolve.data(
      ctx.core.data,
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
    <PendingChangesProvider changes={page.pending}>
      <div className='shadcn-jsonforms-array'>
        <div className='shadcn-jsonforms-array-header'>
          <div className='flex items-center gap-2'>
            <h3>
              {label}
              {required && <span aria-hidden='true'> *</span>}
            </h3>
            {errors && (
              <ErrorIndicator
                errors={errors}
                path={path}
                className='shadcn-jsonforms-array-errors'
              />
            )}
          </div>
          <div className='shadcn-jsonforms-array-actions'>
            <RowDetailToggle state={rowDetail} />
            {table && <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <Button type='button' size='icon-sm' variant='destructive'
                aria-label={rowDetail.t('collection.deleteSelected')}
                disabled={!selection.canDelete} onClick={selection.request}>
                <Trash2 aria-hidden='true' className='h-4 w-4' />
              </Button>
            </TooltipTrigger><TooltipContent>{rowDetail.t('collection.deleteSelected')}</TooltipContent></Tooltip></TooltipProvider>}
            <Button
              type='button'
              size='icon-sm'
              aria-label={translations?.addAriaLabel || 'Add'}
              title={translations?.addTooltip || 'Add item'}
              disabled={!canAdd}
              onClick={addItem(path, createDefaultValue(schema, rootSchema))}
            >
              <Plus className='h-4 w-4' aria-hidden='true' />
            </Button>
            {panel.collapsible && (
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label={label || 'Array'}
                aria-expanded={!panel.collapsed}
                aria-controls={panel.contentId}
                onClick={panel.toggle}
              >
                {panel.collapsed ? (
                  <ChevronDown aria-hidden='true' />
                ) : (
                  <ChevronUp aria-hidden='true' />
                )}
              </Button>
            )}
          </div>
        </div>
        <div id={panel.contentId} hidden={panel.collapsed}>
          {listWithDetail ? (
            data === 0 ? (
              <div className='py-6 text-center text-muted-foreground'>
                {translate('array.noDataMessage', 'No data')}
              </div>
            ) : (
              <ResizablePanelGroup
                orientation='horizontal'
                style={{ height: 'auto' }}
              >
                <ResizablePanel defaultSize='25%' minSize='15%' maxSize='60%'>
                  <ItemGroup
                    className='min-w-0 rounded-lg border p-1'
                    aria-label={label}
                  >
                    {page.indices.map((index) => {
                      const selected = Math.min(selectedItem, data - 1) === index;
                      const itemLabel = childLabelForIndex(
                        composePaths(path, String(index)),
                        index
                      );
                      return (
                        <Item
                          key={index}
                          role='listitem'
                          size='sm'
                          variant={selected ? 'muted' : 'default'}
                          className='flex-nowrap gap-1 p-1'
                        >
                          <ItemContent className='min-w-0'>
                            <Button
                              type='button'
                              variant='ghost'
                              className='h-auto min-h-12 w-full min-w-0 justify-start gap-3 whitespace-nowrap text-left'
                              aria-pressed={selected}
                              aria-label={itemLabel || String(index + 1)}
                              onClick={() => setSelectedItem(index)}
                            >
                              {!options.hideAvatar && (
                                <Avatar className='border'>
                                  <AvatarFallback>{index + 1}</AvatarFallback>
                                </Avatar>
                              )}
                              <span className='min-w-0 flex-1 truncate'>
                                {itemLabel}
                              </span>
                              {selected && (
                                <Check
                                  className='h-4 w-4 shrink-0'
                                  aria-hidden='true'
                                />
                              )}
                            </Button>
                          </ItemContent>
                          <ItemActions>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='h-6 w-6 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive'
                              aria-label={translations.removeAriaLabel}
                              title={translations.removeTooltip}
                              disabled={!canRemove}
                              onClick={() => requestRemove(index)}
                            >
                              <Trash2 className='h-3 w-3' aria-hidden='true' />
                            </Button>
                          </ItemActions>
                        </Item>
                      );
                    })}
                  </ItemGroup>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel minSize='25%'>
                  <div className='min-w-0 space-y-3 ps-3' role='tabpanel'>
                    <JsonFormsDispatch
                      schema={schema}
                      uischema={detail}
                      path={composePaths(
                        path,
                        String(Math.min(selectedItem, data - 1))
                      )}
                      enabled={enabled && !readonly}
                      renderers={renderers}
                      cells={cells}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )
          ) : table ? (
            <RowDetailFrame state={rowDetail}>
              <div className='min-w-0 max-w-full overflow-x-auto'>
                <table className='w-full text-sm' aria-label={label}>
                  {objectRows && (
                    <thead>
                      <tr className='border-b'>
                        <th className='p-2'>
                          <Checkbox aria-label={rowDetail.t('collection.selectPage')}
                            disabled={!selection.selectable || !page.indices.length}
                            checked={page.indices.length > 0 && page.indices.every((i) => selection.selected.includes(i)) ? true : page.indices.some((i) => selection.selected.includes(i)) ? 'indeterminate' : false}
                            onCheckedChange={(checked) => selection.setSelected(checked === true ? [...new Set([...selection.selected, ...page.indices])] : selection.selected.filter((i) => !page.indices.includes(i)))} />
                        </th>
                        {columns.map(([field, column]) => (
                          <th key={field} style={{ ...tableColumnStyle(definitions?.find((column) => column.field === field)), ...(columnWidths[field] !== undefined ? { width: columnWidths[field], minWidth: columnWidths[field], maxWidth: columnWidths[field] } : {}) }} className='relative p-2 pe-4 text-left font-medium'>
                            {column.title ?? createCleanLabel(field)}
                            <ColumnResizeHandle field={column.title ?? createCleanLabel(field)} definition={definitions?.find((item) => item.field === field)} width={columnWidths[field]}
                              onResize={(value) => setColumnWidths((current) => ({ ...current, [field]: value }))} />
                          </th>
                        ))}
                        <th className='p-2' />
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {page.indices.map((index) => {
                      const rowPath = composePaths(path, String(index));
                      return (
                        <tr
                          key={rowPath}
                          className={rowDetail.options?.presentation === 'panel' && rowDetail.panelOpen && rowDetail.selection?.index === index ? 'border-b bg-accent' : 'border-b'}
                          aria-current={rowDetail.options?.presentation === 'panel' && rowDetail.panelOpen && rowDetail.selection?.index === index ? true : undefined}
                          onClick={() => {
                            if (rowDetail.options?.presentation === 'panel') {
                              rowDetail.open(index);
                            }
                          }}
                        >
                          <td className='p-2' onClick={(event) => event.stopPropagation()}>
                            <Checkbox aria-label={rowDetail.t('collection.selectRow', { index: index + 1 })}
                              disabled={!selection.selectable} checked={selection.selected.includes(index)}
                              onCheckedChange={(checked) => selection.setSelected(checked === true ? [...selection.selected, index] : selection.selected.filter((i) => i !== index))} />
                          </td>
                          {columns.map(([field, column]) => (
                            <td
                              key={field}
                              style={{ ...tableColumnStyle(definitions?.find((column) => column.field === field)), ...(columnWidths[field] !== undefined ? { width: columnWidths[field], minWidth: columnWidths[field], maxWidth: columnWidths[field] } : {}) }}
                              className='shadcn-jsonforms-table-cell p-2'
                            >
                              <div style={{ maxWidth: tableColumnStyle(definitions?.find((column) => column.field === field)).maxWidth, overflow: 'hidden' }}>
                              <DispatchCell
                                schema={column}
                                uischema={{
                                  type: 'Control',
                                  scope: objectRows
                                    ? '#/properties/' + field
                                    : '#',
                                  options: options.cells?.[field],
                                }}
                                path={
                                  objectRows
                                    ? composePaths(rowPath, field)
                                    : rowPath
                                }
                                enabled={
                                  enabled &&
                                  !readonly &&
                                  !(column as any).readOnly
                                }
                                renderers={renderers}
                                cells={cells}
                              />
                              <TableCellErrors
                                schema={column}
                                uischema={{ type: 'Control', scope: '#' }}
                                path={
                                  objectRows
                                    ? composePaths(rowPath, field)
                                    : rowPath
                                }
                              />
                              </div>
                            </td>
                          ))}
                          <td className='p-2'>
                            {rowDetail.options && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon-sm'
                                      aria-label={rowDetail.t('collection.editDetails')}
                                      onClick={(event) => {
                    event.stopPropagation();
                    if (rowDetail.options?.presentation === 'panel') {
                      rowDetail.setPanelOpen(true);
                    }
                    rowDetail.open(index);
                  }}
                                    >
                                      <Pencil className='h-4 w-4' aria-hidden='true' />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {rowDetail.t('collection.editDetails')}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {options.showSortButtons && (
                              <>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon'
                                  className='h-7 w-7'
                                  aria-label={
                                    translations?.upAriaLabel || 'Move up'
                                  }
                                  title={translations?.up || 'Move up'}
                                  disabled={!enabled || readonly || index === 0}
                                  onClick={moveUp?.(path, index)}
                                >
                                  <ChevronUp
                                    className='h-4 w-4'
                                    aria-hidden='true'
                                  />
                                </Button>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='icon'
                                  className='h-7 w-7'
                                  aria-label={
                                    translations?.downAriaLabel || 'Move down'
                                  }
                                  title={translations?.down || 'Move down'}
                                  disabled={
                                    !enabled || readonly || index === data - 1
                                  }
                                  onClick={moveDown?.(path, index)}
                                >
                                  <ChevronDown
                                    className='h-4 w-4'
                                    aria-hidden='true'
                                  />
                                </Button>
                              </>
                            )}

                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <CollectionPager page={page} />
              </div>
            </RowDetailFrame>
          ) : (
            page.indices.map((index) => {
              const childPath = composePaths(path, `${index}`);
              const childLabel = childLabelForIndex(childPath, index);
              return (
                <ArrayItemPanel
                  key={childPath}
                  label={childLabel}
                  index={index}
                  initiallyOpen={index === 0 && !options.initCollapsed}
                  hideAvatar={Boolean(options.hideAvatar)}
                  actions={
                    <>
                      {' '}
                      <Button
                        variant='destructive'
                        size='icon'
                        className='h-7 w-7'
                        aria-label={translations?.removeAriaLabel || 'Remove'}
                        title={translations?.removeTooltip || 'Remove item'}
                        type='button'
                        disabled={!canRemove}
                        onClick={() => requestRemove(index)}
                      >
                        <Trash2 className='h-4 w-4' aria-hidden='true' />
                      </Button>
                    </>
                  }
                >
                  <JsonFormsDispatch
                    schema={schema}
                    uischema={detail}
                    path={childPath}
                    enabled={enabled}
                    renderers={renderers}
                    cells={cells}
                  />
                </ArrayItemPanel>
              );
            })
          )}
          {!table && <CollectionPager page={page} />}
        </div>
        <DeleteDialog open={selection.confirming} onCancel={selection.cancel} onConfirm={selection.confirm} />
        <DeleteDialog
          open={pendingIndex !== undefined}
          onCancel={() => setPendingIndex(undefined)}
          onConfirm={() => {
            if (canRemove && pendingIndex !== undefined && pendingIndex < data)
              removeItems(path, [pendingIndex])();
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
    schemaTypeIs('array')
  )
);
