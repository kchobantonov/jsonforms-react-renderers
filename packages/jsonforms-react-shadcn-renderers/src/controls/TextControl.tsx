import {
  ControlProps,
  isStringControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import {
  ShadcnInputControl,
  InputShell,
  makeId,
  toStringValue,
} from './InputControl';
import { Textarea } from '@jsonforms-react-shadcn-ui/textarea';

export const ShadcnTextControl = (props: ControlProps) => {
  if (!props.visible) return null;
  if (!(props.uischema.options?.multi || props.uischema.options?.multiLine)) {
    return <ShadcnInputControl {...props} type='text' />;
  }
  const id = makeId(props.path, props.label);
  return (
    <InputShell
      {...props}
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={props.errors}
    >
      <Textarea
        id={id}
        maxLength={
          props.uischema.options?.restrict ?? props.config?.restrict
            ? props.schema.maxLength
            : undefined
        }
        value={toStringValue(props.data)}
        disabled={!props.enabled || props.readonly}
        aria-invalid={Boolean(props.errors)}
        aria-describedby={props.errors ? `${id}-errors` : undefined}
        onChange={(event) =>
          props.handleChange(props.path, event.currentTarget.value || undefined)
        }
      />
    </InputShell>
  );
};

export const textControlTester: RankedTester = rankWith(1, isStringControl);
