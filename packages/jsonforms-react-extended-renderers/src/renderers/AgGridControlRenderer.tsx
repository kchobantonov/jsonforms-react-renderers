import { useEditorAppearance } from '../util/useEditorAppearance';
import React, { useState, useRef } from 'react';
import { ControlProps, createDefaultValue, JsonSchema } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  ColDef,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { EditorRendererComponents } from './EditorControlFrame';
ModuleRegistry.registerModules([AllCommunityModule]);

export const createAgGridControl = ({
  Frame,
  Button,
}: EditorRendererComponents) => {
  const AgGridControl = (props: ControlProps) => {
    const anchor = useRef<HTMLDivElement>(null);
    const colorTheme = useEditorAppearance(
      anchor,
      props.uischema.options?.theme
    );
    const [selected, setSelected] = useState<number[]>([]);
    const rows: any[] = Array.isArray(props.data) ? props.data : [];
    const items = (
      Array.isArray(props.schema.items)
        ? props.schema.items[0]
        : props.schema.items
    ) as JsonSchema | undefined;
    const object = items?.type === 'object' || Boolean(items?.properties);
    const options = { ...props.config, ...props.uischema.options };
    const editable = props.enabled && !props.readonly;
    const columns: ColDef[] = Object.entries(
      object ? items?.properties ?? {} : { value: items ?? {} }
    ).map(([field, schema]) => ({
      colId: field,
      headerName: schema.title ?? field,
      editable: editable && !(schema as any).readOnly,
      valueGetter: (event) =>
        object ? event.data.value?.[field] : event.data.value,
      cellDataType:
        schema.type === 'integer' || schema.type === 'number'
          ? 'number'
          : schema.type === 'boolean'
          ? 'boolean'
          : 'text',
    }));
    if (!props.visible) return null;
    return (
      <Frame {...props}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Button
            disabled={
              !editable ||
              (options.restrict !== false &&
                props.schema.maxItems !== undefined &&
                rows.length >= props.schema.maxItems)
            }
            onClick={() =>
              props.handleChange(props.path, [
                ...rows,
                createDefaultValue(items ?? {}, props.rootSchema),
              ])
            }
          >
            Add row
          </Button>
          <Button
            disabled={
              !editable ||
              !selected.length ||
              (options.restrict !== false &&
                props.schema.minItems !== undefined &&
                rows.length - selected.length < props.schema.minItems)
            }
            onClick={() => {
              props.handleChange(
                props.path,
                rows.filter((_row, index) => !selected.includes(index))
              );
              setSelected([]);
            }}
          >
            Remove selected
          </Button>
        </div>
        <div
          ref={anchor}
          data-ag-theme-mode={colorTheme === 'vs-dark' ? 'dark' : 'light'}
          style={{ height: options.height ?? 400, minWidth: 0 }}
        >
          <AgGridReact
            theme={themeQuartz}
            themeStyleContainer={() => anchor.current ?? undefined}
            rowData={rows.map((value, index) => ({ value, index }))}
            columnDefs={columns}
            defaultColDef={{
              flex: 1,
              minWidth: 120,
              sortable: true,
              filter: true,
              resizable: true,
            }}
            rowSelection={{ mode: 'multiRow' }}
            readOnlyEdit
            getRowId={(event) => String(event.data.index)}
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
      </Frame>
    );
  };
  return AgGridControl;
};

export const createAgGridControlRenderer = (
  components: EditorRendererComponents
) => withJsonFormsControlProps(createAgGridControl(components));
