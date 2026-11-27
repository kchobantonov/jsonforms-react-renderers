import { useTupleControl } from '@chobantonov/jsonforms-react-renderer-common/tuple/useTupleControl';
import {
  connectTupleControl,
  TupleControlContent,
  type TupleControlProps,
} from '@chobantonov/jsonforms-react-renderer-common/tuple/TupleControlContent';
import React from 'react';
import type { RankedTester } from '@jsonforms/core';
import { InputShell } from '../controls/InputControl';
import { tupleControlTester } from '@chobantonov/jsonforms-react-renderer-common/tuple/tupleSchema';
import { TupleAdditionalItems } from './TupleAdditionalItems';
import { TupleField } from './TupleField';

export const tupleControlRendererTester: RankedTester = tupleControlTester;

export const TupleControl = (props: TupleControlProps) => {
  const { label, required, visible } = props;
  const model = useTupleControl(props);
  const { options, shownErrors } = model;
  if (!visible) return null;
  const content = (
    <TupleControlContent
      props={props}
      model={model}
      TupleField={TupleField}
      TupleAdditionalItems={TupleAdditionalItems}
      gap={16}
      diagnostic={(message) => (
        <span className='text-destructive' role='alert' data-tuple-diagnostic>
          {message}
        </span>
      )}
    />
  );
  return (
    <InputShell
      {...props}
      id={props.id}
      label={label}
      required={required}
      errors={shownErrors || undefined}
    >
      {options.showBorder === false ? (
        <div data-tuple-control>{content}</div>
      ) : (
        <div data-tuple-control className='rounded-md border p-3'>
          {content}
        </div>
      )}
    </InputShell>
  );
};

export const TupleControlRenderer = connectTupleControl(TupleControl);
