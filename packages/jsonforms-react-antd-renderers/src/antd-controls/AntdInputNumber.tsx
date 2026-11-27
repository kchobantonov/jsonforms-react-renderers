import React from 'react';
import {
  AntdNumericInput,
  type AntdNumericInputProps,
} from './AntdNumericInput';

export const AntdInputNumber: React.NamedExoticComponent<AntdNumericInputProps> =
  React.memo(function AntdInputNumber(props: AntdNumericInputProps) {
    return <AntdNumericInput {...props} />;
  });
