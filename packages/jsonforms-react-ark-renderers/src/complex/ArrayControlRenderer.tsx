/// <reference path='../ark-ui-react-factory.d.ts' />

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
import { ark } from '@ark-ui/react/factory';
import React from 'react';

export const ArkArrayRenderer = ({
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
    <ark.div className='ark-jsonforms-array'>
      <ark.div className='ark-jsonforms-array-header'>
        <ark.h3>{label}</ark.h3>
        <ark.button
          className='ark-jsonforms-button'
          type='button'
          disabled={!enabled}
          onClick={addItem(path, itemSchema)}
        >
          Add
        </ark.button>
      </ark.div>
      {items.map((_item, index) => {
        const childPath = composePaths(path, `${index}`);
        return (
          <ark.div className='ark-jsonforms-array-item' key={childPath}>
            <JsonFormsDispatch
              schema={itemSchema as any}
              uischema={detail}
              path={childPath}
              enabled={enabled}
              renderers={renderers}
              cells={cells}
            />
            <ark.button
              className='ark-jsonforms-button ark-jsonforms-button-danger'
              type='button'
              disabled={!enabled}
              onClick={removeItems(path, [index])}
            >
              Remove
            </ark.button>
          </ark.div>
        );
      })}
    </ark.div>
  );
};

export const arrayControlTester: RankedTester = rankWith(
  3,
  or(isObjectArrayControl, isPrimitiveArrayControl)
);
