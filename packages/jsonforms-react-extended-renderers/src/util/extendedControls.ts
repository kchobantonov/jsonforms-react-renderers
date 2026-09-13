import {
  and,
  formatIs,
  isStringControl,
  optionIs,
  or,
  rankWith,
  schemaTypeIs,
  uiTypeIs,
} from '@jsonforms/core';

export const extendedColorTester = rankWith(
  3,
  and(isStringControl, or(formatIs('color'), optionIs('format', 'color')))
);
export const extendedDurationTester = rankWith(
  3,
  and(isStringControl, or(formatIs('duration'), optionIs('format', 'duration')))
);
export const extendedNullTester = rankWith(
  3,
  and(uiTypeIs('Control'), schemaTypeIs('null'))
);
export const colorPickerValue = (value: unknown) => {
  if (typeof value !== 'string') return '#000000';
  if (/^#[a-f\d]{6}$/i.test(value)) return value;
  if (/^#[a-f\d]{3}$/i.test(value))
    return '#' + [...value.slice(1)].map((c) => c + c).join('');
  if (/^#[a-f\d]{8}$/i.test(value)) return value.slice(0, 7);
  return '#000000';
};
