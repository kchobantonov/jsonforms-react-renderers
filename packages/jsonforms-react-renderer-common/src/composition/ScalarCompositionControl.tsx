import React from 'react';
import type { ControlProps } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { useScalarComposition } from './useScalarComposition';
export const ScalarCompositionControl = (
  props: ControlProps & {
    errorClassName: string;
    errorStyle: React.CSSProperties;
  },
) => {
  const { delegated, delegatedSchema, message } = useScalarComposition(props);
  if (props.visible === false) return null;
  return (
    <>
      <JsonFormsDispatch
        uischema={delegated as any}
        schema={delegatedSchema}
        path={props.path}
        renderers={props.renderers}
        cells={props.cells}
      />
      {message ? (
        <div
          role='alert'
          data-composition-error
          className={props.errorClassName}
          style={props.errorStyle}
        >
          {message}
        </div>
      ) : null}
    </>
  );
};
