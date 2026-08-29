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
import { InputShell, makeId, useShadcnComponents } from '@chobantonov/jsonforms-react-shadcn-renderers';
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
  ((schema as JsonSchemaWithContent).contentEncoding === 'base64' || schema.format === 'binary' || schema.format === 'byte');

export const fileControlTester: RankedTester = rankWith(
  2,
  and(uiTypeIs('Control'), schemaMatches(isStringFileSchema))
);

const optionNumber = (value: unknown): number | undefined => {
  const result = Number(value);
  return value !== undefined && Number.isFinite(result) && result >= 0 ? result : undefined;
};

export const readFile = (file: File, schema: JsonSchemaWithContent): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      if (schema.format === 'binary') {
        const marker = dataUrl.indexOf(';base64,');
        resolve(marker < 0 ? dataUrl : `${dataUrl.slice(0, marker)};filename=${encodeURIComponent(file.name)}${dataUrl.slice(marker)}`);
      } else {
        resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
      }
    };
    reader.readAsDataURL(file);
  });

export const ShadcnFileControl = (props: ControlProps) => {
  const { Alert, Button, Input } = useShadcnComponents();
  const [fileName, setFileName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [localError, setLocalError] = React.useState('');
  if (!props.visible) return null;
  const schema = props.schema as JsonSchemaWithContent;
  const options = props.uischema.options ?? {};
  const id = makeId(props.path, props.label);
  const minimum = optionNumber(schema.formatMinimum ?? schema.formatExclusiveMinimum ?? options.formatMinimum ?? options.formatExclusiveMinimum);
  const maximum = optionNumber(schema.formatMaximum ?? schema.formatExclusiveMaximum ?? options.formatMaximum ?? options.formatExclusiveMaximum);
  const exclusiveMin = schema.formatMinimum === undefined && (schema.formatExclusiveMinimum !== undefined || options.formatExclusiveMinimum !== undefined);
  const exclusiveMax = schema.formatMaximum === undefined && (schema.formatExclusiveMaximum !== undefined || options.formatExclusiveMaximum !== undefined);

  return (
    <InputShell id={id} label={props.label} required={props.required} description={props.description} errors={props.errors}>
      <div className='shadcn-jsonforms-file-control'>
        <Input
          id={id}
          type='file'
          accept={schema.contentMediaType || (typeof options.accept === 'string' ? options.accept : undefined)}
          required={props.required}
          disabled={!props.enabled || busy}
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            if (minimum !== undefined && (exclusiveMin ? file.size <= minimum : file.size < minimum)) {
              setLocalError(`File must be ${exclusiveMin ? 'larger than' : 'at least'} ${minimum} bytes.`);
              event.currentTarget.value = '';
              return;
            }
            if (maximum !== undefined && (exclusiveMax ? file.size >= maximum : file.size > maximum)) {
              setLocalError(`File must be ${exclusiveMax ? 'smaller than' : 'at most'} ${maximum} bytes.`);
              event.currentTarget.value = '';
              return;
            }
            setBusy(true);
            setLocalError('');
            try {
              props.handleChange(props.path, await readFile(file, schema));
              setFileName(file.name);
            } catch (error) {
              setLocalError(error instanceof Error ? error.message : 'Failed to read file.');
            } finally {
              setBusy(false);
            }
          }}
        />
        {props.data ? <Button variant='ghost' size='sm' disabled={!props.enabled || busy} onClick={() => { props.handleChange(props.path, undefined); setFileName(''); }}>Clear</Button> : null}
      </div>
      {busy ? <div role='status'>Attaching file…</div> : null}
      {fileName ? <div className='shadcn-jsonforms-description'>{fileName}</div> : null}
      {localError ? <Alert variant='destructive'>{localError}</Alert> : null}
    </InputShell>
  );
};

export const FileControlRenderer = withJsonFormsControlProps(ShadcnFileControl);
