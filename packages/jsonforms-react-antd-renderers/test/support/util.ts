import { createAjv, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { JsonFormsReactProps, useJsonForms } from '@jsonforms/react';
import React from 'react';

export const initCore = (
  schema: JsonSchema,
  uischema: UISchemaElement,
  data?: any,
) => {
  return { schema, uischema, data, ajv: createAjv() };
};

export const TestEmitter: React.FC<JsonFormsReactProps> = ({ onChange }) => {
  const ctx = useJsonForms();
  const { data, errors } = ctx.core;
  React.useEffect(() => {
    onChange({ data, errors });
  }, [data, errors, onChange]);
  return null;
};
