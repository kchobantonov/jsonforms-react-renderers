import { ClearValueButton } from '../components/ClearValueButton';
import React from 'react';
import { CellProps } from '@jsonforms/core';
import { Input } from '@jsonforms-react-shadcn-ui/input';

export const ShadcnTextCell = ({
  config,
  uischema,
  data,
  enabled,
  visible,
  id,
  path,
  handleChange,
  errors,
}: CellProps) =>
  visible === false ? null : (
    <div className='group relative w-full'>
      <Input
        className='pr-10'
        id={id}
        aria-label={path || 'Value'}
        aria-invalid={Boolean(errors)}
        value={data ?? ''}
        disabled={!enabled}
        onChange={(event) =>
          handleChange(path, event.currentTarget.value || undefined)
        }
      />
      <ClearValueButton
        clearable={uischema.options?.clearable ?? config?.clearable ?? true}
        data={data}
        enabled={enabled}
        onClear={() => handleChange(path, undefined)}
      />
    </div>
  );
