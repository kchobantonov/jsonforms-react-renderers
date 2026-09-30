import React from 'react';
import { CellProps } from '@jsonforms/core';
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
}: CellProps) => {
  if (visible === false) return null;
  const choices = schema.oneOf?.map((entry) => ({
    value: entry.const,
    label: entry.title ?? String(entry.const),
  }));
  const values =
    choices?.map((entry) => entry.value) ??
    schema.enum ??
    (Object.prototype.hasOwnProperty.call(schema, 'const')
      ? [schema.const]
      : []);
  const index = values.findIndex((value) => Object.is(value, data));
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
        aria-label={path || 'Value'}
        aria-invalid={Boolean(errors)}
      >
        <SelectValue placeholder='Select...' />
      </SelectTrigger>
      <SelectContent>
        {values.map((value, index) => (
          <SelectItem key={index} value={`option-${index}`}>
            {choices?.[index].label ?? String(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
