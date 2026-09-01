import {
  ControlProps,
  findUISchema,
  Generate,
  isObjectControl,
  rankWith,
  RankedTester,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import React, { useMemo } from 'react';
import { MuiAdditionalProperties } from './additionalProperties/MuiAdditionalProperties';

export const MuiAdditionalPropertiesObjectRendererComponent = ({
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
  const context = useJsonForms();
  const uischemas = context.uischemas ?? [];
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
  );

  if (!visible) return null;

  return (
    <>
      <JsonFormsDispatch
        cells={cells}
        enabled={enabled}
        path={path}
        readonly={readonly}
        renderers={renderers}
        schema={schema}
        uischema={detailUiSchema}
        visible={visible}
      />
      <MuiAdditionalProperties
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
      />
    </>
  );
};

export const muiAdditionalPropertiesObjectTester: RankedTester = rankWith(
  3,
  isObjectControl
);

export const MuiAdditionalPropertiesObjectRenderer = withJsonFormsControlProps(
  MuiAdditionalPropertiesObjectRendererComponent
);
