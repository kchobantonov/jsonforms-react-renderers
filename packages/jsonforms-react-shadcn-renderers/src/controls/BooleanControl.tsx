import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import {
  ControlProps,
  isBooleanControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import React from 'react';
import { InputShell, makeId } from './InputControl';
import { Checkbox } from '@jsonforms-react-shadcn-ui/checkbox';

function BooleanValueLabel({ value }: { value: unknown }) {
  const t = useI18n();
  return (
    <span>
      {typeof value === 'boolean'
        ? t(value ? 'boolean.yes' : 'boolean.no')
        : ''}
    </span>
  );
}

export const ShadcnBooleanControl = ({
  config,
  uischema,
  schema,
  data,
  description,
  enabled,
  errors,
  handleChange,
  label,
  path,
  required,
  readonly,
  visible,
}: ControlProps) => {
  if (!visible) return null;
  const id = makeId(path, label);

  return (
    <InputShell
      path={path}
      schema={schema}
      config={config}
      uischema={uischema}
      id={id}
      label={label}
      required={required}
      description={description}
      errors={errors}
    >
      <label className='shadcn-jsonforms-checkbox'>
        <Checkbox
          className='shadcn-jsonforms-checkbox-control'
          id={id}
          disabled={!enabled || readonly}
          checked={typeof data === 'boolean' ? data : 'indeterminate'}
          onCheckedChange={(checked) => handleChange(path, checked === true)}
        />
        <BooleanValueLabel value={data} />
      </label>
    </InputShell>
  );
};

export const booleanControlTester: RankedTester = rankWith(2, isBooleanControl);
