import React from 'react';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
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
  const t = useI18n();
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  const committed = typeof props.data === 'boolean';
  const stateId = `${id}-state`;
  return (
    <InputShell
      {...props}
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
        aria-describedby={
          [
            props.errors ? `${id}-errors` : undefined,
            committed ? undefined : stateId,
          ]
            .filter(Boolean)
            .join(' ') || undefined
        }
        onCheckedChange={(checked) => props.handleChange(props.path, checked)}
      />
      {!committed && (
        <span id={stateId} className='sr-only'>
          {t(
            props.data === undefined || props.data === null
              ? 'boolean.notSet'
              : 'boolean.invalid',
          )}
        </span>
      )}
    </InputShell>
  );
};
export const booleanToggleControlTester = rankWith(
  3,
  and(isBooleanControl, optionIs('toggle', true)),
);
