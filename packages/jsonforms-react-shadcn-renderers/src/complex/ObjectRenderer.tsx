import {
  useConditionalFields,
  conditionalLayout,
  conditionalFieldsEnabled,
  hasConditionalFields,
} from '@chobantonov/jsonforms-react-renderer-common/conditionalFields';
import { findDetailUISchema as findUISchema } from '@chobantonov/jsonforms-react-renderer-common/detail';
import { ObjectDetailContext } from './ObjectDetailContext';
import { ErrorIndicator } from './ErrorIndicator';
import {
  ObjectErrorContext,
  usePathErrorIndicator,
} from '@chobantonov/jsonforms-react-renderer-common/errorSummary';
import {
  ControlProps,
  JsonSchema,
  Generate,
  isObjectControl,
  RankedTester,
} from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
import React, { useMemo } from 'react';
import { AdditionalProperties } from './AdditionalProperties';

export const ShadcnObjectRenderer = ({
  cells,
  config,
  data,
  enabled,
  handleChange,
  label,
  path,
  readonly,
  renderers,
  rootSchema,
  schema: originalSchema,
  uischema,
  visible,
}: ControlProps) => {
  const jsonforms = useJsonForms();
  const uischemas = jsonforms.uischemas ?? [];
  const conditional = useConditionalFields(
    originalSchema,
    rootSchema,
    data,
    uischema,
    config
  );
  const schema = conditional.schema;
  const detailUiSchema = useMemo(
    () =>
      findUISchema(
        uischemas,
        schema,
        uischema.scope,
        path,
        () => ({
          ...Generate.uiSchema(
            schema,
            path ? 'Group' : 'VerticalLayout',
            undefined,
            rootSchema
          ),
          ...(path
            ? { label: uischema.label === false ? undefined : label }
            : {}),
        }),
        uischema,
        rootSchema
      ),
    [path, rootSchema, schema, uischema, uischemas, label]
  ) as any;
  const dispatchUiSchema = conditionalLayout(
    detailUiSchema,
    schema,
    conditional.known
  ) as any;
  const isGroup = dispatchUiSchema.type === 'Group';
  const emptyLayout =
    Array.isArray(dispatchUiSchema.elements) &&
    dispatchUiSchema.elements.length === 0;
  const objectErrors = usePathErrorIndicator(path, undefined, false);
  if (!visible) return null;
  const additional = (
    <AdditionalProperties
      embedded={Boolean(path) || isGroup}
      cells={cells}
      config={config}
      data={data}
      enabled={enabled}
      handleChange={handleChange}
      label={label}
      path={path}
      readonly={readonly}
      renderers={renderers}
      rootSchema={rootSchema}
      schema={
        {
          ...schema,
          properties: {
            ...Object.fromEntries(
              [...conditional.known].map((key) => [key, {}])
            ),
            ...schema.properties,
          },
        } as JsonSchema
      }
      uischema={uischema}
      uischemas={uischemas}
    />
  );
  const detailContent = (
    <ObjectErrorContext.Provider
      value={{ uischema: dispatchUiSchema, message: objectErrors }}
    >
      <ObjectDetailContext.Provider
        value={{ uischema: dispatchUiSchema, additional }}
      >
        {(isGroup || !emptyLayout) && (
          <JsonFormsDispatch
            visible={visible}
            enabled={enabled}
            schema={schema}
            uischema={dispatchUiSchema}
            path={path}
            renderers={renderers}
            cells={cells}
            readonly={readonly}
          />
        )}
      </ObjectDetailContext.Provider>
    </ObjectErrorContext.Provider>
  );
  const detail = (
    <>
      {conditional.diagnostics.map((message) => (
        <div key={message} role='alert'>
          {message}
        </div>
      ))}
      {detailContent}
    </>
  );
  if (isGroup) return detail;
  const title = label && path && uischema.label !== false ? label : undefined;
  return (
    <div className={path ? 'shadcn-jsonforms-object' : undefined}>
      {title && (
        <div className='flex items-center gap-1'>
          <h3>{title}</h3>
          {objectErrors && <ErrorIndicator local errors={objectErrors} />}
        </div>
      )}
      {!title && objectErrors && (
        <div
          role='alert'
          className='text-sm text-destructive whitespace-pre-line'
        >
          {objectErrors}
        </div>
      )}
      {detail}
      {additional}
    </div>
  );
};

export const objectControlTester: RankedTester = (ui, schema, context) =>
  isObjectControl(ui, schema, context)
    ? conditionalFieldsEnabled(ui, context.config) &&
      hasConditionalFields(schema)
      ? 25
      : 2
    : -1;
