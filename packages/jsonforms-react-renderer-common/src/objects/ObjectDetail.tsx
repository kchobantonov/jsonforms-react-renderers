import React, { useMemo } from 'react';
import {
  isObjectControl,
  type RankedTester,
  type ControlProps,
  type UISchemaElement,
} from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
import { ObjectErrorContext } from '../validation/errorSummary';
import {
  useConditionalFields,
  conditionalFieldsEnabled,
  hasConditionalFields,
} from './conditionalFields';

export const ObjectDetailContext = React.createContext<
  { uischema: UISchemaElement; additional: React.ReactNode } | undefined
>(undefined);

export function useObjectSchema({
  schema: originalSchema,
  rootSchema,
  data,
  uischema,
  config,
}: ControlProps) {
  const jsonforms = useJsonForms();
  const uischemas = useMemo(
    () => jsonforms.uischemas ?? [],
    [jsonforms.uischemas],
  );
  const conditional = useConditionalFields(
    originalSchema,
    rootSchema,
    data,
    uischema,
    config,
  );
  const schema = conditional.schema;
  const additionalSchema = {
    ...schema,
    properties: {
      ...Object.fromEntries([...conditional.known].map((key) => [key, {}])),
      ...schema.properties,
    },
  } as ControlProps['schema'];
  return { uischemas, conditional, schema, additionalSchema };
}

export function ObjectDetail({
  props,
  schema,
  uischema,
  diagnostics,
  errors,
  additional,
}: {
  props: ControlProps;
  schema: ControlProps['schema'];
  uischema: UISchemaElement;
  diagnostics: readonly string[];
  errors: string;
  additional: React.ReactNode;
}) {
  const elements = (uischema as { elements?: unknown[] }).elements;
  const showContent =
    uischema.type === 'Group' ||
    !Array.isArray(elements) ||
    elements.length > 0;
  return (
    <>
      {diagnostics.map((message) => (
        <div key={message} role='alert'>
          {message}
        </div>
      ))}
      <ObjectErrorContext.Provider value={{ uischema, message: errors }}>
        <ObjectDetailContext.Provider value={{ uischema, additional }}>
          {showContent && (
            <JsonFormsDispatch
              visible={props.visible}
              enabled={props.enabled}
              schema={schema}
              uischema={uischema}
              path={props.path}
              renderers={props.renderers}
              cells={props.cells}
              readonly={props.readonly}
            />
          )}
        </ObjectDetailContext.Provider>
      </ObjectErrorContext.Provider>
    </>
  );
}

export const objectControlTester: RankedTester = (ui, schema, context) =>
  isObjectControl(ui, schema, context)
    ? conditionalFieldsEnabled(ui, context.config) &&
      hasConditionalFields(schema)
      ? 25
      : 2
    : -1;
