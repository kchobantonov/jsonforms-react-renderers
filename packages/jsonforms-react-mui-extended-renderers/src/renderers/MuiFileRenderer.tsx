import {
  and,
  ControlProps,
  getI18nKey,
  isDescriptionHidden,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import { useJsonForms, withJsonFormsControlProps } from '@jsonforms/react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import React, { useEffect, useRef, useState } from 'react';
import {
  encodeFileResult,
  encodedFileName,
  FileSchema,
  fileSizeLimit,
  isFileSchema,
} from '../util/file';

export const muiFileRendererTester = rankWith(
  5,
  and(uiTypeIs('Control'), schemaMatches(isFileSchema))
);
export const MuiFileRendererComponent = (props: ControlProps) => {
  const context = useJsonForms();
  const options = { ...props.config, ...props.uischema.options };
  const schema = props.schema as FileSchema;
  const input = useRef<HTMLInputElement>(null);
  const reader = useRef<FileReader>();
  const [selection, setSelection] = useState<{
    value: string;
    name: string;
    size: number;
  }>();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number>();
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const editable = props.enabled && !props.readonly;
  const populated = typeof props.data === 'string' && props.data.length > 0;
  const t = (key: string, fallback: string, values?: Record<string, string>) =>
    context.i18n?.translate?.(key, fallback, values) ?? fallback;
  const cancel = () => {
    const active = reader.current;
    reader.current = undefined;
    active?.abort();
    setBusy(false);
    if (input.current) input.current.value = '';
  };
  useEffect(
    () => () => {
      const active = reader.current;
      reader.current = undefined;
      active?.abort();
    },
    []
  );
  useEffect(() => {
    cancel();
    if (!props.data) setSelection(undefined);
  }, [props.data, props.path, props.schema, editable, props.visible]);
  const select = (file: File) => {
    if (!editable) return;
    cancel();
    setError('');
    for (const kind of ['Maximum', 'Minimum'] as const) {
      const limit = fileSizeLimit(schema, options, kind);
      if (!limit) continue;
      const invalid =
        kind === 'Maximum'
          ? limit.exclusive
            ? file.size >= limit.value
            : file.size > limit.value
          : limit.exclusive
          ? file.size <= limit.value
          : file.size < limit.value;
      if (invalid) {
        const comparison =
          kind === 'Maximum'
            ? limit.exclusive
              ? 'less than'
              : 'at most'
            : limit.exclusive
            ? 'greater than'
            : 'at least';
        setError(
          t(
            getI18nKey(
              schema,
              props.uischema,
              props.path,
              `error.${limit.key}`
            ),
            `File size must be ${comparison} ${limit.value} bytes.`,
            { limit: String(limit.value), limitText: `${limit.value} bytes` }
          )
        );
        return;
      }
    }
    const active = new FileReader();
    reader.current = active;
    setBusy(true);
    setProgress(undefined);
    active.onprogress = (event) => {
      if (
        reader.current === active &&
        event.lengthComputable &&
        event.total > 0
      )
        setProgress((event.loaded / event.total) * 100);
    };
    const finish = () => {
      reader.current = undefined;
      setBusy(false);
    };
    active.onload = () => {
      if (reader.current !== active) return;
      const value = encodeFileResult(
        String(active.result ?? ''),
        file.name,
        schema.format
      );
      finish();
      setSelection({ value, name: file.name, size: file.size });
      props.handleChange(props.path, value);
    };
    active.onerror = () => {
      if (reader.current !== active) return;
      finish();
      setError(t('error.fileConversion', 'Failed to process file'));
    };
    active.onabort = () => {
      if (reader.current === active) finish();
    };
    try {
      active.readAsDataURL(file);
    } catch {
      active.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>);
    }
  };
  if (!props.visible) return null;
  const id = `${props.id}-file`;
  const errors = [error, props.errors].filter(Boolean).join('\n');
  const name =
    selection && selection.value === props.data
      ? selection.name
      : encodedFileName(props.data);
  const description = !isDescriptionHidden(
    props.visible,
    props.description,
    focused,
    options.showUnfocusedDescription
  );
  const size =
    selection && selection.value === props.data ? selection.size : undefined;
  const sizeLabel =
    size === undefined
      ? ''
      : size < 1024
      ? `${size} B`
      : size < 1024 * 1024
      ? `${Number((size / 1024).toFixed(1))} KB`
      : `${Number((size / (1024 * 1024)).toFixed(1))} MB`;
  const displayValue = populated
    ? `${name || t('file.attached', 'File attached')}${
        sizeLabel ? ` (${sizeLabel})` : ''
      }`
    : '';
  const openPicker = () => {
    if (editable && !busy) input.current?.click();
  };
  return (
    <Box sx={{ my: 1 }}>
      <TextField
        fullWidth
        id={`${id}-display`}
        label={props.label}
        value={displayValue}
        title={displayValue || undefined}
        placeholder={options.placeholder || t('file.empty', 'No file selected')}
        autoFocus={options.focus === true}
        error={Boolean(errors)}
        required={props.required}
        disabled={!editable || busy}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        helperText={
          <>
            {description && props.description}
            {description && errors ? ' — ' : ''}
            {errors}
          </>
        }
        InputProps={{
          readOnly: true,
          onClick: openPicker,
          startAdornment: (
            <InputAdornment position='start'>
              <AttachFileIcon />
            </InputAdornment>
          ),
          endAdornment:
            populated && editable && options.clearable !== false ? (
              <InputAdornment position='end'>
                <Tooltip title={t('file.clear', 'Clear value')}>
                  <IconButton
                    size='small'
                    aria-label='Clear value'
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      cancel();
                      setSelection(undefined);
                      setError('');
                      props.handleChange(props.path, undefined);
                    }}
                  >
                    <CloseIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : undefined,
        }}
        inputProps={{
          'aria-label': props.label || 'File',
          onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openPicker();
            }
          },
          style: {
            textOverflow: 'ellipsis',
            cursor: editable ? 'pointer' : undefined,
          },
        }}
      />
      <input
        ref={input}
        id={id}
        type='file'
        hidden
        disabled={!editable || busy}
        accept={
          schema.contentMediaType?.trim() ||
          (typeof options.accept === 'string' ? options.accept : undefined)
        }
        aria-label={props.label || 'File'}
        aria-invalid={Boolean(errors)}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) select(file);
        }}
      />
      <Dialog open={busy} onClose={cancel} aria-labelledby={`${id}-progress`}>
        <DialogTitle id={`${id}-progress`}>
          {t('file.upload.inProgress', 'Attaching file...')}
        </DialogTitle>
        <DialogContent>
          <LinearProgress
            aria-label='File read progress'
            variant={progress === undefined ? 'indeterminate' : 'determinate'}
            value={progress}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cancel}>{t('file.cancel', 'Cancel')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export const MuiFileRenderer = withJsonFormsControlProps(
  MuiFileRendererComponent
);
