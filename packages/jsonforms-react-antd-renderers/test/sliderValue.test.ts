import { describe, expect, it } from 'vitest';
import {
  hasSliderValue,
  resolveSliderValue,
} from '../src/antd-controls/AntdSlider';

describe('slider position', () => {
  it('keeps a committed zero instead of falling back to the default', () => {
    // The reported bug: the data said 0 while the knob sat at 10, because
    // `0 || schema.default` is the default.
    expect(resolveSliderValue(0, 10)).toBe(0);
    expect(0 || 10).toBe(10); // what the old expression did
  });

  it('keeps negative values', () => {
    expect(resolveSliderValue(-2.5, 10)).toBe(-2.5);
    expect(resolveSliderValue(-0, 10)).toBe(-0);
  });

  it('falls back only when there is nothing usable', () => {
    for (const value of [
      undefined,
      null,
      '',
      '   ',
      'abc',
      NaN,
      Infinity,
      {},
    ]) {
      expect(resolveSliderValue(value, 7)).toBe(7);
    }
  });

  it('tolerates a numeric string without turning empty into zero', () => {
    expect(resolveSliderValue('25', 7)).toBe(25);
    expect(resolveSliderValue('0', 7)).toBe(0);
    // Number('') is 0; falling back is right, committing 0 would not be.
    expect(resolveSliderValue('', 7)).toBe(7);
  });

  it('chains data over default over minimum', () => {
    const fallback = (dflt: unknown, minimum: number) =>
      resolveSliderValue(dflt, minimum);
    expect(resolveSliderValue(undefined, fallback(10, 0))).toBe(10);
    // The range tester requires a default to exist, not that it is a number.
    expect(resolveSliderValue(undefined, fallback('nonsense', 3))).toBe(3);
    expect(resolveSliderValue(undefined, fallback(undefined, 3))).toBe(3);
  });
});

describe('whether a slider has a value at all', () => {
  it('distinguishes a committed zero from nothing', () => {
    expect(hasSliderValue(0)).toBe(true);
    expect(hasSliderValue(undefined)).toBe(false);
    expect(hasSliderValue(null)).toBe(false);
    expect(hasSliderValue('')).toBe(false);
    expect(hasSliderValue('abc')).toBe(false);
    expect(hasSliderValue(NaN)).toBe(false);
  });
});
