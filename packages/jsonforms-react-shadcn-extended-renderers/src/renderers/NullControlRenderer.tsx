import {
  ControlProps,
  JsonSchema,
  RankedTester,
  and,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  Checkbox,
  InputShell,
  makeId,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import React from 'react';

export const nullControlTester: RankedTester = rankWith(
  2,
  and(
    uiTypeIs('Control'),
    schemaMatches((schema: JsonSchema) => schema.type === 'null')
  )
);

export const ShadcnNullControl = (props: ControlProps) => {
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  return (
    <InputShell id={id} description={props.description} errors={props.errors}>
      <label className='shadcn-jsonforms-checkbox-label' htmlFor={id}>
        <Checkbox
          className='shadcn-jsonforms-checkbox-control'
          id={id}
          checked={props.data === null ? true : 'indeterminate'}
          disabled={!props.enabled}
          onCheckedChange={(checked) =>
            props.handleChange(props.path, checked ? null : undefined)
          }
        />
        <span>
          {props.label}
          {props.required ? ' *' : ''}
        </span>
      </label>
    </InputShell>
  );
};

export const NullControlRenderer = withJsonFormsControlProps(ShadcnNullControl);
