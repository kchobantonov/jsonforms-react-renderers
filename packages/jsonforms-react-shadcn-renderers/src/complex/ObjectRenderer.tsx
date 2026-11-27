import React from 'react';
import {
  createObjectRenderer,
  type ObjectFrameProps,
} from '@chobantonov/jsonforms-react-renderer-common/objects/ObjectDetail';
export { objectControlTester } from '@chobantonov/jsonforms-react-renderer-common/objects/ObjectDetail';
import { ErrorIndicator } from './ErrorIndicator';
import { AdditionalProperties } from './AdditionalProperties';

const ObjectFrame = ({
  path,
  title,
  errors,
  detail,
  additional,
}: ObjectFrameProps) => {
  return (
    <div className={path ? 'shadcn-jsonforms-object' : undefined}>
      {title && (
        <div className='flex items-center gap-1'>
          <h3>{title}</h3>
          {errors && <ErrorIndicator local errors={errors} />}
        </div>
      )}
      {!title && errors && (
        <div
          role='alert'
          className='text-sm text-destructive whitespace-pre-line'
        >
          {errors}
        </div>
      )}
      {detail}
      {additional}
    </div>
  );
};

export const ShadcnObjectRenderer = createObjectRenderer(
  AdditionalProperties,
  ObjectFrame,
  true,
);
