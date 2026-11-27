import {
  useTranslator,
  useI18n,
} from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import {
  enumToEnumOptionMapper,
  oneOfToEnumOptionMapper,
  getI18nKeyPrefix,
  CellProps,
} from '@jsonforms/core';

import isEqual from 'lodash/isEqual';
import React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jsonforms-react-shadcn-ui/select';

export const ShadcnEnumCell = ({
  data,
  enabled,
  visible,
  id,
  path,
  handleChange,
  errors,
  schema,
  uischema,
}: CellProps) => {
  const t = useI18n();
  const translate = useTranslator();
  if (visible === false) return null;
  const prefix = getI18nKeyPrefix(schema, uischema, path);
  const choices = schema.oneOf?.map((entry) =>
    oneOfToEnumOptionMapper(entry, translate, prefix),
  );
  const values =
    choices?.map((entry) => entry.value) ??
    schema.enum ??
    (Object.prototype.hasOwnProperty.call(schema, 'const')
      ? [schema.const]
      : []);
  const index = values.findIndex((value) => isEqual(value, data));
  return (
    <Select
      value={index < 0 ? '' : `option-${index}`}
      disabled={!enabled}
      onValueChange={(value) =>
        handleChange(path, values[Number(value.replace('option-', ''))])
      }
    >
      <SelectTrigger
        className='w-full min-w-0'
        id={id}
        aria-label={path || t('control.value')}
        aria-invalid={Boolean(errors)}
      >
        <SelectValue placeholder={t('enum.select')} />
      </SelectTrigger>
      <SelectContent>
        {values.map((value, index) => (
          <SelectItem key={index} value={`option-${index}`}>
            {choices?.[index].label ??
              enumToEnumOptionMapper(value, translate, prefix).label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
