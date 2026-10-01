import React, { useMemo } from 'react';
import {
  JsonFormsContext,
  JsonFormsDispatch,
  useJsonForms,
} from '@jsonforms/react';
import { JsonSchema, UISchemaElement, Resolve } from '@jsonforms/core';

export type ItemContext = { readonly item?: unknown };

/** Resolve a source row only when a consumer reads item. Preserve parent getters. */
export const ItemProvider = ({
  path,
  children,
}: React.PropsWithChildren<{ path: string }>) => {
  const parent = useJsonForms();
  const context = useMemo(() => {
    let resolved = false;
    let item: unknown;
    const value = Object.defineProperties(
      {},
      Object.getOwnPropertyDescriptors(parent)
    );
    Object.defineProperty(value, 'item', {
      enumerable: true,
      configurable: true,
      get: () => {
        if (!resolved) {
          item = Resolve.data(parent.core?.data, path);
          resolved = true;
        }
        return item;
      },
    });
    return value;
  }, [parent, path]);
  return (
    <JsonFormsContext.Provider value={context}>
      {children}
    </JsonFormsContext.Provider>
  );
};

export const CellSummary = ({
  schema,
  path,
  uischema,
}: {
  schema: JsonSchema;
  path?: string;
  uischema: UISchemaElement;
}) => (
  <JsonFormsDispatch
    schema={schema}
    uischema={uischema}
    path={path ?? ''}
    enabled={false}
  />
);
