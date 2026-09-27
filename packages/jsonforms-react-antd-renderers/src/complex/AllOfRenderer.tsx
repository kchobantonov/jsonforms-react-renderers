import React from 'react';

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
import CombinatorProperties from './CombinatorProperties';

export const AllOfRenderer = ({
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

  /*
    Section 18: "The enclosing properties followed by all branch forms in
    schema order". The enclosing properties were not rendered at all, so a
    property declared beside an `allOf` - `make` beside the VIN and condition
    branches - simply had no input anywhere on the form.
  */
  return (
    <>
      <CombinatorProperties
        schema={schema}
        combinatorKeyword='allOf'
        path={path}
        rootSchema={rootSchema}
      />
      {allOfRenderInfos.map((allOfRenderInfo, allOfIndex) => (
        <JsonFormsDispatch
          key={allOfIndex}
          schema={allOfRenderInfo.schema}
          uischema={allOfRenderInfo.uischema}
          path={path}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </>
  );
};

export const allOfControlTester: RankedTester = rankWith(3, isAllOfControl);

export default withJsonFormsAllOfProps(AllOfRenderer);
