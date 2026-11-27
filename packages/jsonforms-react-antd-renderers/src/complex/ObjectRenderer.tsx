import { useDynamicTreeResolver } from '@chobantonov/jsonforms-react-renderer-common/dynamic/DynamicUiProvider';
import { conditionalLayout } from '@chobantonov/jsonforms-react-renderer-common/objects/conditionalFields';
import { findDetailUISchema as findUISchema } from '@chobantonov/jsonforms-react-renderer-common/core/detailUiSchema';
import { ValidationIcon } from './ValidationIcon';
import {
  ObjectDetail,
  useObjectSchema,
} from '@chobantonov/jsonforms-react-renderer-common/objects/ObjectDetail';
export { objectControlTester } from '@chobantonov/jsonforms-react-renderer-common/objects/ObjectDetail';
import { Card, Typography } from 'antd';
import { usePathErrorIndicator } from '@chobantonov/jsonforms-react-renderer-common/validation/errorSummary';
import isEmpty from 'lodash/isEmpty';
import { ControlProps, Generate } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import React, { useMemo } from 'react';
import { AdditionalProperties } from './AdditionalProperties';
import {
  UiSchemaCycleProvider,
  useUiSchemaCycleGuard,
} from '../util/uiSchemaCycle';

export const ObjectRenderer = (props: ControlProps) => {
  const { path, visible, label, rootSchema, uischema } = props;
  const { uischemas, conditional, schema, additionalSchema } =
    useObjectSchema(props);

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
    [schema, path, label, rootSchema],
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
        rootSchema,
      ),
    [uischemas, schema, path, generated, uischema, rootSchema],
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
    'the object renderer',
  );
  const resolveTree = useDynamicTreeResolver(path);
  const dispatchUiSchema = conditionalLayout(
    resolveTree(cycle ? generated : detailUiSchema),
    schema,
    conditional.known,
  );
  const objectErrors = usePathErrorIndicator(path, undefined, false);
  if (!visible) {
    return null;
  }

  const isGroup = dispatchUiSchema.type === 'Group';
  const additional = (
    <AdditionalProperties
      {...props}
      embedded={Boolean(path) || isGroup}
      schema={additionalSchema}
      uischemas={uischemas}
    />
  );
  const detail = (
    <UiSchemaCycleProvider stack={stack}>
      <ObjectDetail
        props={props}
        schema={schema}
        uischema={dispatchUiSchema}
        diagnostics={conditional.diagnostics}
        errors={objectErrors}
        additional={additional}
      />
    </UiSchemaCycleProvider>
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

export default withJsonFormsControlProps(ObjectRenderer);
