import type { ColDef, ColGroupDef } from 'ag-grid-community';
import type { JsonSchema } from '@jsonforms/core';
import {
  tableColumnFields,
  tableColumnStyle,
  type TableColumnDefinition,
} from '@chobantonov/jsonforms-react-renderer-common/collections/tableColumns';

type GridColumn = ColDef | ColGroupDef;

function isColumnGroup(column: GridColumn): column is ColGroupDef {
  return 'children' in column && Array.isArray(column.children);
}

export function resolveGridColumns(
  columns: ColDef[],
  portable: TableColumnDefinition[] | undefined,
  nativeDefinitions: GridColumn[] | undefined,
  items: JsonSchema | undefined,
  cellOptions: Record<string, Record<string, unknown>>,
  hideRequiredAsterisk: boolean,
) {
  const portableFields = tableColumnFields(
    Object.fromEntries(columns.map((column) => [column.colId!, true])),
    portable,
    columns.map((column) => column.colId!),
  );
  const mergeColumn = (definition: ColDef): ColDef => {
    const generated = columns.find(
      (column) => column.colId === (definition.field ?? definition.colId),
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
  const nativeColumns = (definitions: GridColumn[]): GridColumn[] =>
    definitions.map((definition) =>
      isColumnGroup(definition)
        ? { ...definition, children: nativeColumns(definition.children) }
        : mergeColumn(definition),
    );
  const resolvedColumns: GridColumn[] =
    nativeDefinitions !== undefined
      ? nativeColumns(nativeDefinitions)
      : portableFields.map((field) => {
          const definition = portable?.find((column) => column.field === field);
          return mergeColumn({
            field,
            ...(definition?.headerName
              ? { headerName: definition.headerName }
              : {}),
            ...tableColumnStyle(definition),
          } as ColDef);
        });
  const markRequiredHeaders = (definitions: GridColumn[]) => {
    definitions.forEach((definition) => {
      if (isColumnGroup(definition)) markRequiredHeaders(definition.children);
      else if (
        definition.field !== undefined &&
        items?.required?.includes(definition.field) &&
        !(
          cellOptions?.[definition.field]?.hideRequiredAsterisk ??
          hideRequiredAsterisk
        )
      ) {
        definition.headerName = `${
          definition.headerName ?? definition.field
        } *`;
      }
    });
  };
  markRequiredHeaders(resolvedColumns);
  return resolvedColumns;
}
