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
import {
  CellProps,
  JsonSchema,
  WithClassname,
  getI18nKey,
} from '@jsonforms/core';
import { TranslateProps } from '@jsonforms/react';
import merge from 'lodash/merge';
import toNumber from 'lodash/toNumber';
import { Button } from 'primereact/button';
import { PrimeIconButton } from './PrimeIconButton';
import {
  attachmentName,
  FileArrayInput,
  fileItemSchema,
} from '@chobantonov/jsonforms-react-renderer-common/FileArrayInput';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import { InputText } from 'primereact/inputtext';
import { ProgressBar } from 'primereact/progressbar';
import React, { useRef, useState } from 'react';

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
  variant: 'min' | 'max',
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
  onProgress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null,
  schemaFormat?: string,
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
            dataurl.substring(insertIndex),
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

const FileActionButton = ({
  color: _color,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button {...props} type='button' text size='small' />
);

export const PrimeFile = React.memo(function PrimeFile(
  props: CellProps &
    WithClassname &
    TranslateProps & { inputProps?: React.ComponentProps<typeof InputText> },
) {
  const {
    id,
    errors,
    schema,
    uischema,
    path,
    handleChange,
    enabled,
    config,
    inputProps,
    t,
  } = props;

  const fileInput = useRef<HTMLInputElement>(null);
  const translate = useI18n();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const editable =
    enabled && !(props as CellProps & { readonly?: boolean }).readonly;
  const [attachment, setAttachment] = useState<{
    value: unknown;
    name: string;
  }>();
  const name = props.data
    ? (attachmentName(props.data) ??
      (attachment?.value === props.data
        ? attachment.name
        : translate('file.attached')))
    : '';

  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isEncoding, setIsEncoding] = useState<boolean>(false);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!editable || isEncoding) return;
    if (!file) return;

    try {
      const [minFileSize, minFileSizeExclusive] = getFileSize(
        schema as any,
        uischema.options as any,
        'min',
      );
      const [maxFileSize, maxFileSizeExclusive] = getFileSize(
        schema as any,
        uischema.options as any,
        'max',
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
              : 'error.formatMaximum',
          );

          const formatSize = formatBytes(maxFileSize);

          setError(
            t(key, `size should be less than ${formatSize}`, {
              limitText: `${formatSize}`,
              limit: `${maxFileSize}`,
            }),
          );
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
              : 'error.formatMinimum',
          );

          const formatSize = formatBytes(minFileSize);
          setError(
            t(key, `size should be greater than ${formatSize}`, {
              limitText: `${formatSize}`,
              limit: `${minFileSize}`,
            }),
          );
          return;
        }
      }

      // Clear previous error and set encoding state
      setError(null);
      setIsEncoding(true);
      setProgress(0);

      const base64 = await toBase64(
        file,
        new FileReader(),
        (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setProgress(percentComplete);
          }
        },
        schema.format,
      );

      setAttachment({ value: base64, name: file.name });
      handleChange(path, base64);
      setIsEncoding(false);
    } catch {
      setError(translate('file.readFailed'));
    } finally {
      setIsEncoding(false);
    }
  };

  const clearFile = () => {
    handleChange(path, undefined);
    setProgress(0);
    setIsEncoding(false);
    setError(null);
  };
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  if (fileItemSchema(schema, props.rootSchema)) {
    return <FileArrayInput {...props} ButtonComponent={FileActionButton} />;
  }
  return (
    <div style={{ minWidth: 0, width: '100%' }}>
      <input
        ref={fileInput}
        type='file'
        hidden
        disabled={!editable || isEncoding}
        accept={
          (schema as JsonSchema & { contentMediaType?: string })
            .contentMediaType
        }
        onChange={handleFileSelect}
      />
      <div
        style={{ position: 'relative', minWidth: 0 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setFocused(false);
        }}
      >
        <InputText
          {...inputProps}
          id={id}
          disabled={!enabled}
          placeholder={appliedUiSchemaOptions.placeholder}
          value={name}
          title={name}
          readOnly
          style={{ width: '100%', minWidth: 0, paddingInline: '2.5rem' }}
          invalid={!!errors}
          aria-invalid={Boolean(errors)}
        />
        <PrimeIconButton
          type='button'
          text
          rounded
          icon='pi pi-file'
          aria-label={translate('file.select')}
          tooltip={translate('file.select')}
          disabled={!editable || isEncoding}
          style={{
            position: 'absolute',
            insetInlineStart: '.25rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '2rem',
            height: '2rem',
            padding: 0,
          }}
          onClick={() => fileInput.current?.click()}
        />
        {editable &&
          !!props.data &&
          appliedUiSchemaOptions.clearable !== false && (
            <PrimeIconButton
              type='button'
              text
              rounded
              icon='pi pi-times'
              aria-label={translate('control.clearValue')}
              tooltip={translate('control.clearValue')}
              disabled={isEncoding}
              style={{
                position: 'absolute',
                insetInlineEnd: '.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '2rem',
                height: '2rem',
                padding: 0,
                opacity: hovered || focused ? 1 : 0,
              }}
              onClick={clearFile}
            />
          )}
      </div>
      {isEncoding && (
        <ProgressBar value={progress} style={{ height: '.25rem' }} />
      )}
      {error && (
        <small role='alert' className='p-error'>
          {error}
        </small>
      )}
    </div>
  );
});
