import { describe, expect, it } from 'vitest';
import { toCommittableNumber } from '../src/numeric';

describe('numeric parsing', () => {
  describe('the truncations the specification names', () => {
    it('does not turn 1.9 into 1', () => {
      // "1.9 must not become integer 1 through truncation."
      expect(toCommittableNumber('1.9')).toBe(1.9);
      expect(toCommittableNumber(1.9)).toBe(1.9);
    });

    it('does not turn 1e3 into 1', () => {
      // "it must not interpret 1e3 as 1"
      expect(toCommittableNumber('1e3')).toBe(1000);
      expect(toCommittableNumber('1E3')).toBe(1000);
      expect(toCommittableNumber('1.5e2')).toBe(150);
    });

    it('does not accept a numeric prefix and discard the rest', () => {
      // parseInt/parseFloat both return 12 here, losing the user's entry.
      expect(toCommittableNumber('12abc')).toBeUndefined();
      expect(toCommittableNumber('1.9.9')).toBeUndefined();
    });
  });

  describe('values that must never be committed', () => {
    it.each(['abc', '-', '+', '.', 'NaN', 'Infinity', '-Infinity', '1e400'])(
      'refuses %s',
      (value) => expect(toCommittableNumber(value)).toBeUndefined()
    );

    it('refuses NaN and infinities arriving as numbers', () => {
      for (const value of [NaN, Infinity, -Infinity]) {
        expect(toCommittableNumber(value)).toBeUndefined();
      }
    });
  });

  describe('emptiness', () => {
    it('commits nothing, rather than the zero Number("") produces', () => {
      // Number('') is 0: testing emptiness first is what stops a cleared
      // field committing a zero.
      for (const value of ['', null, undefined]) {
        expect(toCommittableNumber(value)).toBeUndefined();
      }
    });

    it('keeps a real zero', () => {
      expect(toCommittableNumber(0)).toBe(0);
      expect(toCommittableNumber('0')).toBe(0);
      expect(toCommittableNumber('-0')).toBe(-0);
    });
  });

  describe('ordinary values', () => {
    it.each([
      ['42', 42],
      ['-42', -42],
      ['3.14', 3.14],
      ['  7  ', 7],
      ['0.1', 0.1],
      ['-0.5', -0.5],
    ])('parses %s as %s', (input, expected) =>
      expect(toCommittableNumber(input)).toBe(expected)
    );
  });

  it('commits a fractional value to an integer field rather than rounding', () => {
    // Rounding would be the same silent substitution in another disguise.
    // Committing 1.9 lets validation report "must be integer" against what was
    // actually typed, which the user can then correct.
    expect(toCommittableNumber('1.9')).not.toBe(1);
    expect(toCommittableNumber('1.9')).not.toBe(2);
    expect(toCommittableNumber('1.9')).toBe(1.9);
  });
});
