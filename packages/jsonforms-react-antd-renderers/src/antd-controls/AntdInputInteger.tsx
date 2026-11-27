import React from 'react';
import {
  AntdNumericInput,
  type AntdNumericInputProps,
} from './AntdNumericInput';

export const AntdInputInteger: React.NamedExoticComponent<AntdNumericInputProps> =
  React.memo(function AntdInputInteger(props: AntdNumericInputProps) {
    return <AntdNumericInput {...props} integerOnly />;
  });
