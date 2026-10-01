import { FileFeedback } from './FileFeedback';
import { File as FileIcon } from 'lucide-react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import {
  FileArrayInput,
  fileArrayTester,
  fileItemSchema,
  attachmentName,
} from '@chobantonov/jsonforms-react-renderer-common/FileArrayInput';
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
  ShadcnCellMode,
  ClearValueButton,
  makeId,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { Input } from '@jsonforms-react-shadcn-ui/input';

import React from 'react';

const FileActionButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) => <Button {...props} type='button' variant='ghost' size='sm' />;
const FilePill = (props: React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...props} className='bg-secondary text-secondary-foreground text-sm' />
);

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

const singleFileTester: RankedTester = rankWith(
  2,
  and(uiTypeIs('Control'), schemaMatches(isStringFileSchema))
);

export const fileControlTester: RankedTester = (ui, schema, context) =>
  Math.max(
    singleFileTester(ui, schema, context),
    fileArrayTester(ui, schema, context)
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
      if (schema.format === 'uri') {
        resolve(dataUrl);
      } else if (schema.format === 'binary') {
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

const ShadcnSingleFileControl = (props: ControlProps) => {
  const fileInput = React.useRef<HTMLInputElement>(null);
  const t = useI18n();
  const [attachment, setAttachment] = React.useState<{
    value: string;
    name: string;
  }>();
  const [busy, setBusy] = React.useState(false);
  const cell = React.useContext(ShadcnCellMode);
  const [severity, setSeverity] = React.useState<'warning' | 'error'>(
    'warning'
  );
  React.useEffect(() => {
    setLocalError('');
  }, [props.data]);
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
    <InputShell
      {...props}
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={props.errors}
    >
      <div className='shadcn-jsonforms-file-control group relative flex items-center min-w-0 w-full'>
        <Input
          ref={fileInput}
          style={{ display: 'none' }}
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
            setSeverity('warning');
            if (
              minimum !== undefined &&
              (exclusiveMin ? file.size <= minimum : file.size < minimum)
            ) {
              setLocalError(
                t('file.rejected', {
                  name: file.name,
                  reason: t('file.sizeBound', {
                    name: file.name,
                    bound: t(exclusiveMin ? 'file.moreThan' : 'file.atLeast'),
                    limit: minimum,
                  }),
                })
              );
              event.currentTarget.value = '';
              return;
            }
            if (
              maximum !== undefined &&
              (exclusiveMax ? file.size >= maximum : file.size > maximum)
            ) {
              setLocalError(
                t('file.rejected', {
                  name: file.name,
                  reason: t('file.sizeBound', {
                    name: file.name,
                    bound: t(exclusiveMax ? 'file.lessThan' : 'file.atMost'),
                    limit: maximum,
                  }),
                })
              );
              event.currentTarget.value = '';
              return;
            }
            setBusy(true);
            setLocalError('');
            try {
              const value = await readFile(file, schema);
              props.handleChange(props.path, value);
              setAttachment({ value, name: file.name });
            } catch (error) {
              setSeverity('error');
              setLocalError(t('file.readFailed'));
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='absolute left-1 z-10 h-7 w-7'
          disabled={!props.enabled || props.readonly || busy}
          onClick={() => fileInput.current?.click()}
          aria-label={
            props.label
              ? props.label + ': ' + t('file.select')
              : t('file.select')
          }
        >
          <FileIcon className='h-4 w-4' />
        </Button>
        <Input
          readOnly
          disabled={!props.enabled || props.readonly}
          className={cell && localError ? 'pl-10 pr-16' : 'pl-10 pr-10'}
          aria-label={props.label}
          aria-invalid={Boolean(props.errors)}
          value={
            props.data
              ? attachmentName(props.data) ??
                (attachment?.value === props.data
                  ? attachment.name
                  : t('file.attached'))
              : ''
          }
          title={
            props.data
              ? attachmentName(props.data) ??
                (attachment?.value === props.data
                  ? attachment.name
                  : t('file.attached'))
              : ''
          }
        />
        {cell && localError && (
          <div className='absolute right-10'>
            <FileFeedback message={localError} cell severity={severity} />
          </div>
        )}
        <ClearValueButton
          data={props.data}
          enabled={props.enabled && !busy}
          readonly={props.readonly}
          clearable={options.clearable !== false}
          onClear={() => {
            props.handleChange(props.path, undefined);
            setAttachment(undefined);
            setLocalError('');
            if (fileInput.current) fileInput.current.value = '';
          }}
        />
      </div>
      {localError && !cell && (
        <FileFeedback message={localError} severity={severity} />
      )}
      {busy ? <div role='status'>{t('file.reading')}</div> : null}
    </InputShell>
  );
};

export const ShadcnFileControl = (props: ControlProps) => {
  const cell = React.useContext(ShadcnCellMode);
  if (!fileItemSchema(props.schema, props.rootSchema))
    return <ShadcnSingleFileControl {...props} />;
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  return (
    <InputShell {...props} id={id}>
      <FileArrayInput
        {...props}
        isValid={!props.errors}
        cell={cell}
        FeedbackComponent={FileFeedback}
        id={id}
        ButtonComponent={FileActionButton}
        PillComponent={FilePill}
      />
    </InputShell>
  );
};

export const FileControlRenderer = withJsonFormsControlProps(ShadcnFileControl);
