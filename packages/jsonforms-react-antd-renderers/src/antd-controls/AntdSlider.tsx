import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import { Slider } from 'antd';
import merge from 'lodash/merge';
import { useI18n } from '../util/translate';

/**
 * A slider position for a value, or the fallback when there is nothing usable.
 *
 * Type-checked rather than truthy: `0` is a real value and must survive.
 * `Number(data || schema.default)` turned a committed `0` into the default -
 * the data said 0 while the knob sat at 10 - which section 18 forbids:
 * "Zero is a real current value and must not be replaced by a default through
 * a truthiness fallback."
 *
 * Strings are tolerated so incoming `"25"` still positions the thumb, but an
 * empty or unparseable one falls back rather than becoming `Number('')` = 0.
 */
export const resolveSliderValue = (
  value: unknown,
  fallback: number
): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

/** Whether the control holds a value at all, as opposed to showing a fallback. */
export const hasSliderValue = (value: unknown): boolean =>
  (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' &&
    value.trim() !== '' &&
    Number.isFinite(Number(value)));

export const AntdSlider = React.memo(function AntdSlider(
  props: CellProps &
    WithClassname & { inputProps?: React.ComponentProps<typeof Slider> }
) {
  const {
    data,
    id,
    enabled,
    uischema,
    path,
    handleChange,
    config,
    schema,
    inputProps,
  } = props;
  const t = useI18n();
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const sliderStyle: { [x: string]: any } = {
    marginTop: '7px',
  };

  // data -> schema.default -> schema.minimum -> 0, each checked rather than
  // trusted: the range tester requires a default, but not that it is a number.
  const committed = hasSliderValue(data);
  const effectiveValue = resolveSliderValue(
    data,
    resolveSliderValue(schema.default, schema.minimum ?? 0)
  );

  const marks = {
    [schema.minimum!]: {
      label: schema.minimum,
      style: { whiteSpace: 'nowrap' as const },
    },
    [schema.maximum!]: {
      label: schema.maximum,
      style: { whiteSpace: 'nowrap' as const },
    },
  };

  return (
    <Slider
      id={id}
      style={sliderStyle}
      min={schema.minimum}
      max={schema.maximum}
      marks={marks}
      value={effectiveValue as any}
      /*
        Missing data may borrow the default's position, but the spec requires
        it to be "visibly and accessibly identified as Not set until edited",
        so it must not be announced as a committed number.

        Through antd's own prop, not `aria-valuetext`: the announcement
        belongs on the **handle**, which is what carries `aria-valuenow`, and
        antd does not forward the bare attribute to it. Set as an attribute on
        the control it never reached the DOM at all, so the number was
        announced unqualified.
      */
      ariaValueTextFormatterForHandle={
        committed ? undefined : () => t('control.notSet')
      }
      onChange={(value: any) => {
        handleChange(path, Number(value));
      }}
      disabled={!enabled}
      step={schema.multipleOf || 1}
      autoFocus={!!appliedUiSchemaOptions.focus}
      {...inputProps}
    ></Slider>
  );
});
