import React, { useState } from 'react';
import {
  CellProps,
  JsonSchema,
  WithClassname,
  getI18nKey,
} from '@jsonforms/core';
import { Typography, Upload } from 'antd';
import toNumber from 'lodash/toNumber';
import { TranslateProps } from '@jsonforms/react';
import { useI18nDefault } from '../util/translate';

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
  /*
    The default message carries the locale bundle (§6.5), so it must not be
    read straight out of the English table.
  */
  const d = useI18nDefault();
  const [rejection, setRejection] = useState<string | undefined>(undefined);

  /** Why a selection breaks its size bounds, or undefined if it passes. */
  const sizeRejection = (file: { size: number }): string | undefined => {
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
      const valid = maxFileSizeExclusive
        ? file.size < maxFileSize
        : file.size <= maxFileSize;
      if (!valid) {
        const key = getI18nKey(
          schema,
          uischema,
          path,
          maxFileSizeExclusive
            ? 'error.formatExclusiveMaximum'
            : 'error.formatMaximum'
        );
        const formatSize = formatBytes(maxFileSize);
        return t(key, `size should be less than ${formatSize}`, {
          limitText: `${formatSize}`,
          limit: `${maxFileSize}`,
        });
      }
    }

    if (minFileSize) {
      const valid = minFileSizeExclusive
        ? file.size > minFileSize
        : file.size >= minFileSize;
      if (!valid) {
        const key = getI18nKey(
          schema,
          uischema,
          path,
          minFileSizeExclusive
            ? 'error.formatExclusiveMinimum'
            : 'error.formatMinimum'
        );
        const formatSize = formatBytes(minFileSize);
        return t(key, `size should be greater than ${formatSize}`, {
          limitText: `${formatSize}`,
          limit: `${minFileSize}`,
        });
      }
    }
    return undefined;
  };

  /**
   * The message shown when a selection is refused.
   *
   * It names the file. The previously committed attachment is still listed
   * above this message, so a bare "size should be less than 1 MB" reads as an
   * error about *that* file; naming the one that was turned away removes the
   * ambiguity. Falls back to the bare reason when the platform gives no name.
   */
  const rejectionMessage = (file: {
    size: number;
    name?: string;
  }): string | undefined => {
    const reason = sizeRejection(file);
    if (!reason || !file.name) {
      return reason;
    }
    return t('file.rejected', d('file.rejected'), {
      name: file.name,
      reason,
    })
      .replace('{name}', file.name)
      .replace('{reason}', reason);
  };

  /**
   * Size is checked here, before anything else happens to the selection.
   *
   * `Upload.LIST_IGNORE` drops the rejected file without adding it to the
   * list, so `customRequest` never runs: nothing is read, nothing is
   * converted, and - the point of doing it here - **the value already
   * committed is left alone**. Rejecting inside `customRequest` meant writing
   * `undefined` to the form first, so choosing an oversized file destroyed a
   * perfectly good attachment.
   */
  const beforeUpload = (file: { size: number; name?: string }) => {
    const message = rejectionMessage(file);
    setRejection(message);
    return message ? Upload.LIST_IGNORE : true;
  };

  const uploadImage = async (options: any) => {
    const { onSuccess, onError, file, onProgress } = options;
    try {
      const base64 = await toBase64(
        file,
        new FileReader(),
        onProgress,
        schema.format
      );
      setRejection(undefined);
      handleChange(path, base64);
      onSuccess('Ok');
    } catch (err: any) {
      // A failed read of a *new* file is not a reason to discard the value
      // that is already committed, for the same reason a size rejection is
      // not. Report it and leave the form data untouched.
      const message = err?.message ?? String(err);
      setRejection(message);
      onError({ message });
    }
  };

  return (
    <>
      <Upload.Dragger
        disabled={!enabled}
        accept={(props.schema as any).contentMediaType}
        beforeUpload={beforeUpload}
        customRequest={uploadImage}
        listType='picture'
        maxCount={1}
        onRemove={() => {
          // An explicit removal is the one case that should clear the value.
          setRejection(undefined);
          handleChange(path, undefined);
        }}
        {...inputProps}
      >
        {t('file.select', d('file.select'))}
      </Upload.Dragger>
      {rejection ? (
        <Typography.Text type='danger' role='alert' data-file-rejection>
          {rejection}
        </Typography.Text>
      ) : null}
    </>
  );
});
