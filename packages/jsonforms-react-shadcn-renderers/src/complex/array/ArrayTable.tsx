import {
  CollectionErrorNavigation,
  RowErrorCount,
} from '@chobantonov/jsonforms-react-renderer-common/collections/CollectionErrorNavigation';
import { ItemProvider } from '@chobantonov/jsonforms-react-renderer-common/cells/CellSummary';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@jsonforms-react-shadcn-ui/tooltip';
import { ErrorIndicator } from '../ErrorIndicator';
import {
  ColumnResizeHandle,
  useColumnWidths,
} from '@chobantonov/jsonforms-react-renderer-common/collections/columnResize';
import {
  tableColumnFields,
  tableColumnStyle,
  TableColumnDefinition,
} from '@chobantonov/jsonforms-react-renderer-common/collections/tableColumns';
import { useTableSelection } from '@chobantonov/jsonforms-react-renderer-common/collections/useTableSelection';
import { Checkbox } from '@jsonforms-react-shadcn-ui/checkbox';
import { useRowDetail } from '@chobantonov/jsonforms-react-renderer-common/collections/rowDetail';
import { CollectionPager } from '../CollectionPager';
import { RowDetailFrame, RowDetailEditButton } from '../RowDetailFrame';
import {
  ArrayLayoutProps,
  CellProps,
  composePaths,
  createCleanLabel,
  Resolve,
} from '@jsonforms/core';
import { DispatchCell, withJsonFormsCellProps } from '@jsonforms/react';
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import type { CollectionPage } from '@chobantonov/jsonforms-react-renderer-common/collections/collectionPagination';
const TableCellErrors = withJsonFormsCellProps(
  ({ errors, path, schema, uischema }: CellProps) =>
    errors &&
    uischema.options?.summary?.type !== 'Label' &&
    schema.type !== 'object' &&
    schema.type !== 'array' ? (
      <ErrorIndicator
        local
        errors={errors}
        path={path}
        className='shadcn-jsonforms-cell-error'
      />
    ) : null,
);

type ArrayTableProps = ArrayLayoutProps & {
  options: NonNullable<ArrayLayoutProps['uischema']['options']>;
  rowDetail: ReturnType<typeof useRowDetail>;
  page: CollectionPage;
  selection: ReturnType<typeof useTableSelection>;
  columnSizes: ReturnType<typeof useColumnWidths>;
  translations: {
    upAriaLabel: string;
    up: string;
    downAriaLabel: string;
    down: string;
  };
};

export function ArrayTable(props: ArrayTableProps) {
  const {
    schema,
    rootSchema,
    uischema,
    path,
    label,
    options,
    rowDetail,
    page,
    selection,
    columnSizes,
  } = props;
  const [columnWidths] = columnSizes;
  const columns = resolveTableColumns(
    schema,
    rootSchema,
    uischema,
    options,
    columnWidths,
  );
  const objectRows = Boolean(schema.properties);
  const hasRowActions = Boolean(rowDetail.options || options.showSortButtons);
  const tableWidth = columnWidths.__selection
    ? Object.values(columnWidths).reduce((sum, width) => sum + width, 0)
    : undefined;

  return (
    <RowDetailFrame state={rowDetail}>
      <div
        className='min-w-0 w-full max-w-full overflow-x-auto'
        style={{ contain: 'inline-size' }}
      >
        <table
          className='text-sm'
          style={{
            flexShrink: 0,
            minWidth: tableWidth,
            width: tableWidth ?? '100%',
            tableLayout: columnWidths.__selection ? 'fixed' : 'auto',
          }}
          aria-label={label}
        >
          {objectRows && (
            <ArrayTableHead
              columns={columns}
              columnSizes={columnSizes}
              page={page}
              selection={selection}
              selectPageLabel={rowDetail.t('collection.selectPage')}
              hasRowActions={hasRowActions}
              schema={schema}
              options={options}
            />
          )}
          <tbody>
            {page.indices.map((index) => (
              <ArrayTableRow
                key={composePaths(path, String(index))}
                table={props}
                index={index}
                columns={columns}
                hasRowActions={hasRowActions}
              />
            ))}
          </tbody>
        </table>
        <CollectionErrorNavigation
          options={uischema.options}
          renderAction={renderErrorNavigationButton}
          path={path}
          reveal={(index) => {
            page.change(Math.floor(index / page.size) + 1);
            if (rowDetail.options) {
              rowDetail.setPanelOpen(true);
              rowDetail.open(index);
            }
          }}
        />
        <CollectionPager page={page} />
      </div>
    </RowDetailFrame>
  );
}

function resolveTableColumns(
  schema: ArrayLayoutProps['schema'],
  rootSchema: ArrayLayoutProps['rootSchema'],
  uischema: ArrayLayoutProps['uischema'],
  options: ArrayTableProps['options'],
  columnWidths: Record<string, number>,
) {
  const definitions = uischema.options?.columnDefs as
    | TableColumnDefinition[]
    | undefined;
  const properties = schema.properties ?? { value: schema };
  const objectRows = Boolean(schema.properties);
  return tableColumnFields(
    properties,
    objectRows ? definitions : undefined,
    Object.keys(properties),
  ).map((field) => {
    const definition = definitions?.find((column) => column.field === field);
    const rowBound = definitions?.some(
      (column) => column.field === field && column.scope === '#',
    );
    const source = rowBound ? schema : properties[field];
    const column = source.$ref
      ? Resolve.schema(source, '#', rootSchema)
      : source;
    const style = tableColumnStyle(definition);
    const width = columnWidths[field];
    const cellOptions = options.cells?.[field];
    return {
      field,
      column,
      definition,
      propertyBound: objectRows && !rowBound,
      cellOptions,
      editorOptions: {
        ...cellOptions,
        ...(rowBound ? { summaryOnly: true } : {}),
      },
      header: columnHeader(field, column.title, definition),
      maxWidth: style.maxWidth,
      style:
        width === undefined
          ? style
          : { ...style, width, minWidth: width, maxWidth: width },
    };
  });
}

function selectionColumnStyle(width = 32) {
  return { width, minWidth: 32, maxWidth: width };
}

function ArrayTableHead({
  columns,
  columnSizes,
  page,
  selection,
  selectPageLabel,
  hasRowActions,
  schema,
  options,
}: Pick<
  ArrayTableProps,
  'columnSizes' | 'page' | 'selection' | 'schema' | 'options'
> & {
  columns: ReturnType<typeof resolveTableColumns>;
  selectPageLabel: string;
  hasRowActions: boolean;
}) {
  const [columnWidths, setColumnWidths] = columnSizes;
  const selectedCount = page.indices.filter((index) =>
    selection.selected.includes(index),
  ).length;
  const pageChecked =
    selectedCount > 0 && selectedCount < page.indices.length
      ? 'indeterminate'
      : selectedCount > 0;
  return (
    <thead>
      <tr className='border-b'>
        <th
          data-column-key='__selection'
          style={selectionColumnStyle(columnWidths.__selection)}
          className='p-2 text-center'
        >
          <Checkbox
            className='shadcn-jsonforms-row-selection align-middle'
            aria-label={selectPageLabel}
            disabled={!selection.selectable || !page.indices.length}
            checked={pageChecked}
            onCheckedChange={(checked) =>
              selection.setSelected(
                checked === true
                  ? [...new Set([...selection.selected, ...page.indices])]
                  : selection.selected.filter((i) => !page.indices.includes(i)),
              )
            }
          />
        </th>
        {columns.map(({ field, definition, header, style }) => (
          <th
            key={field}
            data-column-key={field}
            style={style}
            className='relative p-2 pe-4 text-left font-medium'
          >
            {header}
            {schema.required?.includes(field) &&
              !(
                options.cells?.[field]?.hideRequiredAsterisk ??
                options.hideRequiredAsterisk
              ) && <span aria-hidden='true'> *</span>}
            <ColumnResizeHandle
              colors={{
                border: 'hsl(var(--muted-foreground) / 0.5)',
                active: 'hsl(var(--primary))',
                focus: 'hsl(var(--ring))',
              }}
              field={header}
              definition={definition}
              width={columnWidths[field]}
              onResizeStart={(widths) => setColumnWidths(widths)}
              onResize={(value) =>
                setColumnWidths((current) => ({
                  ...current,
                  [field]: value,
                }))
              }
            />
          </th>
        ))}
        {hasRowActions && (
          <th
            data-column-key='__actions'
            style={{ width: columnWidths.__actions ?? 1 }}
            className='whitespace-nowrap p-2'
          />
        )}
      </tr>
    </thead>
  );
}

function ArrayRowActions({
  index,
  rowDetail,
  showSortButtons,
  path,
  enabled,
  readonly,
  data,
  moveUp,
  moveDown,
  translations,
}: Pick<
  ArrayTableProps,
  | 'rowDetail'
  | 'path'
  | 'enabled'
  | 'readonly'
  | 'data'
  | 'moveUp'
  | 'moveDown'
  | 'translations'
> & { index: number; showSortButtons: boolean }) {
  const editable = enabled && !readonly;
  return (
    <div className='flex w-max flex-nowrap items-center gap-1'>
      {rowDetail.options && (
        <RowDetailEditButton
          label={rowDetail.t('collection.editDetails')}
          onClick={(event) => {
            event.stopPropagation();
            if (rowDetail.options?.presentation === 'panel')
              rowDetail.setPanelOpen(true);
            rowDetail.open(index);
          }}
        />
      )}
      <RowErrorCount
        path={path}
        index={index}
        renderIndicator={(message) => <ErrorIndicator errors={message} />}
      />
      {showSortButtons && (
        <>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            aria-label={translations.upAriaLabel}
            title={translations.up}
            disabled={!editable || index === 0}
            onClick={moveUp?.(path, index)}
          >
            <ChevronUp className='h-4 w-4' aria-hidden='true' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            aria-label={translations.downAriaLabel}
            title={translations.down}
            disabled={!editable || index === data - 1}
            onClick={moveDown?.(path, index)}
          >
            <ChevronDown className='h-4 w-4' aria-hidden='true' />
          </Button>
        </>
      )}
    </div>
  );
}

function renderErrorNavigationButton(
  label: string,
  onClick: () => void,
  icon: React.ReactNode,
) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='h-7 w-7'
            aria-label={label}
            onClick={onClick}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function columnHeader(
  field: string,
  title: string | undefined,
  definition: TableColumnDefinition | undefined,
) {
  return definition?.headerName ?? title ?? createCleanLabel(field);
}

function ArrayTableRow({
  table,
  index,
  columns,
  hasRowActions,
}: {
  table: ArrayTableProps;
  index: number;
  columns: ReturnType<typeof resolveTableColumns>;
  hasRowActions: boolean;
}) {
  const {
    path,
    enabled,
    readonly,
    data,
    moveUp,
    moveDown,
    translations,
    rowDetail,
    options,
    selection,
    renderers,
    cells,
  } = table;
  const [columnWidths] = table.columnSizes;

  const actionProps = {
    rowDetail,
    showSortButtons: options.showSortButtons,
    path,
    enabled,
    readonly,
    data,
    moveUp,
    moveDown,
    translations,
  };

  const rowPath = composePaths(path, String(index));
  const panel = rowDetail.options?.presentation === 'panel';
  const current =
    panel && rowDetail.panelOpen && rowDetail.selection?.index === index;
  return (
    <tr
      className={current ? 'border-b bg-accent' : 'border-b'}
      aria-current={current || undefined}
      onClick={() => {
        if (panel) {
          rowDetail.open(index);
        }
      }}
    >
      <td
        className='p-2 text-center'
        style={selectionColumnStyle(columnWidths.__selection)}
        onClick={(event) => event.stopPropagation()}
      >
        <Checkbox
          className='shadcn-jsonforms-row-selection align-middle'
          aria-label={rowDetail.t('collection.selectRow', {
            index: index + 1,
          })}
          disabled={!selection.selectable}
          checked={selection.selected.includes(index)}
          onCheckedChange={(checked) =>
            selection.setSelected(
              checked === true
                ? [...selection.selected, index]
                : selection.selected.filter((i) => i !== index),
            )
          }
        />
      </td>
      {columns.map(
        ({
          field,
          column,
          style,
          maxWidth,
          propertyBound,
          editorOptions,
          cellOptions,
        }) => {
          const cellPath = propertyBound
            ? composePaths(rowPath, field)
            : rowPath;
          return (
            <td
              key={field}
              style={style}
              className='shadcn-jsonforms-table-cell p-2'
            >
              <div style={{ maxWidth, overflow: 'hidden' }}>
                <ItemProvider path={rowPath}>
                  <DispatchCell
                    schema={column}
                    uischema={{
                      type: 'Control',
                      scope: propertyBound ? '#/properties/' + field : '#',
                      options: editorOptions,
                    }}
                    path={cellPath}
                    enabled={enabled && !readonly && !(column as any).readOnly}
                    renderers={renderers}
                    cells={cells}
                  />
                </ItemProvider>
                <TableCellErrors
                  schema={column}
                  uischema={{
                    type: 'Control',
                    scope: '#',
                    options: cellOptions,
                  }}
                  path={cellPath}
                />
              </div>
            </td>
          );
        },
      )}
      {hasRowActions && (
        <td
          className='whitespace-nowrap p-2'
          style={{ width: columnWidths.__actions ?? 1 }}
        >
          <ArrayRowActions index={index} {...actionProps} />
        </td>
      )}
    </tr>
  );
}
