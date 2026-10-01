import { fileArrayTester } from '@chobantonov/jsonforms-react-renderer-common/FileArrayInput';
import React from 'react';
import {
  and,
  ControlProps,
  isStringControl,
  RankedTester,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import { InputControl } from './InputControl';
import {
  TranslateProps,
  withJsonFormsControlProps,
  withTranslateProps,
} from '@jsonforms/react';
import { AntdFile } from '../antd-controls';

export const FileControl = (props: ControlProps & TranslateProps) => {
  return <InputControl {...props} input={AntdFile} />;
};

export const isBase64String = and(
  uiTypeIs('Control'),
  isStringControl,
  schemaMatches(
    (schema) =>
      (Object.prototype.hasOwnProperty.call(schema, 'contentEncoding') &&
        (schema as any).contentEncoding == 'base64') ||
      schema.format === 'binary' ||
      schema.format === 'byte'
  )
);

const singleFileTester = rankWith(2, isBase64String);
export const fileControlTester: RankedTester = (ui, schema, context) =>
  Math.max(
    singleFileTester(ui, schema, context),
    fileArrayTester(ui, schema, context)
  );
export default withJsonFormsControlProps(
  withTranslateProps(React.memo(FileControl))
);
