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
import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import { Slider } from 'antd';
import merge from 'lodash/merge';

export const AntdSlider = React.memo(function AntdSlider(
  props: CellProps &
    WithClassname & { inputProps?: React.ComponentProps<typeof Slider> }
) {
  const {
    data,
    id,
    enabled,
    uischema,
    path,
    handleChange,
    config,
    schema,
    inputProps,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const sliderStyle: { [x: string]: any } = {
    marginTop: '7px',
  };

  const marks = {
    [schema.minimum!]: schema.minimum,
    [schema.maximum!]: schema.maximum,
  };

  return (
    <Slider
      id={id}
      style={sliderStyle}
      min={schema.minimum}
      max={schema.maximum}
      marks={marks}
      value={Number(data || schema.default) as any}
      onChange={(value: any) => {
        handleChange(path, Number(value));
      }}
      disabled={!enabled}
      step={schema.multipleOf || 1}
      autoFocus={!!appliedUiSchemaOptions.focus}
      {...inputProps}
    ></Slider>
  );
});
