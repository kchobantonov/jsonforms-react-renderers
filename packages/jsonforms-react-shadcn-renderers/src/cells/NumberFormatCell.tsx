import { ShadcnNumberCell } from './NumberCell';
import React from 'react';
import {
  CellProps,
  Formatted,
  isNumberFormatControl,
  rankWith,
} from '@jsonforms/core';
import { Input } from '@jsonforms-react-shadcn-ui/input';
import { Textarea } from '@jsonforms-react-shadcn-ui/textarea';
import { ClearValueButton } from '../components/ClearValueButton';
export const numberFormatCellTester = rankWith(4, isNumberFormatControl);
export const ShadcnNumberFormatCell = (
  props: CellProps & Partial<Formatted<number>>,
) => {
  if (props.visible === false) return null;
  const { toFormatted, fromFormatted } = props;
  if (!toFormatted || !fromFormatted) return <ShadcnNumberCell {...props} />;
  const options = { ...props.config, ...props.uischema.options };
  const Component = options.multi ? Textarea : Input;
  return (
    <div className='group relative w-full'>
      <Component
        id={props.id}
        className='pr-10'
        disabled={!props.enabled}
        value={toFormatted(props.data)}
        aria-invalid={Boolean(props.errors)}
        autoFocus={options.focus}
        placeholder={options.placeholder}
        maxLength={props.schema.maxLength}
        onChange={(event) =>
          props.handleChange(
            props.path,
            fromFormatted(event.currentTarget.value),
          )
        }
      />
      <ClearValueButton
        data={props.data}
        enabled={props.enabled}
        clearable={options.clearable !== false}
        onClear={() => props.handleChange(props.path, undefined)}
      />
    </div>
  );
};
