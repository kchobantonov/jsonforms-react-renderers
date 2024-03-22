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
import React, { useMemo } from 'react';
import { EnumCellProps, WithClassname } from '@jsonforms/core';

import { Select } from 'antd';
import merge from 'lodash/merge';
import { i18nDefaults } from '../util';
import { TranslateProps } from '@jsonforms/react';

const { Option } = Select;
export const AntdSelect = (
  props: EnumCellProps & WithClassname & TranslateProps
) => {
  const {
    data,
    className,
    id,
    enabled,
    schema,
    uischema,
    path,
    handleChange,
    options,
    config,
    t,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const noneOptionLabel = useMemo(
    () => t('enum.none', i18nDefaults['enum.none'], { schema, uischema, path }),
    [t, schema, uischema, path]
  );

  const selectStyle = appliedUiSchemaOptions.trim ? {} : { width: '100%' };

  return (
    <Select
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      value={data !== undefined ? data : ''}
      onChange={(value) => handleChange(path, value || undefined)}
      style={selectStyle}
    >
      {[
        <Option value={''} key='jsonforms.enum.none'>
          <em>{noneOptionLabel}</em>
        </Option>,
      ].concat(
        options.map((optionValue) => (
          <Option value={optionValue.value} key={optionValue.value}>
            {optionValue.label}
          </Option>
        ))
      )}
    </Select>
  );
};
