import isEmpty from 'lodash/isEmpty';
import {
  ControlProps,
  findUISchema,
  Generate,
  GroupLayout,
  isObjectControl,
  RankedTester,
  rankWith,
  UISchemaElement,
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

const withoutGroupFrame = (uischema: UISchemaElement): UISchemaElement => {
  if (uischema.type !== 'Group') {
    return uischema;
  }

  const { label: _label, ...layout } = uischema as GroupLayout;
  return {
    ...layout,
    type: 'VerticalLayout',
  };
};

export const ObjectRenderer = ({
  renderers,
  cells,
  schema,
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
  const resolved = useMemo(
    () => (isEmpty(path) ? detailUiSchema : withoutGroupFrame(detailUiSchema)),
    [detailUiSchema, path]
  );

  /*
    A registry entry that is a Control matching this object's schema resolves
    to itself: dispatching it selects this renderer again, which asks the
    registry the same question. Nothing throws - React builds the tree until
    the heap runs out - so the guard has to notice rather than catch.
  */
  const { cycle, stack } = useUiSchemaCycleGuard(
    resolved,
    path,
    'the object renderer'
  );
  const dispatchUiSchema = cycle
    ? isEmpty(path)
      ? generated
      : withoutGroupFrame(generated as UISchemaElement)
    : resolved;

  if (!visible) {
    return null;
  }

  return (
    <>
      <UiSchemaCycleProvider stack={stack}>
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
      </UiSchemaCycleProvider>
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
    </>
  );
};

export const objectControlTester: RankedTester = rankWith(2, isObjectControl);

export default withJsonFormsControlProps(ObjectRenderer);
