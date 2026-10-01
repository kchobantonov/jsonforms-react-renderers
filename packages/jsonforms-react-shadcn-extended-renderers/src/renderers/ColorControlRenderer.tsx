import {
  ControlProps,
  RankedTester,
  and,
  formatIs,
  isStringControl,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  InputShell,
  ClearValueButton,
  makeId,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { Input } from '@jsonforms-react-shadcn-ui/input';

import React, { useEffect, useState } from 'react';
import {
  parseColor,
  serializeColor,
  isTransparent,
} from '@chobantonov/jsonforms-react-renderer-common/colorFormat';
import {
  resolveExtendedOption,
  useExtendedTranslator,
} from '@chobantonov/jsonforms-react-extended-renderers';

export const colorControlTester: RankedTester = rankWith(
  2,
  and(isStringControl, formatIs('color'))
);

export const normalizeColor = (value: unknown): string => {
  if (typeof value !== 'string') return '#000000';
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value
      .slice(1)
      .split('')
      .map((part) => part + part)
      .join('')}`;
  }
  if (/^#[0-9a-f]{8}$/i.test(value)) return value.slice(0, 7);
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
};

export const ShadcnColorControl = (props: ControlProps) => {
  const t = useExtendedTranslator();
  const [rejectedText, setRejectedText] = useState<string>();
  useEffect(() => setRejectedText(undefined), [props.data]);
  const hex3 =
    resolveExtendedOption<string>(
      props.uischema.options,
      props.config,
      'colorSaveFormat',
      'hex'
    ) === 'hex3';
  const displayed = rejectedText ?? props.data;
  const parsed = parseColor(displayed);
  const transparent = hex3 && parsed !== undefined && isTransparent(parsed);
  const errors = [props.errors, transparent ? t('color.hex3Transparency') : '']
    .filter(Boolean)
    .join(' ');
  const change = (next: string) => {
    if (!props.enabled || props.readonly) return;
    const color = parseColor(next);
    if (hex3 && color && isTransparent(color)) {
      setRejectedText(next);
      return;
    }
    setRejectedText(undefined);
    props.handleChange(
      props.path,
      (hex3 && color ? serializeColor(color, 'hex3') : next) || undefined
    );
  };
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  const value = typeof displayed === 'string' ? displayed : '';

  return (
    <InputShell
      {...props}
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={errors}
    >
      <div className='shadcn-jsonforms-color-control group relative min-w-0'>
        <Input
          className='min-w-0 pl-10 pr-10'
          id={id}
          value={value}
          placeholder={hex3 ? '#RGB' : '#RRGGBB'}
          aria-invalid={Boolean(errors)}
          disabled={!props.enabled || props.readonly}
          onChange={(event) => {
            const next = event.currentTarget.value;
            change(next);
          }}
        />
        <div className='absolute left-1 top-1/2 h-8 w-8 -translate-y-1/2'>
          <Input
            aria-label={`${props.label || 'Color'} picker`}
            className='shadcn-jsonforms-color-picker h-full w-full cursor-pointer border-0 bg-transparent p-1 shadow-none disabled:cursor-not-allowed'
            type='color'
            value={normalizeColor(value)}
            disabled={!props.enabled || props.readonly || transparent}
            onChange={(event) => change(event.currentTarget.value)}
          />
          {value === '' && (
            <span
              data-color-empty-swatch
              aria-hidden='true'
              className='pointer-events-none absolute inset-1 rounded border border-input'
              style={{
                backgroundColor: 'hsl(var(--background, 0 0% 100%))',
                backgroundImage:
                  'conic-gradient(hsl(var(--muted-foreground, 0 0% 65%) / .3) 25%, transparent 0 50%, hsl(var(--muted-foreground, 0 0% 65%) / .3) 0 75%, transparent 0)',
                backgroundSize: '12px 12px',
              }}
            />
          )}
        </div>
        <ClearValueButton
          data={displayed}
          enabled={props.enabled}
          readonly={props.readonly}
          clearable={props.uischema.options?.clearable !== false}
          onClear={() => {
            setRejectedText(undefined);
            props.handleChange(props.path, undefined);
          }}
        />
      </div>
    </InputShell>
  );
};

export const ColorControlRenderer =
  withJsonFormsControlProps(ShadcnColorControl);
