/*
  The MIT License

  Copyright (c) 2017-2021 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import { ControlProps, isDescriptionHidden } from '@jsonforms/core';
import { Message } from 'primereact/message';
import React from 'react';

import merge from 'lodash/merge';
import { PrimeCheckbox } from '../prime-controls/PrimeCheckbox';
import { useFocus } from '../util';

export interface WithInput {
  input: any;
}

export const InputControl = (props: ControlProps & WithInput) => {
  const [focused, onFocus, onBlur] = useFocus();
  const { id, description, errors, label, uischema, visible, config, input } =
    props;
  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  // const firstFormHelperText = showDescription
  //   ? description
  //   : !isValid
  //   ? errors
  //   : null;
  // const secondFormHelperText = showDescription && !isValid ? errors : null;

  const InnerComponent = input;
  const style = !appliedUiSchemaOptions.trim ? { width: '100%' } : {};

  if (!visible) {
    return null;
  }

  return (
    <div className='flex flex-column gap-2' id={id} style={style}>
      <label htmlFor={id + '-input'}>{label}</label>
      <InnerComponent
        {...props}
        label={input === PrimeCheckbox ? ' ' : props.label}
        onFocus={onFocus}
        onBlur={onBlur}
        id={id + '-input'}
        isValid={isValid}
        visible={visible}
        aria-describedby={
          isValid && showDescription ? id + '-input-help' : null
        }
      />
      {!isValid && <Message severity='error' text={errors} />}{' '}
      {isValid && showDescription && (
        <small id={id + '-input-help'}>{description}</small>
      )}
    </div>
  );
};