import React from 'react';
import { ControlProps, isRangeControl, rankWith } from '@jsonforms/core';
import { Slider } from '@jsonforms-react-shadcn-ui/slider';
import { InputShell, makeId } from './InputControl';

export const ShadcnSliderControl = (props: ControlProps) => {
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  const min = props.schema.minimum ?? 0;
  const max = props.schema.maximum ?? 100;
  const value =
    typeof props.data === 'number' && Number.isFinite(props.data)
      ? props.data
      : undefined;
  const position =
    max > min
      ? Math.max(0, Math.min(100, (((value ?? min) - min) / (max - min)) * 100))
      : 0;
  return (
    <InputShell {...props}
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={props.errors}
    >
      <div className='flex items-end gap-3'>
        <span
          className='text-sm text-muted-foreground tabular-nums'
          data-slider-min
        >
          {min}
        </span>
        <div className='relative min-w-0 flex-1 pt-9 pb-2'>
          {value !== undefined && (
            <output
              htmlFor={id}
              data-slider-value
              className='absolute top-0 -translate-x-1/2 rounded border bg-background px-2 py-0.5 text-xs tabular-nums shadow-sm'
              style={{ left: `${position}%` }}
            >
              {value}
            </output>
          )}
          <Slider
            id={id}
            aria-label={props.label}
            min={min}
            max={max}
            step={props.schema.multipleOf ?? 1}
            value={[value ?? min]}
            disabled={!props.enabled || props.readonly}
            onValueChange={([value]) =>
              props.handleChange(
                props.path,
                props.schema.type === 'integer' ? Math.trunc(value) : value
              )
            }
          />
        </div>
        <span
          className='text-sm text-muted-foreground tabular-nums'
          data-slider-max
        >
          {max}
        </span>
      </div>
    </InputShell>
  );
};
export const sliderControlTester = rankWith(4, isRangeControl);
