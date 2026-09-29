import React from 'react';
import {
  ControlProps,
  and,
  isBooleanControl,
  optionIs,
  rankWith,
} from '@jsonforms/core';
import { Switch } from '@jsonforms-react-shadcn-ui/switch';
import { InputShell, makeId } from './InputControl';

export const ShadcnBooleanToggleControl = (props: ControlProps) => {
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  return (
    <InputShell {...props}
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={props.errors}
    >
      <Switch
        id={id}
        checked={props.data === true}
        disabled={!props.enabled || props.readonly}
        aria-invalid={Boolean(props.errors)}
        onCheckedChange={(checked) => props.handleChange(props.path, checked)}
      />
    </InputShell>
  );
};
export const booleanToggleControlTester = rankWith(
  3,
  and(isBooleanControl, optionIs('toggle', true))
);
