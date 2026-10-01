import React, { useEffect, useRef, useState } from 'react';
import {
  CellProps,
  JsonSchema,
  RankedTester,
  Resolve,
  and,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import { useI18n } from './translate';

export const isFileString = (schema: JsonSchema) =>
  schema.type === 'string' &&
  ((schema as any).contentEncoding === 'base64' ||
    schema.format === 'binary' ||
    schema.format === 'byte');

export const fileItemSchema = (
  schema: JsonSchema,
  rootSchema: JsonSchema
): JsonSchema | undefined => {
  if (
    schema.type !== 'array' ||
    !schema.items ||
    typeof schema.items === 'boolean' ||
    Array.isArray(schema.items)
  )
    return undefined;
  const item = schema.items as JsonSchema;
  const resolved = item.$ref
    ? Resolve.schema(rootSchema, item.$ref, rootSchema)
    : item;
  return resolved && isFileString(resolved) ? resolved : undefined;
};
export const fileArrayTester: RankedTester = rankWith(
  7,
  and(
    uiTypeIs('Control'),
    schemaMatches((schema, root) => Boolean(fileItemSchema(schema, root)))
  )
);

export const encodeFile = (file: File, schema: JsonSchema): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error('File read failed'));
    reader.onabort = () => reject(new Error('File read aborted'));
    reader.onload = () => {
      const url = String(reader.result ?? '');
      if (schema.format === 'uri') resolve(url);
      else if (schema.format === 'binary') {
        const marker = url.indexOf(';base64,');
        resolve(
          marker < 0
            ? url
            : url.slice(0, marker) +
                ';filename=' +
                encodeURIComponent(file.name) +
                url.slice(marker)
        );
      } else resolve(url.slice(url.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });

export const attachmentName = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const match = /^data:[^,]*;filename=([^;,]*)/.exec(value);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

/** A batch is appended once, in chooser order; failed reads never erase committed files. */
export const FileArrayInput = (
  props: CellProps & {
    readonly?: boolean;
    cell?: boolean;
    FeedbackComponent?: React.ComponentType<{ message: string; cell?: boolean; severity: 'warning' | 'error' }>;
    PillComponent?: React.ElementType;
    ButtonComponent?: React.ElementType;
  }
) => {
  const t = useI18n();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState<'warning' | 'error'>('warning');
  useEffect(() => { setError(''); }, [props.data]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const latest = useRef(props);
  latest.current = props;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const item = fileItemSchema(props.schema, props.rootSchema);
  if (!item || props.visible === false) return null;
  const values: unknown[] = Array.isArray(props.data) ? props.data : [];
  const options = { ...props.config, ...props.uischema.options };
  const disabled = !props.enabled || props.readonly || busy;
  const restrict = options.restrict !== false;
  const Pill = props.PillComponent ?? 'span';
  const Button = props.ButtonComponent ?? 'button';
  const canRemove =
    !disabled && (!restrict || values.length > (props.schema.minItems ?? 0));
  const select = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!files.length || disabled) return;
    setError('');
    setSeverity('warning');
    if (
      restrict &&
      props.schema.maxItems !== undefined &&
      !props.schema.uniqueItems &&
      values.length + files.length > props.schema.maxItems
    ) {
      setError(t('file.maxItems', { limit: props.schema.maxItems }));
      return;
    }
    for (const file of files) {
      for (const [key, fails] of [
        ['formatMinimum', (size: number, limit: number) => size < limit],
        [
          'formatExclusiveMinimum',
          (size: number, limit: number) => size <= limit,
        ],
        ['formatMaximum', (size: number, limit: number) => size > limit],
        [
          'formatExclusiveMaximum',
          (size: number, limit: number) => size >= limit,
        ],
      ] as const) {
        const raw = (item as any)[key] ?? options[key];
        const limit = Number(raw);
        if (
          raw !== undefined &&
          Number.isFinite(limit) &&
          limit >= 0 &&
          fails(file.size, limit)
        ) {
          const sizeError = t('file.sizeBound', {
            name: file.name,
            bound: t(
              (
                {
                  formatMinimum: 'file.atLeast',
                  formatExclusiveMinimum: 'file.moreThan',
                  formatMaximum: 'file.atMost',
                  formatExclusiveMaximum: 'file.lessThan',
                } as const
              )[key]
            ),
            limit,
          });
          setError(sizeError);
          if (restrict) return;
        }
      }
    }
    const initialData = props.data;
    setBusy(true);
    try {
      const encoded = await Promise.all(
        files.map((file) => encodeFile(file, item))
      );
      if (
        !mounted.current ||
        latest.current.data !== initialData ||
        latest.current.path !== props.path ||
        !latest.current.enabled ||
        latest.current.readonly
      )
        return;
      const next = [...values];
      encoded.forEach((value) => {
        if (!props.schema.uniqueItems || !next.includes(value))
          next.push(value);
      });
      if (
        restrict &&
        props.schema.maxItems !== undefined &&
        next.length > props.schema.maxItems
      ) {
        setError(t('file.maxItems', { limit: props.schema.maxItems }));
        return;
      }
      setNames((previous) => {
        const result = new Map(previous);
        encoded.forEach((value, index) => result.set(value, files[index].name));
        return result;
      });
      props.handleChange(props.path, next);
    } catch {
      if (mounted.current) { setSeverity('error'); setError(t('file.readFailed')); }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}
      style={{ minWidth: 0, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: props.cell ? 'none' : '1px solid var(--file-input-border, #8886)', borderRadius: 6, padding: props.cell ? 0 : '2px 4px', minWidth: 0, height: props.cell ? 28 : undefined, boxSizing: 'border-box' }}>
      <input
        ref={inputRef}
        id={props.id}
        type='file'
        multiple
        disabled={disabled}
        aria-label={t('file.select')}
        aria-invalid={Boolean(props.errors)}
        accept={
          typeof options.accept === 'string'
            ? options.accept
            : (item as any).contentMediaType
        }
        onChange={select}
        style={{ display: 'none' }}
      />
      <Button style={{ flex: '0 0 24px', width: 24, height: 24, padding: 0 }} type='button' aria-label={t('file.select')} title={t('file.select')} disabled={disabled} onClick={() => inputRef.current?.click()}>
        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'><path d='M14 2H6v20h12V6z M14 2v6h4' /></svg>
      </Button>
      {busy && <span role='status'>{t('file.reading')}</span>}
      <div data-file-pills tabIndex={0} style={{ display: 'flex', alignItems: 'center', flex: '1 1 0%', minWidth: 0, flexWrap: props.cell ? 'nowrap' : 'wrap', gap: 4, maxHeight: props.cell ? 28 : '8rem', overflowX: 'auto', overflowY: props.cell ? 'hidden' : 'auto', scrollbarWidth: 'thin' }}>
        {values.map((value, index) => {
          const name =
            attachmentName(value) ??
            names.get(String(value)) ??
            t('file.numbered', { index: index + 1 });
          return (
            <Pill
              key={index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                maxWidth: '12rem',
                flexShrink: 0,
                height: 22,
                boxSizing: 'border-box',
                borderRadius: 4,
                padding: '0 4px',
                minWidth: 0,
              }}
            >
              <span
                title={name}
                tabIndex={0}
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </span>
              {options.clearable !== false && (
                <Button
                  type='button'
                  style={{ width: 16, height: 16, minWidth: 16, padding: 0, flexShrink: 0, lineHeight: 1 }}
                  disabled={!canRemove}
                  aria-label={t('composite.remove', { label: name })}
                  onClick={() => {
                    setError('');
                    props.handleChange(
                      props.path,
                      values.filter((_, i) => i !== index)
                    );
                  }}
                >
                  ×
                </Button>
              )}
            </Pill>
          );
        })}
      </div>
      {error && props.cell && props.FeedbackComponent && <props.FeedbackComponent message={error} cell severity={severity} />}
      {options.clearable !== false && values.length > 0 && props.enabled && !props.readonly && (
        <Button style={{ marginLeft: 'auto', flex: '0 0 24px', width: 24, height: 24, padding: 0, opacity: hovered || focused ? 1 : 0 }} type='button' aria-label={t('file.clearAll')} title={t('file.clearAll')}
          disabled={disabled || (restrict && (props.schema.minItems ?? 0) > 0)}
          onClick={() => { setError(''); props.handleChange(props.path, []); }}>
          ×
        </Button>
      )}
      </div>
      {error && !props.cell && (props.FeedbackComponent ? <props.FeedbackComponent message={error} severity={severity} /> : <span role='alert'>{error}</span>)}
    </div>
  );
};
