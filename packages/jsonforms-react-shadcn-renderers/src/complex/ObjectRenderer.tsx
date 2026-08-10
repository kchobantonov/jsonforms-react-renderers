import {
  ControlProps,
  findUISchema,
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
        () =>
          Generate.uiSchema(
            schema,
            path ? 'Group' : 'VerticalLayout',
            undefined,
            rootSchema
          ),
        uischema,
        rootSchema
      ),
    [path, rootSchema, schema, uischema, uischemas]
  ) as any;
  if (!visible) return null;

  return (
    <div className='shadcn-jsonforms-object'>
      {label && path ? <h3>{label}</h3> : null}
      <JsonFormsDispatch
        visible={visible}
        enabled={enabled}
        schema={schema}
        uischema={detailUiSchema}
        path={path}
        renderers={renderers}
        cells={cells}
        readonly={readonly}
      />
      <AdditionalProperties
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
    </div>
  );
};

export const objectControlTester: RankedTester = rankWith(2, isObjectControl);
