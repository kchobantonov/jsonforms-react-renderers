import { useEditorAppearance } from '../util/useEditorAppearance';
import { useExtendedTranslator } from '../util/useExtendedTranslator';
import React, { useState, useRef, useMemo } from 'react';
import {
  composePaths,
  ControlProps,
  Resolve,
  createDefaultValue,
  JsonSchema,
} from '@jsonforms/core';
import { DispatchCell } from '@jsonforms/react';
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
  const ArrayShell = ArrayFrame ?? PlainArrayFrame;
  // Fragment would reject the identity props, so the fallback drops them.
  const CellShell =
    CellFrame ?? (({ children }: React.PropsWithChildren) => <>{children}</>);
  const AgGridControl = (props: ControlProps) => {
    const anchor = useRef<HTMLDivElement>(null);
    const hostTheme = useHostTheme();
    const confirmation = useConfirm();
    const t = useExtendedTranslator();
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
    const editable = props.enabled && !props.readonly;
    const showSortButtons = Boolean(options.showSortButtons);
    // `cells: { <field>: { summary, detail } }` from the uischema: how a
    // composite column summarises itself and what its detail dialog shows.
    const cellOptions = options.cells as Record<
      string,
      Record<string, unknown>
    >;
    const columns: ColDef[] = useMemo(
      () =>
        Object.entries(
          object ? items?.properties ?? {} : { value: items ?? {} }
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
          valueGetter: (event) =>
            object ? event.data.value?.[field] : event.data.value,
          cellRenderer: (event: { data: { index: number } }) => {
            const cellSchema = object
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
              options: cellOptions?.[field],
            };
            const cellPath = object
              ? composePaths(
                  composePaths(props.path, String(event.data.index)),
                  field
                )
              : composePaths(props.path, String(event.data.index));
            return (
              <CellShell
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
              </CellShell>
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
      ]
    );
    // Let the uischema refine the generated columns: entries are matched by
    // field, and their order wins, so widths/filters can be tuned without the
    // renderer having to know about the schema.
    const agGridOptions = (options.agGridOptions ?? {}) as Record<string, any>;
    const requested = agGridOptions.columnDefs as
      | (ColDef & { field?: string })[]
      | undefined;
    const resolvedColumns: ColDef[] = requested
      ? requested
          .map((requestedCol) => {
            const generated = columns.find(
              (column) => column.colId === requestedCol.field
            );
            return generated
              ? {
                  ...generated,
                  // A fixed width must opt out of the default flex sizing.
                  ...(requestedCol.width !== undefined &&
                  requestedCol.flex === undefined
                    ? { flex: 0 }
                    : {}),
                  ...requestedCol,
                }
              : undefined;
          })
          .filter((column): column is ColDef => Boolean(column))
      : columns;
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
      suppressRowDrag: userSuppressRowDrag,
      ...gridOptions
    } = agGridOptions;
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
        onClick: () =>
          props.handleChange(props.path, [
            ...rows,
            createDefaultValue(items ?? {}, props.rootSchema),
          ]),
      },
    ];
    if (!props.visible) return null;
    return (
      <ArrayShell
        options={props.uischema.options}
        config={props.config}
        label={props.label}
        description={props.description}
        errors={props.errors}
        actions={actions}
      >
        {confirmation?.dialog}
        <div
          ref={anchor}
          data-ag-theme-mode={isDark ? 'dark' : 'light'}
          style={{
            ...gridVars,
            colorScheme: isDark ? 'dark' : 'light',
            height: options.height ?? 400,
            minWidth: 0,
          }}
        >
          <AgGridReact
            theme={gridTheme}
            themeStyleContainer={() => anchor.current ?? undefined}
            rowData={rows.map((value, index) => ({ value, index }))}
            columnDefs={columnDefs}
            {...gridOptions}
            defaultColDef={{
              flex: 1,
              minWidth: 120,
              sortable: true,
              filter: true,
              resizable: true,
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
            onRowDragEnd={(event) => {
              const from = event.node.data?.index ?? -1;
              const to = event.overNode?.data?.index ?? -1;
              if (from >= 0 && to >= 0 && from !== to && !sorted && !filtered) {
                const next = rows.slice();
                next.splice(to, 0, next.splice(from, 1)[0]);
                props.handleChange(props.path, next);
                event.api.clearFocusedCell();
              }
              userRowDragEnd?.(event);
            }}
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
      </ArrayShell>
    );
  };
  return AgGridControl;
};
