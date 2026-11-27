import { ControlProps } from '@jsonforms/core';
import {
  ClearValueButton,
  InputShell,
  makeId,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { extendedMaskTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { Input } from '@jsonforms-react-shadcn-ui/input';

import React, { useRef, useCallback } from 'react';
import { useMaskedInput } from '@chobantonov/jsonforms-react-renderer-common/formats/useMaskedInput';

export const ShadcnMaskControl = React.memo(function ShadcnMaskControl(
  props: ControlProps,
) {
  const { data, enabled, path } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const getInput = useCallback(() => inputRef.current, []);
  const {
    appliedUiSchemaOptions,
    settings,
    display,
    onClear,
    onChange,
    onCompositionStart,
    onCompositionEnd,
  } = useMaskedInput(props, getInput, 'defer');

  if (props.visible === false) return null;
  const id = makeId(path, props.label);
  return (
    <InputShell {...props} id={id}>
      <div className='group relative w-full'>
        <ClearValueButton
          clearable={appliedUiSchemaOptions.clearable !== false}
          data={data}
          enabled={enabled && !props.readonly}
          onClear={onClear}
        />
        <Input
          ref={inputRef}
          value={display}
          onChange={onChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          className='pr-10'
          id={id}
          disabled={!enabled || props.readonly}
          aria-invalid={Boolean(props.errors)}
          autoFocus={appliedUiSchemaOptions.focus}
          style={{ width: '100%' }}
          placeholder={
            appliedUiSchemaOptions.placeholder ??
            (typeof settings?.mask === 'string' ? settings.mask : undefined)
          }
          data-mask-input
        />
      </div>
    </InputShell>
  );
});

export const maskControlTester = extendedMaskTester;
export const MaskControlRenderer = withJsonFormsControlProps(ShadcnMaskControl);
