import {
  ControlElement,
  encode,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  Resolve,
} from '@jsonforms/core';
import { DispatchCell } from '@jsonforms/react';
import React from 'react';
import { CellFrame } from '../util/cellFrame';

export interface DataCellProps {
  path: string;
  propName?: string;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  errors: string;
  enabled: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  /** Per-column options from the array uischema's `cells` entry. */
  cellOptions?: Record<string, unknown>;
}

const controlWithoutLabel = (
  scope: string,
  options?: Record<string, unknown>
): ControlElement => ({
  type: 'Control',
  scope: scope,
  label: false,
  // `cells: { <prop>: { summary, detail } }` from the array's uischema reaches
  // the cell here, which is how composite columns know how to summarise
  // themselves and what to show in their detail dialog.
  options,
});

const DataCell = ({
  path,
  propName,
  schema,
  rootSchema,
  errors,
  enabled,
  renderers,
  cells,
  cellOptions,
}: DataCellProps) => {
  return (
    <CellFrame errors={errors}>
      {schema.properties ? (
        <DispatchCell
          schema={Resolve.schema(
            schema,
            `#/properties/${encode(propName)}`,
            rootSchema
          )}
          uischema={controlWithoutLabel(
            `#/properties/${encode(propName)}`,
            cellOptions
          )}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      ) : (
        <DispatchCell
          schema={schema}
          uischema={controlWithoutLabel('#', cellOptions)}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      )}
    </CellFrame>
  );
};

export default DataCell;
