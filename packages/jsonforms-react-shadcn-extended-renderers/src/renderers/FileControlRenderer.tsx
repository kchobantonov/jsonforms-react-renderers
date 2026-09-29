import {
  ControlProps,
  JsonSchema,
  RankedTester,
  and,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  InputShell,
  ClearValueButton,
  makeId,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { Alert } from '@jsonforms-react-shadcn-ui/alert';
import { Input } from '@jsonforms-react-shadcn-ui/input';

import React from 'react';

export type JsonSchemaWithContent = JsonSchema & {
  contentEncoding?: string;
  contentMediaType?: string;
  formatMinimum?: number;
  formatMaximum?: number;
  formatExclusiveMinimum?: number;
  formatExclusiveMaximum?: number;
};

export const isStringFileSchema = (schema: JsonSchema): boolean =>
  schema.type === 'string' &&
  ((schema as JsonSchemaWithContent).contentEncoding === 'base64' ||
    schema.format === 'binary' ||
    schema.format === 'byte');

export const fileControlTester: RankedTester = rankWith(
  2,
  and(uiTypeIs('Control'), schemaMatches(isStringFileSchema))
);

const optionNumber = (value: unknown): number | undefined => {
  const result = Number(value);
  return value !== undefined && Number.isFinite(result) && result >= 0
    ? result
    : undefined;
};

export const readFile = (
  file: File,
  schema: JsonSchemaWithContent
): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read file'));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      if (schema.format === 'binary') {
        const marker = dataUrl.indexOf(';base64,');
        resolve(
          marker < 0
            ? dataUrl
            : `${dataUrl.slice(0, marker)};filename=${encodeURIComponent(
                file.name
              )}${dataUrl.slice(marker)}`
        );
      } else {
        resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
      }
    };
    reader.readAsDataURL(file);
  });

export const ShadcnFileControl = (props: ControlProps) => {
  const fileInput = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [localError, setLocalError] = React.useState('');
  if (!props.visible) return null;
  const schema = props.schema as JsonSchemaWithContent;
  const options = { ...props.config, ...props.uischema.options };
  const id = makeId(props.path, props.label);
  const minimum = optionNumber(
    schema.formatMinimum ??
      schema.formatExclusiveMinimum ??
      options.formatMinimum ??
      options.formatExclusiveMinimum
  );
  const maximum = optionNumber(
    schema.formatMaximum ??
      schema.formatExclusiveMaximum ??
      options.formatMaximum ??
      options.formatExclusiveMaximum
  );
  const exclusiveMin =
    schema.formatMinimum === undefined &&
    (schema.formatExclusiveMinimum !== undefined ||
      options.formatExclusiveMinimum !== undefined);
  const exclusiveMax =
    schema.formatMaximum === undefined &&
    (schema.formatExclusiveMaximum !== undefined ||
      options.formatExclusiveMaximum !== undefined);

  return (
    <InputShell {...props}
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={props.errors}
    >
      <div className='shadcn-jsonforms-file-control group relative'>
        <Input
          ref={fileInput}
          className='shadcn-jsonforms-input pr-10'
          id={id}
          type='file'
          accept={
            schema.contentMediaType ||
            (typeof options.accept === 'string' ? options.accept : undefined)
          }
          required={props.required}
          disabled={!props.enabled || props.readonly || busy}
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            if (
              minimum !== undefined &&
              (exclusiveMin ? file.size <= minimum : file.size < minimum)
            ) {
              setLocalError(
                `File must be ${
                  exclusiveMin ? 'larger than' : 'at least'
                } ${minimum} bytes.`
              );
              event.currentTarget.value = '';
              return;
            }
            if (
              maximum !== undefined &&
              (exclusiveMax ? file.size >= maximum : file.size > maximum)
            ) {
              setLocalError(
                `File must be ${
                  exclusiveMax ? 'smaller than' : 'at most'
                } ${maximum} bytes.`
              );
              event.currentTarget.value = '';
              return;
            }
            setBusy(true);
            setLocalError('');
            try {
              props.handleChange(props.path, await readFile(file, schema));
              setFileName(file.name);
            } catch (error) {
              setLocalError(
                error instanceof Error ? error.message : 'Failed to read file.'
              );
            } finally {
              setBusy(false);
            }
          }}
        />
        <ClearValueButton
          data={props.data || fileName}
          enabled={props.enabled && !busy}
          readonly={props.readonly}
          clearable={options.clearable !== false}
          onClear={() => {
            props.handleChange(props.path, undefined);
            setFileName('');
            setLocalError('');
            if (fileInput.current) fileInput.current.value = '';
          }}
        />
      </div>
      {busy ? <div role='status'>Attaching file…</div> : null}
      {fileName ? (
        <div className='shadcn-jsonforms-description'>{fileName}</div>
      ) : null}
      {localError ? (
        <Alert
          className='shadcn-jsonforms-alert shadcn-jsonforms-alert-destructive'
          variant='destructive'
        >
          {localError}
        </Alert>
      ) : null}
    </InputShell>
  );
};

export const FileControlRenderer = withJsonFormsControlProps(ShadcnFileControl);
