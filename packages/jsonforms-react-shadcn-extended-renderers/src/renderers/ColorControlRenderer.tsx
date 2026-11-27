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
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';

import React, { useState } from 'react';
import {
  parseColor,
  serializeColor,
  isTransparent,
  hsbToRgb,
  rgbToHsb,
  toCssColor,
} from '@chobantonov/jsonforms-react-renderer-common/formats/colorFormat';
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

const rgbHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

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
  const pickerColor = parsed ?? { r: 0, g: 0, b: 0, a: 1 };
  const { h, s, b } = rgbToHsb(pickerColor);
  const pick = (r: number, g: number, blue: number) =>
    change(rgbHex(r, g, blue));
  const pickSpectrum = (
    clientX: number,
    clientY: number,
    element: HTMLElement,
  ) => {
    const bounds = element.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const saturation = clamp(
      ((clientX - bounds.left) / bounds.width) * 100,
      0,
      100,
    );
    const brightness = clamp(
      100 - ((clientY - bounds.top) / bounds.height) * 100,
      0,
      100,
    );
    const next = hsbToRgb(h, saturation, brightness);
    pick(next.r, next.g, next.b);
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
                    : {
                        backgroundColor:
                          toCssColor(value) ?? normalizeColor(value),
                      }
                }
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-72 space-y-3'>
            <div
              role='slider'
              aria-label={`${props.label || 'Color'} saturation and brightness`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={s}
              aria-valuetext={`${s}% saturation, ${b}% brightness`}
              tabIndex={transparent ? -1 : 0}
              className='relative h-40 w-full cursor-crosshair touch-none overflow-hidden rounded border border-input'
              style={{ backgroundColor: `hsl(${h} 100% 50%)` }}
              onPointerDown={(event) => {
                if (transparent) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                pickSpectrum(event.clientX, event.clientY, event.currentTarget);
              }}
              onPointerMove={(event) => {
                if (
                  transparent ||
                  !event.currentTarget.hasPointerCapture(event.pointerId)
                )
                  return;
                pickSpectrum(event.clientX, event.clientY, event.currentTarget);
              }}
              onKeyDown={(event) => {
                const step = event.shiftKey ? 10 : 1;
                const nextS =
                  s +
                  (event.key === 'ArrowRight'
                    ? step
                    : event.key === 'ArrowLeft'
                      ? -step
                      : 0);
                const nextB =
                  b +
                  (event.key === 'ArrowUp'
                    ? step
                    : event.key === 'ArrowDown'
                      ? -step
                      : 0);
                if (nextS === s && nextB === b) return;
                event.preventDefault();
                const next = hsbToRgb(
                  h,
                  clamp(nextS, 0, 100),
                  clamp(nextB, 0, 100),
                );
                pick(next.r, next.g, next.b);
              }}
            >
              <div
                className='absolute inset-0'
                style={{
                  background: 'linear-gradient(to right, white, transparent)',
                }}
              />
              <div
                className='absolute inset-0'
                style={{
                  background: 'linear-gradient(to top, black, transparent)',
                }}
              />
              <span
                aria-hidden='true'
                className='absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_black]'
                style={{ left: `${s}%`, top: `${100 - b}%` }}
              />
            </div>
            <input
              type='range'
              min={0}
              max={359}
              value={h}
              aria-label={`${props.label || 'Color'} hue`}
              disabled={transparent}
              className='w-full cursor-pointer'
              style={{
                background:
                  'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)',
              }}
              onChange={(event) => {
                const next = hsbToRgb(Number(event.currentTarget.value), s, b);
                pick(next.r, next.g, next.b);
              }}
            />
            <div className='grid grid-cols-3 gap-2'>
              {(['r', 'g', 'b'] as const).map((channel) => (
                <label key={channel} className='text-center text-xs uppercase'>
                  <Input
                    type='number'
                    min={0}
                    max={255}
                    value={pickerColor[channel]}
                    aria-label={`${props.label || 'Color'} ${channel.toUpperCase()}`}
                    disabled={transparent}
                    className='mb-1 h-9 px-1 text-center'
                    onChange={(event) => {
                      const number = Number(event.currentTarget.value);
                      if (
                        !Number.isInteger(number) ||
                        number < 0 ||
                        number > 255
                      )
                        return;
                      pick(
                        channel === 'r' ? number : pickerColor.r,
                        channel === 'g' ? number : pickerColor.g,
                        channel === 'b' ? number : pickerColor.b,
                      );
                    }}
                  />
                  {channel}
                </label>
              ))}
            </div>
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
