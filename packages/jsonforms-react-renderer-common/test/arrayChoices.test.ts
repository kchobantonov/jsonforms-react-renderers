import { describe, expect, it } from 'vitest';
import {
  addChoice,
  arrayChoicesOf,
  canAddChoice,
  canRemoveChoice,
  isChipsControl,
  isMultiSelectControl,
  isSelected,
  removeChoice,
  removeChoiceAt,
  sameChoice,
} from '../src/arrayChoices';
const enumItems = (extra: Record<string, unknown> = {}) => ({
  type: 'array',
  uniqueItems: true,
  items: { type: 'string', enum: ['Email', 'SMS', 'Post'] },
  ...extra,
});

const freeItems = (extra: Record<string, unknown> = {}) => ({
  type: 'array',
  items: { type: 'string', minLength: 1 },
  ...extra,
});

const root = (value: any) => ({ type: 'object', properties: { value } });

const control = (variant?: string) =>
  ({
    type: 'Control',
    scope: '#/properties/value',
    ...(variant ? { options: { variant } } : {}),
  } as any);

const test = (tester: any, variant: string | undefined, value: any) => {
  const schema = root(value);
  return tester(control(variant), schema as any, {
    rootSchema: schema as any,
    config: {},
  });
};

describe('selecting the array-choice variants', () => {
  it('takes multi-select for a unique array of enum strings', () => {
    expect(test(isMultiSelectControl, 'multi-select', enumItems())).toBe(true);
  });

  it('takes multi-select for constant-based oneOf items', () => {
    expect(
      test(isMultiSelectControl, 'multi-select', {
        type: 'array',
        uniqueItems: true,
        items: {
          oneOf: [
            { const: 'eng', title: 'Engineering' },
            { const: 'fin', title: 'Finance' },
          ],
        },
      })
    ).toBe(true);
  });

  it('needs the variant: equal shapes stay with the checkbox group', () => {
    expect(test(isMultiSelectControl, undefined, enumItems())).toBe(false);
  });

  it('needs uniqueItems, which is what the checkbox group matches on', () => {
    expect(
      test(isMultiSelectControl, 'multi-select', {
        type: 'array',
        items: { type: 'string', enum: ['Email'] },
      })
    ).toBe(false);
  });

  /*
    "A renderer's tester must match only choice value types that its selection,
    addition, and removal logic supports." These render labels as text and
    compare with value equality, which is honest for strings and a bluff for
    structured constants.
  */
  it('declines structured constants rather than half-editing them', () => {
    expect(
      test(isMultiSelectControl, 'multi-select', {
        type: 'array',
        uniqueItems: true,
        items: { oneOf: [{ const: { code: 'eng' } }] },
      })
    ).toBe(false);
    expect(
      test(isMultiSelectControl, 'multi-select', {
        type: 'array',
        uniqueItems: true,
        items: { type: 'number', enum: [1, 2] },
      })
    ).toBe(false);
  });

  it('takes chips for free strings, with no finite choices at all', () => {
    expect(test(isChipsControl, 'chips', freeItems())).toBe(true);
  });

  it('takes chips for finite string choices too', () => {
    expect(test(isChipsControl, 'chips', enumItems())).toBe(true);
  });

  it('does not require uniqueItems for chips, which may repeat', () => {
    expect(
      test(isChipsControl, 'chips', {
        type: 'array',
        items: { type: 'string' },
      })
    ).toBe(true);
  });

  it('declines a positional array', () => {
    expect(
      test(isChipsControl, 'chips', {
        type: 'array',
        items: [{ type: 'string' }],
      })
    ).toBe(false);
  });
});

// ------------------------------------------------------------------- choices

describe('reading the permitted choices', () => {
  it('labels an enum by its own value', () => {
    expect(arrayChoicesOf({ type: 'string', enum: ['Email'] } as any)).toEqual([
      { value: 'Email', label: 'Email' },
    ]);
  });

  it('labels a oneOf branch by its title, storing the constant', () => {
    expect(
      arrayChoicesOf({
        oneOf: [{ const: 'eng', title: 'Engineering' }],
      } as any)
    ).toEqual([{ value: 'eng', label: 'Engineering' }]);
  });

  it('falls back to the constant when a branch has no title', () => {
    expect(arrayChoicesOf({ oneOf: [{ const: 'eng' }] } as any)).toEqual([
      { value: 'eng', label: 'eng' },
    ]);
  });

  it('reports no choices for free or unsupported items', () => {
    expect(arrayChoicesOf({ type: 'string' } as any)).toBeUndefined();
    expect(
      arrayChoicesOf({ type: 'number', enum: [1] } as any)
    ).toBeUndefined();
    expect(arrayChoicesOf(undefined)).toBeUndefined();
  });
});

// ------------------------------------------------------------------ identity

describe('value identity', () => {
  it('keeps numeric and string values apart', () => {
    expect(sameChoice(1, '1')).toBe(false);
    expect(isSelected([1], '1')).toBe(false);
    expect(isSelected(['1'], '1')).toBe(true);
  });

  it('treats false and zero as values, not as absence', () => {
    expect(isSelected([false], false)).toBe(true);
    expect(isSelected([0], 0)).toBe(true);
    expect(isSelected([false], 0)).toBe(false);
  });

  it('matches a structured constant by contents, not by reference', () => {
    // Not a shape these renderers claim, but the helper is shared and the
    // specification names the case explicitly.
    expect(sameChoice({ code: 'eng' }, { code: 'eng' })).toBe(true);
  });
});

// ------------------------------------------------------------------ mutation

describe('adding and removing', () => {
  it('appends in interaction order', () => {
    expect(addChoice(['a'], 'b', true)).toEqual(['a', 'b']);
  });

  it('refuses a duplicate when the array is unique', () => {
    const values = ['a'];
    expect(addChoice(values, 'a', true)).toBe(values);
  });

  it('allows a duplicate when it is not', () => {
    expect(addChoice(['a'], 'a', false)).toEqual(['a', 'a']);
  });

  /*
    "In presentations allowing repeated values, removal must identify the
    intended occurrence." By position, because by value both would go.
  */
  it('removes one occurrence, the one identified by position', () => {
    expect(removeChoiceAt(['a', 'b', 'a'], 2)).toEqual(['a', 'b']);
    expect(removeChoiceAt(['a', 'b', 'a'], 0)).toEqual(['b', 'a']);
  });

  /*
    "A removal request for a value that is no longer present must not change
    unrelated items... never interpret a failed lookup as an array index
    identifying another item."
  */
  it('changes nothing when the value has already gone', () => {
    const values = ['a', 'b'];
    expect(removeChoice(values, 'missing')).toBe(values);
    expect(removeChoiceAt(values, -1)).toBe(values);
    expect(removeChoiceAt(values, 9)).toBe(values);
  });

  it('bounds additions and removals only while restrict is on', () => {
    expect(canAddChoice(['a'], { maxItems: 1, restrict: true })).toBe(false);
    expect(canAddChoice(['a'], { maxItems: 1, restrict: false })).toBe(true);
    expect(canRemoveChoice(['a'], { minItems: 1, restrict: true })).toBe(false);
    expect(canRemoveChoice(['a'], { minItems: 1, restrict: false })).toBe(true);
    expect(canAddChoice(['a'], { restrict: true })).toBe(true);
  });
});
