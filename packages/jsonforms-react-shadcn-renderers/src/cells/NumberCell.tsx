import { ClearValueButton } from '../components/ClearValueButton';
import React from 'react';
import { CellProps } from '@jsonforms/core';
import { Input } from '@jsonforms-react-shadcn-ui/input';

export const ShadcnNumberCell = ({
  config,
  uischema,
  data,
  enabled,
  visible,
  id,
  path,
  handleChange,
  errors,
  schema,
}: CellProps) =>
  visible === false ? null : (
    <div className='group relative w-full'>
    <Input
      className='pr-10'
      id={id}
      type='number'
      step={schema.type === 'integer' ? 1 : 'any'}
      aria-label={path || 'Value'}
      aria-invalid={Boolean(errors)}
      value={data ?? ''}
      disabled={!enabled}
      onChange={(event) => {
        const value = event.currentTarget.value;
        handleChange(
          path,
          value === ''
            ? undefined
            : schema.type === 'integer'
            ? Math.trunc(Number(value))
            : Number(value)
        );
      }}
    />
    <ClearValueButton clearable={uischema.options?.clearable ?? config?.clearable ?? true}
      data={data} enabled={enabled} onClear={() => handleChange(path, undefined)} />
    </div>
  );
