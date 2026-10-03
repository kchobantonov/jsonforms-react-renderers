import {
  useConditionalFields,
  conditionalLayout,
  conditionalFieldsEnabled,
  hasConditionalFields,
} from '@chobantonov/jsonforms-react-renderer-common/conditionalFields';
import { findDetailUISchema as findUISchema } from '@chobantonov/jsonforms-react-renderer-common/detail';
import { ValidationIcon } from './ValidationIcon';
import { ObjectDetailContext } from './ObjectDetailContext';
import { Card, Typography } from 'antd';
import {
  ObjectErrorContext,
  usePathErrorIndicator,
} from '@chobantonov/jsonforms-react-renderer-common/errorSummary';
import isEmpty from 'lodash/isEmpty';
import {
  ControlProps,
  JsonSchema,
  Generate,
  isObjectControl,
  RankedTester,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import React, { useMemo } from 'react';
import { AdditionalProperties } from './AdditionalProperties';
import {
  UiSchemaCycleProvider,
  useUiSchemaCycleGuard,
} from '../util/uiSchemaCycle';

export const ObjectRenderer = ({
  renderers,
  cells,
  schema: originalSchema,
  label,
  path,
  visible,
  enabled,
  uischema,
  rootSchema,
  data,
  handleChange,
  config,
  readonly,
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

  /*
    The layout this renderer would draw with no registry entry at all. Named,
    rather than inlined into `findUISchema`, because the cycle guard below
    needs the same thing when it refuses what the registry returned.
  */
  const generated = useMemo(
    () =>
      isEmpty(path)
        ? Generate.uiSchema(schema, 'VerticalLayout', undefined, rootSchema)
        : {
            ...Generate.uiSchema(schema, 'Group', undefined, rootSchema),
            label,
          },
    [schema, path, label, rootSchema]
  );

  const detailUiSchema = useMemo(
    () =>
      findUISchema(
        uischemas,
        schema,
        uischema.scope,
        path,
        () => generated,
        uischema,
        rootSchema
      ),
    [uischemas, schema, uischema.scope, path, generated, uischema, rootSchema]
  );
  /*
    A registry entry that is a Control matching this object's schema resolves
    to itself: dispatching it selects this renderer again, which asks the
    registry the same question. Nothing throws - React builds the tree until
    the heap runs out - so the guard has to notice rather than catch.
  */
  const { cycle, stack } = useUiSchemaCycleGuard(
    detailUiSchema,
    path,
    'the object renderer'
  );
  const dispatchUiSchema = conditionalLayout(
    cycle ? generated : detailUiSchema,
    schema,
    conditional.known
  );
  const objectErrors = usePathErrorIndicator(path, undefined, false);
  if (!visible) {
    return null;
  }

  const additional = (
    <AdditionalProperties
      embedded={Boolean(path) || dispatchUiSchema.type === 'Group'}
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
  const isGroup = dispatchUiSchema.type === 'Group';
  const emptyLayout =
    Array.isArray((dispatchUiSchema as any).elements) &&
    (dispatchUiSchema as any).elements.length === 0;
  const detailContent = (
    <ObjectErrorContext.Provider
      value={{ uischema: dispatchUiSchema, message: objectErrors }}
    >
      <ObjectDetailContext.Provider
        value={{ uischema: dispatchUiSchema, additional }}
      >
        <UiSchemaCycleProvider stack={stack}>
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
        </UiSchemaCycleProvider>
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
  const content = (
    <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      {!title && objectErrors && (
        <Typography.Text type='danger' role='alert'>
          {objectErrors}
        </Typography.Text>
      )}
      {detail}
      {additional}
    </div>
  );
  return path ? (
    <Card
      className='jsonforms-object'
      title={title}
      extra={
        title && objectErrors ? (
          <ValidationIcon
            local
            errorMessages={objectErrors}
            id={`${path}-object-errors`}
          />
        ) : undefined
      }
    >
      {content}
    </Card>
  ) : (
    content
  );
};

export const objectControlTester: RankedTester = (ui, schema, context) =>
  isObjectControl(ui, schema, context)
    ? conditionalFieldsEnabled(ui, context.config) &&
      hasConditionalFields(schema)
      ? 25
      : 2
    : -1;

export default withJsonFormsControlProps(ObjectRenderer);
