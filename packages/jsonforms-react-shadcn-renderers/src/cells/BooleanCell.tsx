import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
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
}: CellProps) => {
  const t = useI18n();
  return visible === false ? null : (
    <Checkbox
      id={id}
      aria-label={path || t('control.value')}
      aria-invalid={Boolean(errors)}
      checked={typeof data === 'boolean' ? data : 'indeterminate'}
      disabled={!enabled}
      onCheckedChange={(checked) => handleChange(path, checked === true)}
    />
  );
};
