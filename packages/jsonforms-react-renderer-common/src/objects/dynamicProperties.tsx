import { createDefaultValue, JsonSchema, UPDATE_DATA } from '@jsonforms/core';
import { JsonFormsContext, useJsonForms } from '@jsonforms/react';

import React, { createContext, useContext, useMemo } from 'react';

const DynamicPropertyPath = createContext<string | undefined>(undefined);

export const DynamicPropertyProvider = ({
  path,
  schema,
  rootSchema,
  children,
}: React.PropsWithChildren<{
  path: string;
  schema?: JsonSchema;
  rootSchema?: JsonSchema;
}>) => {
  const parent = useJsonForms();
  const context = useMemo(
    () => ({
      ...parent,
      dispatch: (
        action: Parameters<NonNullable<typeof parent.dispatch>>[0],
      ) => {
        // Protect only this property's own value. Nested fields and the
        // collection's explicit Delete update their respective paths normally.
        if (schema && action.type === UPDATE_DATA && action.path === path) {
          parent.dispatch?.({
            ...action,
            updater: (previous) => {
              const value = action.updater(previous);
              return value === undefined
                ? clearedDynamicPropertyValue(
                    schema,
                    rootSchema ?? schema,
                    previous,
                  )
                : value;
            },
          });
        } else {
          parent.dispatch?.(action);
        }
      },
    }),
    [parent, path, schema, rootSchema],
  );
  return (
    <DynamicPropertyPath.Provider value={path}>
      <JsonFormsContext.Provider value={schema ? context : parent}>
        {children}
      </JsonFormsContext.Provider>
    </DynamicPropertyPath.Provider>
  );
};

/** Only the property itself is protected; its nested fields clear normally. */
export const useDynamicProperty = (path: string): boolean =>
  useContext(DynamicPropertyPath) === path;

export const clearedDynamicPropertyValue = (
  schema: JsonSchema,
  rootSchema: JsonSchema,
  previous?: unknown,
): unknown =>
  schema.type === 'string' || typeof previous === 'string'
    ? ''
    : (createDefaultValue(schema, rootSchema) ?? previous);
