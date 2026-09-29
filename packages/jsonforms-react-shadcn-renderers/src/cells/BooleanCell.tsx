import React from 'react';
import { CellProps } from '@jsonforms/core';
import { Checkbox } from '@jsonforms-react-shadcn-ui/checkbox';

export const ShadcnBooleanCell = ({
  data,
  enabled,
  visible,
  id,
  path,
  handleChange,
  errors,
}: CellProps) =>
  visible === false ? null : (
    <Checkbox
      id={id}
      aria-label={path || 'Value'}
      aria-invalid={Boolean(errors)}
      checked={typeof data === 'boolean' ? data : 'indeterminate'}
      disabled={!enabled}
      onCheckedChange={(checked) => handleChange(path, checked === true)}
    />
  );
