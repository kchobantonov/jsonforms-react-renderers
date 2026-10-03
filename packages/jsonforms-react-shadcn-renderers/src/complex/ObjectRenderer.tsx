import { findDetailUISchema as findUISchema } from '@chobantonov/jsonforms-react-renderer-common/detail';
import { ObjectDetailContext } from './ObjectDetailContext';
import { ErrorIndicator } from './ErrorIndicator';
import {
  ObjectErrorContext,
  usePathErrorIndicator,
} from '@chobantonov/jsonforms-react-renderer-common/errorSummary';
import {
  ControlProps,
  Generate,
  isObjectControl,
  RankedTester,
  rankWith,
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
  schema,
  uischema,
  visible,
}: ControlProps) => {
  const jsonforms = useJsonForms();
  const uischemas = jsonforms.uischemas ?? [];
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
  const dispatchUiSchema = detailUiSchema;
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
      schema={schema}
      uischema={uischema}
      uischemas={uischemas}
    />
  );
  const detail = (
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

export const objectControlTester: RankedTester = rankWith(2, isObjectControl);
