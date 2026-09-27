import { describe, expect, it } from 'vitest';
import {
  confirmationRequired,
  fallbackConfirmationPolicy,
  isComplexValue,
  isDiscardableValue,
  resolveConfirmationPolicy,
} from '../src/confirmation';
describe('resolving the policy', () => {
  const resolve = (
    options: any,
    config: any,
    catalogId: any = 'arrayTable',
    operation: any = 'delete'
  ) => resolveConfirmationPolicy({ options, config, catalogId, operation });

  it('prefers the element option above everything', () => {
    expect(
      resolve(
        { confirmation: { delete: 'never' } },
        {
          jsonformsExtended: {
            confirmation: {
              default: 'always',
              renderers: { arrayTable: { delete: 'always' } },
            },
          },
        }
      )
    ).toBe('never');
  });

  it('then the per-renderer config entry', () => {
    expect(
      resolve(undefined, {
        jsonformsExtended: {
          confirmation: {
            default: 'always',
            renderers: { arrayTable: { delete: 'never' } },
          },
        },
      })
    ).toBe('never');
  });

  it('then the global default', () => {
    expect(
      resolve(undefined, {
        jsonformsExtended: { confirmation: { default: 'never' } },
      })
    ).toBe('never');
  });

  it('then the documented fallback', () => {
    expect(resolve(undefined, undefined)).toBe('always');
  });

  /*
    "The default configuration example deliberately opts into always globally
    while restoring complex for mixed type changes; without that exception a
    global always also applies to mixed type changes."
  */
  it('falls back to complex only for a mixed type change', () => {
    expect(fallbackConfirmationPolicy('mixed', 'typeChange')).toBe('complex');
    expect(fallbackConfirmationPolicy('mixed', 'delete')).toBe('always');
    expect(fallbackConfirmationPolicy('oneOf', 'branchChange')).toBe('always');
  });

  it('lets a global default replace that fallback', () => {
    expect(
      resolve(
        undefined,
        { jsonformsExtended: { confirmation: { default: 'always' } } },
        'mixed',
        'typeChange'
      )
    ).toBe('always');
  });

  it('ignores a value that is not a policy, rather than reading it as never', () => {
    expect(resolve({ confirmation: { delete: 'sometimes' } }, undefined)).toBe(
      'always'
    );
    expect(
      resolve(undefined, {
        jsonformsExtended: { confirmation: { default: true } },
      })
    ).toBe('always');
  });

  it('reads nothing from an unrelated config shape', () => {
    expect(resolve(undefined, { confirmation: { default: 'never' } })).toBe(
      'always'
    );
  });
});

// ------------------------------------------------------------ what prompts

describe('deciding whether to prompt', () => {
  /*
    "False, zero, empty strings, and empty containers are existing values."
    Only absence is nothing to discard.
  */
  it('treats every value except absence as something to lose', () => {
    for (const value of [false, 0, '', null, {}, []]) {
      expect(isDiscardableValue(value)).toBe(true);
    }
    expect(isDiscardableValue(undefined)).toBe(false);
  });

  it('calls only a nonempty object or array complex', () => {
    expect(isComplexValue({ a: 1 })).toBe(true);
    expect(isComplexValue([1])).toBe(true);
    // "independently of whether its nested values are empty"
    expect(isComplexValue({ a: {} })).toBe(true);
    expect(isComplexValue({})).toBe(false);
    expect(isComplexValue([])).toBe(false);
    expect(isComplexValue('text')).toBe(false);
    expect(isComplexValue(null)).toBe(false);
  });

  it('never prompts under never', () => {
    expect(confirmationRequired('never', [{ a: 1 }])).toBe(false);
  });

  it('prompts under always only when there is something to discard', () => {
    expect(confirmationRequired('always', [0])).toBe(true);
    expect(confirmationRequired('always', [undefined])).toBe(false);
    expect(confirmationRequired('always', [])).toBe(false);
  });

  it('prompts under complex only for a nonempty container', () => {
    expect(confirmationRequired('complex', ['text'])).toBe(false);
    expect(confirmationRequired('complex', [{}])).toBe(false);
    expect(confirmationRequired('complex', [{ a: 1 }])).toBe(true);
  });

  /*
    "For batches, one confirmation covers the operation; complex applies if any
    discarded value qualifies."
  */
  it('asks once for a batch, and asks if any one value qualifies', () => {
    expect(confirmationRequired('complex', ['a', {}, { a: 1 }])).toBe(true);
    expect(confirmationRequired('complex', ['a', {}, []])).toBe(false);
  });
});
