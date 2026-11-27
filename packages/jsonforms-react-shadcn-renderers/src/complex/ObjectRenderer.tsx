import { useDynamicTreeResolver } from '@chobantonov/jsonforms-react-renderer-common/dynamic/DynamicUiProvider';
import { conditionalLayout } from '@chobantonov/jsonforms-react-renderer-common/objects/conditionalFields';
import { findDetailUISchema as findUISchema } from '@chobantonov/jsonforms-react-renderer-common/core/detailUiSchema';
import {
  ObjectDetail,
  useObjectSchema,
} from '@chobantonov/jsonforms-react-renderer-common/objects/ObjectDetail';
export { objectControlTester } from '@chobantonov/jsonforms-react-renderer-common/objects/ObjectDetail';
import { ErrorIndicator } from './ErrorIndicator';
import { usePathErrorIndicator } from '@chobantonov/jsonforms-react-renderer-common/validation/errorSummary';
import { ControlProps, Generate } from '@jsonforms/core';

import React, { useMemo } from 'react';
import { AdditionalProperties } from './AdditionalProperties';

export const ShadcnObjectRenderer = (props: ControlProps) => {
  const { path, visible, label, rootSchema, uischema } = props;
  const { uischemas, conditional, schema, additionalSchema } =
    useObjectSchema(props);
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
            rootSchema,
          ),
          ...(path
            ? { label: uischema.label === false ? undefined : label }
            : {}),
        }),
        uischema,
        rootSchema,
      ),
    [path, rootSchema, schema, uischema, uischemas, label],
  ) as any;
  const resolveTree = useDynamicTreeResolver(path);
  const dispatchUiSchema = conditionalLayout(
    resolveTree(detailUiSchema),
    schema,
    conditional.known,
  ) as any;
  const objectErrors = usePathErrorIndicator(path, undefined, false);
  if (!visible) return null;
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
    <ObjectDetail
      props={props}
      schema={schema}
      uischema={dispatchUiSchema}
      diagnostics={conditional.diagnostics}
      errors={objectErrors}
      additional={additional}
    />
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
