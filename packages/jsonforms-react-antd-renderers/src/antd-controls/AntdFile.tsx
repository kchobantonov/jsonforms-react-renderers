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
import {
  CellProps,
  JsonSchema,
  WithClassname,
  getI18nKey,
} from '@jsonforms/core';
import { Upload } from 'antd';
import toNumber from 'lodash/toNumber';
import { TranslateProps } from '@jsonforms/react';

interface UploadProgressEvent extends Partial<ProgressEvent> {
  percent?: number;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const toNonNegativeNumber = (param: any): number | undefined => {
  const result = param !== undefined ? toNumber(param) : undefined;
  return result && result >= 0 ? result : undefined;
};

const getFileSize = (
  schema: JsonSchema & {
    formatMinimum: any;
    formatMaximum: any;
    formatExclusiveMinimum: any;
    formatExclusiveMaximum: any;
  },
  uioptions:
    | {
        formatMinimum: any;
        formatMaximum: any;
        formatExclusiveMinimum: any;
        formatExclusiveMaximum: any;
      }
    | undefined,
  variant: 'min' | 'max'
): [number | undefined, boolean] => {
  let exclusive = false;
  let fileSize: number | undefined = undefined;

  if (variant === 'min') {
    fileSize = toNonNegativeNumber(schema?.formatMinimum);
    if (fileSize === undefined && schema?.formatExclusiveMinimum) {
      fileSize = toNonNegativeNumber(schema?.formatExclusiveMinimum);
      exclusive = true;
    }

    if (fileSize === undefined && uioptions) {
      if (
        typeof uioptions.formatMinimum === 'number' ||
        typeof uioptions.formatMinimum === 'string'
      ) {
        fileSize = toNonNegativeNumber(uioptions.formatMinimum);
      } else if (
        typeof uioptions.formatExclusiveMinimum === 'number' ||
        typeof uioptions.formatExclusiveMinimum === 'string'
      ) {
        fileSize = toNonNegativeNumber(uioptions.formatExclusiveMinimum);
        exclusive = true;
      }
    }
  } else {
    fileSize = toNonNegativeNumber(schema?.formatMaximum);
    if (fileSize === undefined && schema?.formatExclusiveMaximum) {
      fileSize = toNonNegativeNumber(schema?.formatExclusiveMaximum);
      exclusive = true;
    }

    if (fileSize === undefined && uioptions) {
      if (
        typeof uioptions.formatMaximum === 'number' ||
        typeof uioptions.formatMaximum === 'string'
      ) {
        fileSize = toNonNegativeNumber(uioptions.formatMaximum);
      } else if (
        typeof uioptions.formatExclusiveMaximum === 'number' ||
        typeof uioptions.formatExclusiveMaximum === 'string'
      ) {
        fileSize = toNonNegativeNumber(uioptions.formatExclusiveMaximum);
        exclusive = true;
      }
    }
  }

  return [fileSize, exclusive];
};

const toBase64 = (
  file: File,
  reader: FileReader,
  onProgress: (event: UploadProgressEvent) => void,
  schemaFormat?: string
) =>
  new Promise((resolve, reject) => {
    reader.onload = () => {
      const dataurl = reader.result as string;
      if (schemaFormat === 'uri') {
        resolve(dataurl);
      } else if (schemaFormat === 'binary') {
        //special handling to encode the filename
        const insertIndex = dataurl.indexOf(';base64,');
        resolve(
          dataurl.substring(0, insertIndex) +
            `;filename=${encodeURIComponent(file.name)}` +
            dataurl.substring(insertIndex)
        );
      } else {
        resolve(dataurl.substring(dataurl.indexOf(',') + 1));
      }
    };
    reader.onabort = (error) => reject(error);
    reader.onerror = (error) => reject(error);
    reader.onprogress = onProgress;
    reader.readAsDataURL(file);
  });

export const AntdFile = React.memo(function AntdFile(
  props: CellProps &
    WithClassname &
    TranslateProps & {
      inputProps?: React.ComponentProps<typeof Upload.Dragger>;
    }
) {
  const { schema, uischema, path, handleChange, enabled, t, inputProps } =
    props;

  const uploadImage = async (options) => {
    const { onSuccess, onError, file, onProgress } = options;

    try {
      const [minFileSize, minFileSizeExclusive] = getFileSize(
        schema as any,
        uischema.options as any,
        'min'
      );
      const [maxFileSize, maxFileSizeExclusive] = getFileSize(
        schema as any,
        uischema.options as any,
        'max'
      );

      if (maxFileSize) {
        const maxFileSizeValid = maxFileSizeExclusive
          ? file.size < maxFileSize
          : file.size <= maxFileSize;
        if (!maxFileSizeValid) {
          const key = getI18nKey(
            schema,
            uischema,
            path,
            maxFileSizeExclusive
              ? 'error.formatExclusiveMaximum'
              : 'error.formatMaximum'
          );

          const formatSize = formatBytes(maxFileSize);

          handleChange(path, undefined);
          onError({
            message: t(key, `size should be less than ${formatSize}`, {
              limitText: `${formatSize}`,
              limit: `${maxFileSize}`,
            }),
          });
          return;
        }
      }

      if (minFileSize) {
        const minFileSizeValid = minFileSizeExclusive
          ? file.size > minFileSize
          : file.size >= minFileSize;
        if (!minFileSizeValid) {
          const key = getI18nKey(
            schema,
            uischema,
            path,
            minFileSizeExclusive
              ? 'error.formatExclusiveMinimum'
              : 'error.formatMinimum'
          );

          const formatSize = formatBytes(minFileSize);
          handleChange(path, undefined);
          onError({
            message: t(key, `size should be greater than ${formatSize}`, {
              limitText: `${formatSize}`,
              limit: `${minFileSize}`,
            }),
          });
          return;
        }
      }

      // upload
      const base64 = await toBase64(
        file,
        new FileReader(),
        onProgress,
        schema.format
      );

      handleChange(path, base64);
      onSuccess('Ok');
    } catch (err) {
      handleChange(path, undefined);
      onError({ message: err?.message ?? err });
    }
  };

  return (
    <Upload.Dragger
      disabled={!enabled}
      accept={(props.schema as any).contentMediaType}
      customRequest={uploadImage}
      listType='picture'
      maxCount={1}
      onRemove={() => handleChange(path, undefined)}
      {...inputProps}
    >
      {t('Select File', 'Select File')}
    </Upload.Dragger>
  );
});
