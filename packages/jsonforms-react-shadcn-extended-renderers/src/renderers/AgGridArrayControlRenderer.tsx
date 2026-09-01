import {
  ControlProps,
  JsonSchema,
  RankedTester,
  and,
  optionIs,
  rankWith,
  schemaTypeIs,
  uiTypeIs,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  Button,
  InputShell,
  makeId,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  themeQuartz,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React from 'react';

ModuleRegistry.registerModules([AllCommunityModule]);

export const agGridArrayTester: RankedTester = rankWith(
  10,
  and(
    uiTypeIs('Control'),
    schemaTypeIs('array'),
    optionIs('variant', 'ag-grid')
  )
);

const defaultValue = (schema: JsonSchema): unknown => {
  if (schema.default !== undefined) return schema.default;
  if (schema.type === 'boolean') return false;
  if (schema.type === 'object') return {};
  if (schema.type === 'array') return [];
  return undefined;
};

export const ShadcnAgGridArrayControl = (props: ControlProps) => {
  const [selected, setSelected] = React.useState<number[]>([]);
  const rows: any[] = Array.isArray(props.data) ? props.data : [];
  const itemSchema = (
    Array.isArray(props.schema.items)
      ? props.schema.items[0]
      : props.schema.items
  ) as JsonSchema | undefined;
  const properties = itemSchema?.properties ?? {};
  const columns = React.useMemo<ColDef[]>(
    () =>
      Object.entries(properties).map(([field, schema]) => ({
        field,
        headerName: schema.title ?? field,
        editable: props.enabled,
        sortable: true,
        filter: true,
        resizable: true,
        cellDataType:
          schema.type === 'number' || schema.type === 'integer'
            ? 'number'
            : schema.type === 'boolean'
            ? 'boolean'
            : 'text',
      })),
    [properties, props.enabled]
  );
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);

  return (
    <InputShell
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={props.errors}
    >
      <div className='shadcn-jsonforms-grid-actions'>
        <Button
          className='shadcn-jsonforms-button shadcn-jsonforms-button-sm'
          size='sm'
          disabled={!props.enabled}
          onClick={() =>
            props.handleChange(props.path, [
              ...rows,
              defaultValue(itemSchema ?? {}),
            ])
          }
        >
          Add row
        </Button>
        <Button
          className='shadcn-jsonforms-button shadcn-jsonforms-button-danger shadcn-jsonforms-button-sm'
          variant='destructive'
          size='sm'
          disabled={!props.enabled || selected.length === 0}
          onClick={() => {
            const removals = new Set(selected);
            props.handleChange(
              props.path,
              rows.filter((_row, index) => !removals.has(index))
            );
            setSelected([]);
          }}
        >
          Remove selected
        </Button>
      </div>
      <div
        id={id}
        className='shadcn-jsonforms-ag-grid'
        style={{ height: props.uischema.options?.height ?? 400 }}
      >
        <AgGridReact
          theme={themeQuartz}
          rowData={rows.map((value, index) => ({
            ...value,
            __jsonformsIndex: index,
          }))}
          columnDefs={columns}
          defaultColDef={{ flex: 1, minWidth: 120 }}
          rowSelection={{ mode: 'multiRow' }}
          getRowId={(params) => String(params.data.__jsonformsIndex)}
          onSelectionChanged={(event) =>
            setSelected(
              event.api.getSelectedRows().map((row) => row.__jsonformsIndex)
            )
          }
          onCellValueChanged={(event) => {
            const index = event.data.__jsonformsIndex;
            const next = rows.slice();
            const { __jsonformsIndex: ignored, ...value } = event.data;
            void ignored;
            next[index] = value;
            props.handleChange(props.path, next);
          }}
        />
      </div>
    </InputShell>
  );
};

export const AgGridArrayControlRenderer = withJsonFormsControlProps(
  ShadcnAgGridArrayControl
);
