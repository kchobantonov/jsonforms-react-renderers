import React from 'react';
import { CellProps } from '@jsonforms/core';
import { Input } from '@jsonforms-react-shadcn-ui/input';

export const ShadcnTextCell = ({
  data,
  enabled,
  visible,
  id,
  path,
  handleChange,
  errors,
}: CellProps) =>
  visible === false ? null : (
    <Input
      id={id}
      aria-label={path || 'Value'}
      aria-invalid={Boolean(errors)}
      value={data ?? ''}
      disabled={!enabled}
      onChange={(event) =>
        handleChange(path, event.currentTarget.value || undefined)
      }
    />
  );
