import { compositeSummary } from '@chobantonov/jsonforms-react-renderer-common/compositeSummary';
import { useI18nDefault } from '@chobantonov/jsonforms-react-renderer-common/translate';
import { usePathErrorIndicator } from '@chobantonov/jsonforms-react-renderer-common/errorSummary';
import { CollectionErrorNavigation, RowErrorCount } from '@chobantonov/jsonforms-react-renderer-common/CollectionErrorNavigation';
import { ItemProvider } from '@chobantonov/jsonforms-react-renderer-common/CellSummary';
import { resolvePagination } from '@chobantonov/jsonforms-react-renderer-common/collectionPagination';
import {
  tableColumnFields,
  tableColumnStyle,
  TableColumnDefinition,
} from '@chobantonov/jsonforms-react-renderer-common/tableColumns';
import { useRowDetail } from '@chobantonov/jsonforms-react-renderer-common/rowDetail';
import { useEditorAppearance } from '../util/useEditorAppearance';
import { useExtendedTranslator } from '../util/useExtendedTranslator';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  composePaths,
  ControlProps,
  Resolve,
  createDefaultValue,
  JsonSchema,
} from '@jsonforms/core';
import { DispatchCell, useJsonForms } from '@jsonforms/react';
import { labelFilterValue } from '../util/labelFilterValue';
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  ColDef,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import {
  EditorArrayAction,
  EditorArrayFrameProps,
  EditorRendererComponents,
} from './EditorControlFrame';

const PlainArrayFrame = ({
  label,
  actions = [],
  children,
}: EditorArrayFrameProps) => (
  <div>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}
    >
      <strong>{label}</strong>
      <span style={{ display: 'flex', gap: 8 }}>
        {actions.map((action) => (
          <button
            key={action.key}
            type='button'
            disabled={action.disabled}
            onClick={action.onClick}
            title={action.label}
            aria-label={action.label}
          >
            {action.icon ?? action.label}
          </button>
        ))}
      </span>
    </div>
    {children}
  </div>
);
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Every color is a CSS variable reference with a neutral light-dark() default,
 * so a renderer set only has to set the variables on the container: light/dark
 * and design-system changes then apply as pure CSS, without rebuilding the
 * theme or recreating the grid. `browserColorScheme: 'inherit'` matters because
 * Quartz hardcodes "light", which would stop light-dark() following the mode.
 */
const gridTheme = themeQuartz.withParams({
  browserColorScheme: 'inherit',
  backgroundColor:
    'var(--jsonforms-ag-grid-background, light-dark(#ffffff, #141414))',
  foregroundColor:
    'var(--jsonforms-ag-grid-foreground, light-dark(#141414, #ffffffd9))',
  borderColor: 'var(--jsonforms-ag-grid-border, light-dark(#d9d9d9, #424242))',
  accentColor: 'var(--jsonforms-ag-grid-accent, light-dark(#1677ff, #1668dc))',
  headerBackgroundColor:
    'var(--jsonforms-ag-grid-header-background, light-dark(#fafafa, #1f1f1f))',
  headerTextColor:
    'var(--jsonforms-ag-grid-header-foreground, var(--jsonforms-ag-grid-foreground, light-dark(#141414, #ffffffd9)))',
  oddRowBackgroundColor: 'transparent',
  rowHoverColor:
    'var(--jsonforms-ag-grid-row-hover, color-mix(in srgb, currentColor 6%, transparent))',
  selectedRowBackgroundColor:
    'var(--jsonforms-ag-grid-selected-row-background, color-mix(in srgb, currentColor 10%, transparent))',
  fontFamily: 'var(--jsonforms-ag-grid-font-family, inherit)',
  rangeSelectionBorderStyle: 'none',
});

export const createAgGridControl = ({
  Button,
  RowDetailButton = Button,
  RowErrorIndicator,
  EditIcon,
  ShowDetailsIcon,
  HideDetailsIcon,
  RowDetailFrame,
  AddIcon,
  RemoveIcon,
  useRemoveConfirmation,
  ArrayFrame,
  CellFrame,
  useEditorTheme,
}: EditorRendererComponents) => {
  // Resolved once per renderer set so the hook calls below stay unconditional.
  const useHostTheme = useEditorTheme ?? (() => undefined);
  const useConfirm =
    useRemoveConfirmation ??
    (() =>
      undefined as
        | ReturnType<
            NonNullable<EditorRendererComponents['useRemoveConfirmation']>
          >
        | undefined);
  const DetailShell =
    RowDetailFrame ??
    (({ children }: React.PropsWithChildren<any>) => <>{children}</>);
  const ArrayShell = ArrayFrame ?? PlainArrayFrame;
  // Fragment would reject the identity props, so the fallback drops them.
  const CellShell =
    CellFrame ?? (({ children }: React.PropsWithChildren) => <>{children}</>);
  const AgGridControl = (props: ControlProps) => {
    const collectionErrors = usePathErrorIndicator(props.path, props.uischema.options);
    const anchor = useRef<HTMLDivElement>(null);
    const gridApi = useRef<any>();
    const formContext = useJsonForms();
    const hostTheme = useHostTheme();
    const confirmation = useConfirm();
    const t = useExtendedTranslator();
    const summaryDefault = useI18nDefault();
    const { isDark } = useEditorAppearance(
      anchor,
      props.uischema.options?.theme,
      hostTheme?.isDark
    );
    // Only variables the host actually provides are emitted; the rest fall back
    // to the light-dark() defaults baked into the theme above.
    const gridVars = useMemo(() => {
      const entries: [string, string | undefined][] = [
        ['--jsonforms-ag-grid-background', hostTheme?.background],
        ['--jsonforms-ag-grid-foreground', hostTheme?.foreground],
        ['--jsonforms-ag-grid-border', hostTheme?.border],
        ['--jsonforms-ag-grid-accent', hostTheme?.accent],
        ['--jsonforms-ag-grid-header-background', hostTheme?.headerBackground],
        ['--jsonforms-ag-grid-header-foreground', hostTheme?.headerForeground],
        ['--jsonforms-ag-grid-row-hover', hostTheme?.rowHover],
        [
          '--jsonforms-ag-grid-selected-row-background',
          hostTheme?.selectedRowBackground,
        ],
        ['--jsonforms-ag-grid-font-family', hostTheme?.fontFamily],
      ];
      return Object.fromEntries(
        entries.filter(([, value]) => Boolean(value))
      ) as React.CSSProperties;
    }, [hostTheme]);
    const [selected, setSelected] = useState<number[]>([]);
    // Drag-to-reorder writes back by row position, so it is only meaningful
    // while what the grid shows is what the data holds. A sort or a filter
    // breaks that correspondence, so dragging is suppressed until both clear.
    const [sorted, setSorted] = useState(false);
    const [filtered, setFiltered] = useState(false);
    const [addedHidden, setAddedHidden] = useState(false);
    const rows: any[] = Array.isArray(props.data) ? props.data : [];
    const items = (
      Array.isArray(props.schema.items)
        ? props.schema.items[0]
        : props.schema.items
    ) as JsonSchema | undefined;
    const object = items?.type === 'object' || Boolean(items?.properties);
    const options = useMemo(
      () => ({ ...props.config, ...props.uischema.options }),
      [props.config, props.uischema.options]
    );
    const editable =
      props.enabled && !props.readonly && !(props.schema as any).readOnly;
    const detail = useRowDetail({
      ...props,
      schema: items ?? {},
      enabled: editable,
    });
    // Keep the action renderer stable as selection and form data change.
    const detailRef = useRef(detail);
    detailRef.current = detail;
    useEffect(() => {
      const host = anchor.current;
      if (!host || !RowDetailFrame || detail.options?.presentation !== 'panel')
        return;
      const markCurrent = () => {
        host.querySelectorAll<HTMLElement>('.ag-row[row-id]').forEach((row) => {
          if (
            detail.panelOpen &&
            row.getAttribute('row-id') === String(detail.selection?.index)
          ) {
            row.setAttribute('aria-current', 'true');
          } else {
            row.removeAttribute('aria-current');
          }
        });
      };
      markCurrent();
      const observer = new MutationObserver(markCurrent);
      observer.observe(host, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['row-id'],
      });
      return () => observer.disconnect();
    }, [
      detail.panelOpen,
      detail.selection?.index,
      detail.options?.presentation,
      props.visible,
    ]);
    const detailColumn = useMemo<ColDef>(
      () => ({
        colId: '$detail',
        pinned: 'right',
        lockPinned: true,
        maxWidth: EditIcon ? 104 : 180,
        headerName: '',
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        flex: 0,
        width: EditIcon ? 104 : 180,
        minWidth: EditIcon ? 104 : 180,
        cellRenderer: (event: { data?: { index: number } }) => (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <RowDetailButton
            aria-label={detailRef.current.t('collection.editDetails')}
            title={detailRef.current.t('collection.editDetails')}
            icon={EditIcon ? <EditIcon /> : undefined}
            onClick={(click) => {
              click.stopPropagation();
              if (event.data) {
                detailRef.current.setPanelOpen(true);
                detailRef.current.open(event.data.index);
              }
            }}
          >
            {EditIcon
              ? undefined
              : detailRef.current.t('collection.editDetails')}
          </RowDetailButton>
          {event.data && <RowErrorCount path={props.path} index={event.data.index}
            renderIndicator={RowErrorIndicator ? (message) => <RowErrorIndicator message={message} /> : undefined} />}
          </span>
        ),
      }),
      []
    );
    const showSortButtons = Boolean(options.showSortButtons);
    // `cells: { <field>: { summary, detail } }` from the uischema: how a
    // composite column summarises itself and what its detail dialog shows.
    const cellOptions = options.cells as Record<
      string,
      Record<string, unknown>
    >;
    const summaryCache = useMemo(() => new Map<unknown, Map<unknown, string>>(),
      [formContext.core?.data, formContext.i18n, props.config, cellOptions]);
    const summaryValue = (label: any, item: unknown) => {
      let values = summaryCache.get(label);
      if (!values) { values = new Map(); summaryCache.set(label, values); }
      if (values.has(item)) return values.get(item)!;
      const text = labelFilterValue(label, formContext.core?.data, item, props.config,
        formContext.i18n?.locale, formContext.i18n?.translate);
      if (values.size >= 1000) values.delete(values.keys().next().value);
      values.set(item, text);
      return text;
    };
    const controlSummaryRef = useRef<(summary: any, value: unknown, schema: JsonSchema) => string>(() => '');
    controlSummaryRef.current = (summary, value, schema) => compositeSummary(
      value, summary, schema.title,
      formContext.i18n?.translate ?? ((_key, fallback) => fallback ?? ''),
      summaryDefault, schema
    );
    const summaryValueRef = useRef(summaryValue);
    summaryValueRef.current = summaryValue;
    const columns: ColDef[] = useMemo(
      () =>
        Object.entries(
          object ? { ...items?.properties, ...Object.fromEntries((props.uischema.options?.columnDefs ?? []).filter((c: TableColumnDefinition) => c.scope === '#').map((c: TableColumnDefinition) => [c.field, items])) } : { value: items ?? {} }
        ).map(([field, schema]) => ({
          colId: field,
          headerName: schema.title ?? field,
          /*
        Cells render the renderer set's own controls rather than plain text,
        so a column gets the same editor the form would use - but only for a
        control the host registered as a **cell**. A control that exists only
        in the renderer registry is unreachable here and the column falls back
        to `TextCell`, silently. For the antd family that is what
        `antdExtendedCells` is for; a host passing bare `antdCells` sees
        colour and duration columns as text.

        CellShell strips the label and inline message a cell has no room for.
      */
          editable: false,
          // AG Grid uses this value for sorting and its default text filters;
          // the cell editor still binds to the original row/property below.
          valueGetter: (event) =>
            (cellOptions?.[field]?.summary as any)?.type === 'Label'
              ? summaryValueRef.current(cellOptions[field].summary, event.data?.value)
              : (cellOptions?.[field]?.summary as any)?.type === 'Control'
                ? controlSummaryRef.current(cellOptions[field].summary,
                    object ? event.data?.value?.[field] : event.data?.value, schema)
                : object ? event.data?.value?.[field] : event.data?.value,
          cellRenderer: (event: { data: { index: number } }) => {
            const rowBound = props.uischema.options?.columnDefs?.some((c: TableColumnDefinition) => c.field === field && c.scope === '#');
            const cellSchema = object && !rowBound
              ? (Resolve.schema(
                  items as JsonSchema,
                  `#/properties/${field}`,
                  props.rootSchema
                ) as JsonSchema)
              : (items as JsonSchema);
            const cellUiSchema = {
              type: 'Control' as const,
              scope: object ? `#/properties/${field}` : '#',
              label: false,
              // `cells: { <field>: { summary, detail } }` tells a composite
              // column how to summarise itself and what its dialog shows.
              options: { ...cellOptions?.[field], ...(rowBound ? { summaryOnly: true } : {}) },
            };
            const cellPath = object && !rowBound
              ? composePaths(
                  composePaths(props.path, String(event.data.index)),
                  field
                )
              : composePaths(props.path, String(event.data.index));
            return (
              <ItemProvider path={composePaths(props.path, String(event.data.index))}><CellShell
                schema={cellSchema}
                uischema={cellUiSchema}
                path={cellPath}
              >
                {/*
            DispatchCell, not JsonFormsDispatch: the composite (object/array)
            cell lives in the cells registry. Dispatching a renderer instead
            picks the object renderer and inlines the whole detail form in the
            cell rather than a one-line summary.
          */}
                <DispatchCell
                  schema={cellSchema}
                  uischema={cellUiSchema}
                  path={cellPath}
                  enabled={editable && !(schema as any).readOnly}
                  renderers={props.renderers}
                  cells={props.cells}
                />
              </CellShell></ItemProvider>
            );
          },
        })),
      [
        object,
        items,
        props.rootSchema,
        props.path,
        props.renderers,
        props.cells,
        editable,
        cellOptions,
        props.uischema.options?.columnDefs,
      ]
    );
    // Let the uischema refine the generated columns: entries are matched by
    // field, and their order wins, so widths/filters can be tuned without the
    // renderer having to know about the schema.
    const agGridOptions = (options.agGridOptions ?? {}) as Record<string, any>;
    const pagination = resolvePagination(
      props.uischema.options?.pagination,
      props.config,
      'array'
    );
    const portable = props.uischema.options?.columnDefs as
      | TableColumnDefinition[]
      | undefined;
    const portableFields = tableColumnFields(
      Object.fromEntries(columns.map((column) => [column.colId!, true])),
      portable,
      columns.map((column) => column.colId!)
    );
    const mergeColumn = (definition: ColDef): ColDef => {
      const generated = columns.find(
        (column) => column.colId === (definition.field ?? definition.colId)
      );
      return {
        ...generated,
        ...(definition.width !== undefined && definition.flex === undefined
          ? { flex: 0 }
          : {}),
        ...definition,
      };
    };
    // Native definitions replace the portable list as a whole, including groups
    // and computed columns. Known fields retain their JSON Forms cell editor.
    const nativeColumns = (definitions: any[]): any[] =>
      definitions.map((definition) =>
        definition.children
          ? { ...definition, children: nativeColumns(definition.children) }
          : mergeColumn(definition)
      );
    const resolvedColumns: ColDef[] =
      agGridOptions.columnDefs !== undefined
        ? nativeColumns(agGridOptions.columnDefs)
        : portableFields.map((field) =>
            mergeColumn({
              field,
              ...(portable?.find(c => c.field === field)?.headerName ? { headerName: portable.find(c => c.field === field)!.headerName } : {}),
              ...tableColumnStyle(
                portable?.find((column) => column.field === field)
              ),
            } as ColDef)
          );
    // `showSortButtons` is the same option the table renderer uses for its
    // per-row up/down buttons; in a grid the equivalent affordance is a drag
    // handle column. A column the uischema already marks `rowDrag` wins.
    const hasDragColumn = resolvedColumns.some((column) => column.rowDrag);
    const columnDefs: ColDef[] =
      editable && showSortButtons && !hasDragColumn
        ? [
            {
              colId: '$drag',
              headerName: '',
              rowDrag: true,
              sortable: false,
              filter: false,
              resizable: false,
              suppressMovable: true,
              flex: undefined,
              width: 38,
              maxWidth: 38,
              minWidth: 38,
              valueGetter: () => '',
            },
            ...resolvedColumns,
          ]
        : resolvedColumns;
    const {
      columnDefs: _ignored,
      onSortChanged: userSortChanged,
      onFilterChanged: userFilterChanged,
      onRowDragEnd: userRowDragEnd,
      onRowClicked: userRowClicked,
      onRowDataUpdated: userRowDataUpdated,
      suppressRowDrag: userSuppressRowDrag,
      ...gridOptions
    } = agGridOptions;
    const pendingAddedRow = useRef<number>();
    const addDisabled =
      !editable ||
      (options.restrict !== false &&
        props.schema.maxItems !== undefined &&
        rows.length >= props.schema.maxItems);
    const removeDisabled =
      !editable ||
      !selected.length ||
      (options.restrict !== false &&
        props.schema.minItems !== undefined &&
        rows.length - selected.length < props.schema.minItems);
    // The grid selects rows, so removal belongs in the header. Array
    // renderers without selection keep their per-row delete instead.
    const actions: EditorArrayAction[] = [
      {
        key: 'remove',
        label: t('array.removeSelected'),
        danger: true,
        disabled: removeDisabled,
        icon: RemoveIcon ? <RemoveIcon /> : undefined,
        onClick: () => {
          const remove = () => {
            props.handleChange(
              props.path,
              rows.filter((_row, index) => !selected.includes(index))
            );
            setSelected([]);
          };
          if (!confirmation) {
            remove();
            return;
          }
          /*
            One prompt covers the whole batch, and the host decides whether
            there is one at all. Every selected row is offered as discarded, so
            a `complex` policy can ask "does any of this matter".
          */
          confirmation.request({
            discarded: selected.map((index) => rows[index]),
            options: props.uischema?.options as
              | Record<string, unknown>
              | undefined,
            config: props.config,
            perform: remove,
          });
        },
      },
      {
        key: 'add',
        label: t('array.addRow'),
        disabled: addDisabled,
        icon: AddIcon ? <AddIcon /> : undefined,
        onClick: () => {
          pendingAddedRow.current = rows.length;
          props.handleChange(props.path, [
            ...rows,
            createDefaultValue(items ?? {}, props.rootSchema),
          ]);
        },
      },
    ];
    if (RowDetailFrame && detail.options?.presentation === 'panel') {
      actions.unshift({
        key: 'details',
        icon: detail.panelOpen && HideDetailsIcon ? <HideDetailsIcon /> : ShowDetailsIcon ? <ShowDetailsIcon /> : undefined,
        label: detail.t(
          detail.panelOpen ? 'collection.hideDetails' : 'collection.showDetails'
        ),
        onClick: () => detail.setPanelOpen((open) => !open),
      });
    }
    if (!props.visible) return null;
    return (
      <ArrayShell
        options={props.uischema.options}
        config={props.config}
        label={props.label}
        description={props.description}
        errors={collectionErrors}
        actions={actions}
      >
        {confirmation?.dialog}
        {addedHidden && <div role='status'>
          {detail.t('collection.addedHidden')}
          <button type='button' onClick={() => { gridApi.current?.setFilterModel(null); setAddedHidden(false); }}>
            {detail.t('collection.clearFilters')}
          </button>
        </div>}
        <DetailShell state={detail}>
          <div
            ref={anchor}
            data-ag-theme-mode={isDark ? 'dark' : 'light'}
            style={{
              ...gridVars,
              colorScheme: isDark ? 'dark' : 'light',
              height:
                RowDetailFrame &&
                detail.options?.presentation === 'panel' &&
                detail.panelOpen
                  ? '100%'
                  : options.height ?? 400,
              minWidth: 0,
            }}
          >
            <style>{`.ag-row[aria-current="true"] { background-color: var(--ag-selected-row-background-color); }`}</style>
            <AgGridReact
              theme={gridTheme}
              themeStyleContainer={() => anchor.current ?? undefined}
              rowData={rows.map((value, index) => ({ value, index }))}
              columnDefs={
                RowDetailFrame && detail.options
                  ? [...columnDefs, detailColumn]
                  : columnDefs
              }
              pagination={pagination.enabled}
              paginationPageSize={pagination.size}
              paginationPageSizeSelector={pagination.choices}
              {...gridOptions}
              onRowDataUpdated={(event) => {
                const index = pendingAddedRow.current;
                if (index !== undefined) {
                  const node = event.api.getRowNode(String(index));
                  if (node) {
                    pendingAddedRow.current = undefined;
                    // Use the displayed position so sorting is respected. A row
                    // excluded by an active filter has no page to reveal.
                    setAddedHidden(node.rowIndex == null);
                    if (node.rowIndex != null) {
                      event.api.paginationGoToPage(Math.floor(node.rowIndex / event.api.paginationGetPageSize()));
                      event.api.ensureIndexVisible(node.rowIndex);
                    }
                  }
                }
                userRowDataUpdated?.(event);
              }}
              defaultColDef={{
                flex: 1,
                minWidth: 120,
                sortable: true,
                filter: true,
                resizable: true,
                ...agGridOptions.defaultColDef,
              }}
              // Cells host real form controls that draw their own focus ring, so
              // the grid's cell-focus border would double up on it.
              suppressCellFocus
              rowSelection={{ mode: 'multiRow' }}
              readOnlyEdit
              getRowId={(event) => String(event.data.index)}
              suppressRowDrag={
                Boolean(userSuppressRowDrag) || !editable || sorted || filtered
              }
              onSortChanged={(event) => {
                setSorted(
                  event.api
                    .getColumnState()
                    .some((column) => Boolean(column.sort))
                );
                userSortChanged?.(event);
              }}
              onFilterChanged={(event) => {
                setFiltered(Object.keys(event.api.getFilterModel()).length > 0);
                userFilterChanged?.(event);
              }}
              onRowClicked={(event) => {
                if (
                  RowDetailFrame &&
                  detail.options?.presentation === 'panel' &&
                  event.data &&
                  !(
                    event.event?.target instanceof Element &&
                    event.event.target.closest(
                      '.ag-selection-checkbox, .ag-row-drag'
                    )
                  )
                ) {
                  detail.open(event.data.index);
                }
                userRowClicked?.(event);
              }}
              onRowDragEnd={(event) => {
                const from = event.node.data?.index ?? -1;
                const to = event.overNode?.data?.index ?? -1;
                if (
                  from >= 0 &&
                  to >= 0 &&
                  from !== to &&
                  !sorted &&
                  !filtered
                ) {
                  const next = rows.slice();
                  next.splice(to, 0, next.splice(from, 1)[0]);
                  props.handleChange(props.path, next);
                  event.api.clearFocusedCell();
                }
                userRowDragEnd?.(event);
              }}
              onGridReady={(event) => { gridApi.current = event.api; agGridOptions.onGridReady?.(event); }}
              onSelectionChanged={(event) =>
                setSelected(event.api.getSelectedRows().map((row) => row.index))
              }
              onCellEditRequest={(event) => {
                if (!editable || event.data.index >= rows.length) return;
                const next = rows.slice();
                next[event.data.index] = object
                  ? {
                      ...next[event.data.index],
                      [event.column.getColId()]: event.newValue,
                    }
                  : event.newValue;
                props.handleChange(props.path, next);
              }}
            />
          </div>
          <CollectionErrorNavigation options={props.uischema.options} renderAction={(label, onClick, icon) =>
            <Button icon={icon} title={label} aria-label={label} onClick={onClick} />}
            path={props.path} reveal={(index) => {
            const api = gridApi.current;
            const node = api?.getRowNode(String(index));
            if (node?.rowIndex != null) {
              api.paginationGoToPage(Math.floor(node.rowIndex / api.paginationGetPageSize()));
              api.ensureIndexVisible(node.rowIndex);
            }
            if (detail.options) { detail.setPanelOpen(true); detail.open(index); }
          }} />
        </DetailShell>
      </ArrayShell>
    );
  };
  return AgGridControl;
};
