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
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@jsonforms-react-shadcn-ui/popover';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';

import React, { useState } from 'react';
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
  and(isStringControl, formatIs('color')),
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
  const message = useI18n();
  const [rejectedText, setRejectedText] = useState<string>();

  const [previousData, setPreviousData] = React.useState(props.data);
  if (!Object.is(previousData, props.data)) {
    setPreviousData(() => props.data);
    setRejectedText(undefined);
  }
  const hex3 =
    resolveExtendedOption<string>(
      props.uischema.options,
      props.config,
      'colorSaveFormat',
      'hex',
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
      (hex3 && color ? serializeColor(color, 'hex3') : next) || undefined,
    );
  };
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  const value = typeof displayed === 'string' ? displayed : '';
  const disabled = !props.enabled || Boolean(props.readonly);
  const clearable =
    (props.uischema.options?.clearable ?? props.config?.clearable) !== false;
  const clear = () => {
    if (disabled) return;
    setRejectedText(undefined);
    props.handleChange(props.path, undefined);
  };

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
          disabled={disabled}
          onChange={(event) => {
            const next = event.currentTarget.value;
            change(next);
          }}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='absolute start-1 top-1/2 h-8 w-8 -translate-y-1/2 p-1'
              aria-label={`${props.label || 'Color'} picker`}
              disabled={disabled}
            >
              <span
                data-color-empty-swatch={value === '' ? '' : undefined}
                aria-hidden='true'
                className='h-full w-full rounded border border-input'
                style={
                  value === ''
                    ? {
                        backgroundColor: 'hsl(var(--background, 0 0% 100%))',
                        backgroundImage:
                          'conic-gradient(hsl(var(--muted-foreground, 0 0% 65%) / .3) 25%, transparent 0 50%, hsl(var(--muted-foreground, 0 0% 65%) / .3) 0 75%, transparent 0)',
                        backgroundSize: '12px 12px',
                      }
                    : { backgroundColor: normalizeColor(value) }
                }
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-72 space-y-3'>
            {/* The browser owns the native color dialog, so the app-level
                clear action belongs in this popover beside its trigger. */}
            <Input
              aria-label={`${props.label || 'Color'} picker value`}
              className='shadcn-jsonforms-color-picker h-40 w-full cursor-pointer p-1'
              type='color'
              value={normalizeColor(value)}
              disabled={disabled || transparent}
              onChange={(event) => change(event.currentTarget.value)}
            />
            {clearable && value !== '' && (
              <Button
                type='button'
                variant='ghost'
                className='w-full'
                data-color-panel-clear=''
                onClick={clear}
              >
                {message('control.clearValue')}
              </Button>
            )}
          </PopoverContent>
        </Popover>
        <ClearValueButton
          data={displayed}
          enabled={props.enabled}
          readonly={props.readonly}
          clearable={clearable}
          onClear={clear}
        />
      </div>
    </InputShell>
  );
};

export const ColorControlRenderer =
  withJsonFormsControlProps(ShadcnColorControl);
