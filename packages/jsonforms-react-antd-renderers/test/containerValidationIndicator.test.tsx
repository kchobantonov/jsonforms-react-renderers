import { describe, expect, it } from 'vitest';
import {
  buildErrorIndex,
  errorDataPath,
  resolveIndicatorOption,
  sharedErrorIndex,
  displayableErrors,
} from '../src/util/validationIndicator';
import { boundDataPaths } from '../src/util/groupState';

const err = (instancePath: string) => ({ instancePath } as any);

describe('error index', () => {
  it('adds every ancestor of every error', () => {
    const index = buildErrorIndex([err('/emergencyContact/phone')]);
    expect([...index].sort()).toEqual([
      '',
      'emergencyContact',
      'emergencyContact.phone',
    ]);
  });

  it('respects segment boundaries, so a sibling item cannot match', () => {
    const index = buildErrorIndex([err('/employees/10/name')]);
    expect(index.has('employees.10')).toBe(true);
    // The case the specification calls out: a startsWith test would match.
    expect(index.has('employees.1')).toBe(false);
  });

  it('decodes JSON Pointer escapes in the instance path', () => {
    expect(errorDataPath(err('/a~1b/c'))).toBe('a/b.c');
  });

  it('merges additional errors', () => {
    const index = buildErrorIndex([err('/a')], [err('/b/c')]);
    expect(index.has('a')).toBe(true);
    expect(index.has('b.c')).toBe(true);
  });

  it('is built once per pair of error arrays, not per container', () => {
    const errors = [err('/a')];
    const additional = [err('/b')];
    expect(sharedErrorIndex(errors, additional)).toBe(
      sharedErrorIndex(errors, additional)
    );
    // A new validation replaces the array, so the identity key changes.
    expect(sharedErrorIndex([err('/a')], additional)).not.toBe(
      sharedErrorIndex(errors, additional)
    );
  });
});

describe('validation modes', () => {
  const errors = [err('/a')];
  const additionalErrors = [err('/b')];

  it('shows schema errors only when the mode displays them', () => {
    for (const mode of ['ValidateAndShow', undefined]) {
      expect(
        displayableErrors({ errors, additionalErrors, validationMode: mode })[0]
      ).toBe(errors);
    }
    for (const mode of ['ValidateAndHide', 'NoValidation']) {
      expect(
        displayableErrors({ errors, additionalErrors, validationMode: mode })[0]
      ).toBeUndefined();
    }
  });

  it('keeps additional errors in every mode', () => {
    for (const mode of ['ValidateAndShow', 'ValidateAndHide', 'NoValidation']) {
      expect(
        displayableErrors({ errors, additionalErrors, validationMode: mode })[1]
      ).toBe(additionalErrors);
    }
  });
});

describe('option resolution follows Adjustment 1', () => {
  const namespaced = (value: unknown) => ({
    jsonformsExtended: { showValidationIndicator: value },
  });

  it('reads the element option flat, not namespaced', () => {
    const ui = { type: 'Group', options: { showValidationIndicator: true } };
    expect(resolveIndicatorOption(ui as any, undefined, false)).toBe(true);
  });

  it('reads the global default from the jsonformsExtended namespace', () => {
    expect(resolveIndicatorOption(undefined, namespaced(true), false)).toBe(
      true
    );
  });

  it('ignores a flat config key, which is the wrong tier for an extension', () => {
    expect(
      resolveIndicatorOption(
        undefined,
        { showValidationIndicator: true } as any,
        false
      )
    ).toBe(false);
  });

  it('lets an explicit element false beat an inherited true', () => {
    const ui = { type: 'Group', options: { showValidationIndicator: false } };
    expect(resolveIndicatorOption(ui as any, namespaced(true), true)).toBe(
      false
    );
  });

  it('falls back to the container-type default when nothing is set', () => {
    expect(resolveIndicatorOption(undefined, undefined, true)).toBe(true);
    expect(resolveIndicatorOption(undefined, undefined, false)).toBe(false);
  });
});

describe('suppression is local only', () => {
  it('a suppressed child still contributes to its ancestor', () => {
    // The decision recorded for open question 4: showValidationIndicator is a
    // presentation flag on the element that carries it, not a filter on the
    // errors beneath it. An ancestor aggregates regardless.
    const child = { type: 'Control', scope: '#/properties/certifications' };
    const parent = {
      type: 'Category',
      elements: [{ ...child, options: { showValidationIndicator: false } }],
    };
    const index = buildErrorIndex([err('/certifications/1')]);
    expect(boundDataPaths(parent as any).some((p) => index.has(p))).toBe(true);
    expect(
      resolveIndicatorOption(parent.elements[0] as any, undefined, true)
    ).toBe(false);
  });
});
