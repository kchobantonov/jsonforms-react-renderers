/*
  The MIT License

  Copyright (c) 2017-2019 EclipseSource Munich
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
import React, { useEffect, useState } from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { Checkbox } from 'primereact/checkbox';
import merge from 'lodash/merge';

type Props = {
  label?: string;
};
export const PrimeCheckbox = React.memo(function PrimeCheckbox(
  props: CellProps &
    WithClassname &
    Props & { inputProps?: React.ComponentProps<typeof TriStateCheckbox> }
) {
  const {
    data,
    className,
    id,
    enabled,
    label,
    uischema,
    path,
    handleChange,
    config,
    errors,
    inputProps,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  // Track if tri-state should be used initially
  const [useTriState, setUseTriState] = useState(
    data === undefined || data === null
  );

  // Update tri-state if data comes in as undefined/null from outside
  useEffect(() => {
    if (data === undefined || data === null) {
      setUseTriState(true);
    }
  }, [data]);

  const onChange = (value: boolean) => {
    // Once user chooses true/false, switch to normal checkbox
    setUseTriState(false);
    handleChange(path, value);
  };

  return (
    <div className='field-checkbox m-0'>
      {useTriState ? (
        <TriStateCheckbox
          value={data}
          onChange={(e: any) => onChange(e.value ?? false)}
          className={className}
          id={id}
          disabled={!enabled}
          autoFocus={!!appliedUiSchemaOptions.focus}
          invalid={!!errors}
          {...inputProps}
        />
      ) : (
        <Checkbox
          checked={!!data}
          onChange={(e) => onChange(e.checked)}
          className={className}
          id={id}
          disabled={!enabled}
          {...inputProps}
        />
      )}
      {label && <label htmlFor={id}>{label}</label>}
    </div>
  );
});
