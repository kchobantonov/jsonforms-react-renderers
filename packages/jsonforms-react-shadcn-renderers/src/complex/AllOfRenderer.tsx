import {
  createCombinatorRenderInfos,
  findMatchingUISchema,
  isAllOfControl,
  JsonSchema,
  RankedTester,
  rankWith,
  StatePropsOfCombinator,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsAllOfProps } from '@jsonforms/react';
import React from 'react';

export const ShadcnAllOfRenderer = ({
  schema,
  rootSchema,
  visible,
  renderers,
  cells,
  path,
  uischemas,
  uischema,
}: StatePropsOfCombinator) => {
  const delegateUISchema = findMatchingUISchema(uischemas)(
    schema,
    uischema.scope,
    path
  );

  if (!visible) {
    return null;
  }

  if (delegateUISchema) {
    return (
      <JsonFormsDispatch
        schema={schema}
        uischema={delegateUISchema}
        path={path}
        renderers={renderers}
        cells={cells}
      />
    );
  }

  const allOfRenderInfos = createCombinatorRenderInfos(
    (schema as JsonSchema).allOf,
    rootSchema,
    'allOf',
    uischema,
    path,
    uischemas
  );

  return (
    <>
      {allOfRenderInfos.map((renderInfo, index) => (
        <JsonFormsDispatch
          key={index}
          schema={renderInfo.schema}
          uischema={renderInfo.uischema}
          path={path}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </>
  );
};

export const allOfControlTester: RankedTester = rankWith(3, isAllOfControl);

export const ShadcnAllOfControl = withJsonFormsAllOfProps(ShadcnAllOfRenderer);
