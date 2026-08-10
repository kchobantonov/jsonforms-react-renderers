import {
  ArrayLayoutProps,
  composePaths,
  Generate,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import React from 'react';

export const ShadcnArrayRenderer = ({
  addItem,
  cells,
  data,
  enabled,
  label,
  path,
  removeItems,
  renderers,
  schema,
  uischema,
  visible,
}: ArrayLayoutProps) => {
  const items = Array.isArray(data) ? data : [];
  if (!visible) return null;
  const itemSchema = Array.isArray(schema.items)
    ? schema.items[0]
    : schema.items;
  const detail =
    (uischema.options?.detail as any) ??
    Generate.uiSchema(itemSchema as any, 'VerticalLayout', undefined, schema);

  return (
    <div className='shadcn-jsonforms-array'>
      <div className='shadcn-jsonforms-array-header'>
        <h3>{label}</h3>
        <button
          className='shadcn-jsonforms-button'
          type='button'
          disabled={!enabled}
          onClick={addItem(path, itemSchema)}
        >
          Add
        </button>
      </div>
      {items.map((_item, index) => {
        const childPath = composePaths(path, `${index}`);
        return (
          <div className='shadcn-jsonforms-array-item' key={childPath}>
            <JsonFormsDispatch
              schema={itemSchema as any}
              uischema={detail}
              path={childPath}
              enabled={enabled}
              renderers={renderers}
              cells={cells}
            />
            <button
              className='shadcn-jsonforms-button shadcn-jsonforms-button-danger'
              type='button'
              disabled={!enabled}
              onClick={removeItems(path, [index])}
            >
              Remove
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const arrayControlTester: RankedTester = rankWith(
  3,
  or(isObjectArrayControl, isPrimitiveArrayControl)
);
