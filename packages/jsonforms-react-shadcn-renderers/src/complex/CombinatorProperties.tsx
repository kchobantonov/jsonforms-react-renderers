import {
  Generate,
  isLayout,
  JsonSchema,
  UISchemaElement,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import React from 'react';

type CombinatorPropertiesProps = {
  schema: JsonSchema;
  combinatorKeyword: 'oneOf' | 'anyOf';
  path: string;
  rootSchema: JsonSchema;
};

export const CombinatorProperties = ({
  schema,
  combinatorKeyword,
  path,
  rootSchema,
}: CombinatorPropertiesProps) => {
  const { [combinatorKeyword]: _combinator, ...otherProperties } =
    schema as Record<string, unknown>;
  const otherSchema = otherProperties as JsonSchema;
  const detailUiSchema: UISchemaElement = Generate.uiSchema(
    otherSchema,
    'VerticalLayout',
    undefined,
    rootSchema
  );

  if (
    !detailUiSchema ||
    !isLayout(detailUiSchema) ||
    detailUiSchema.elements.length === 0
  ) {
    return null;
  }

  return (
    <JsonFormsDispatch
      schema={otherSchema}
      path={path}
      uischema={detailUiSchema}
    />
  );
};
