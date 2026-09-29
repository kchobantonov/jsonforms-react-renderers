import { createDefaultValue, JsonSchema } from '@jsonforms/core';

import React, { createContext, useContext } from 'react';

const DynamicPropertyPath = createContext<string | undefined>(undefined);

export const DynamicPropertyProvider = ({
  path,
  children,
}: React.PropsWithChildren<{ path: string }>) => (
  <DynamicPropertyPath.Provider value={path}>
    {children}
  </DynamicPropertyPath.Provider>
);

/** Only the property itself is protected; its nested fields clear normally. */
export const useDynamicProperty = (path: string): boolean =>
  useContext(DynamicPropertyPath) === path;

export const clearedDynamicPropertyValue = (
  schema: JsonSchema,
  rootSchema: JsonSchema
): unknown => createDefaultValue(schema, rootSchema);
