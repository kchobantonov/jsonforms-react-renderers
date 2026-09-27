import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
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
} from '../src/util/arrayChoices';

/*
  `variant: "multi-select"` and `variant: "chips"` - the two project extensions
  over the same array-of-choices shapes the automatic checkbox group already
  handles.

  Most of what the specification asks for here is about **identity**: which
  stored value an interaction refers to. `1` and `"1"` are different choices,
  `false` and `0` are values rather than removal signals, and where duplicates
  are permitted a removal has to take the occurrence that was clicked.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

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

// ------------------------------------------------------------------ selection

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

// ----------------------------------------------------------------- rendering

const render = (value: any, data: any, variant: string, options?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const rootNode = createRoot(container);
  let latest: any = data;
  act(() =>
    rootNode.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={root(value) as any}
          uischema={
            {
              type: 'Control',
              scope: '#/properties/value',
              options: { variant, ...(options ?? {}) },
            } as any
          }
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data: next }) => {
            latest = next;
          }}
        />
      </ConfigProvider>
    )
  );
  return {
    container,
    chips: () =>
      Array.from(container.querySelectorAll<HTMLElement>('[data-chip]')),
    input: () =>
      container.querySelector<HTMLInputElement>('[data-chips-input] input') ??
      container.querySelector<HTMLInputElement>('input[data-chips-input]'),
    stored: () => latest.value,
    unmount: () => act(() => rootNode.unmount()),
  };
};

describe('the chips control', () => {
  it('draws one tag per stored value, in order', async () => {
    const { chips, unmount } = render(
      freeItems(),
      { value: ['a', 'b'] },
      'chips'
    );
    await settle();
    expect(
      chips().map((chip) => chip.textContent?.replace(/\s*$/, ''))
    ).toEqual(['a', 'b']);
    unmount();
  });

  it('draws a tag for each of two equal values', async () => {
    // A Select in tags mode would show one; the array holds two.
    const { chips, unmount } = render(
      freeItems(),
      { value: ['a', 'a'] },
      'chips'
    );
    await settle();
    expect(chips()).toHaveLength(2);
    unmount();
  });

  it('removes the occurrence that was closed, not the first match', async () => {
    const { chips, stored, unmount } = render(
      freeItems(),
      { value: ['keep', 'drop', 'keep'] },
      'chips'
    );
    await settle();
    const close = chips()[2].querySelector<HTMLElement>('.ant-tag-close-icon');
    act(() => close!.click());
    await settle();
    await settle();
    expect(stored()).toEqual(['keep', 'drop']);
    unmount();
  });

  it('commits a typed token only on Enter', async () => {
    const { container, stored, unmount } = render(
      freeItems(),
      { value: [] },
      'chips'
    );
    await settle();
    const field = container.querySelector<HTMLInputElement>('input')!;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    act(() => {
      setter.call(field, 'partial');
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    // Still a draft.
    expect(stored()).toEqual([]);

    act(() => {
      field.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      );
    });
    await settle();
    await settle();
    expect(stored()).toEqual(['partial']);
    unmount();
  });

  it('offers a chooser rather than free entry when the items are finite', async () => {
    const { container, unmount } = render(enumItems(), { value: [] }, 'chips');
    await settle();
    expect(container.querySelector('[data-chips-select]')).toBeTruthy();
    expect(container.querySelector('[data-chips-input]')).toBeNull();
    unmount();
  });

  it('keeps a stored value the choices do not contain', async () => {
    const { chips, stored, unmount } = render(
      enumItems(),
      { value: ['Email', 'Carrier pigeon'] },
      'chips'
    );
    await settle();
    expect(chips()).toHaveLength(2);
    expect(stored()).toEqual(['Email', 'Carrier pigeon']);
    unmount();
  });

  it('stops removing at minItems while restrict is on', async () => {
    const { chips, unmount } = render(
      freeItems({ minItems: 2 }),
      { value: ['a', 'b'] },
      'chips',
      { restrict: true }
    );
    await settle();
    expect(chips()[0].querySelector('.ant-tag-close-icon')).toBeNull();
    unmount();
  });
});

describe('the multi-select control', () => {
  it('renders the stored values as the selection', async () => {
    const { container, unmount } = render(
      enumItems(),
      { value: ['Email', 'SMS'] },
      'multi-select'
    );
    await settle();
    expect(container.querySelector('[data-multi-select]')).toBeTruthy();
    expect(container.textContent).toContain('Email');
    expect(container.textContent).toContain('SMS');
    unmount();
  });

  it('shows a oneOf branch title while storing its constant', async () => {
    const { container, stored, unmount } = render(
      {
        type: 'array',
        uniqueItems: true,
        items: {
          oneOf: [
            { const: 'eng', title: 'Engineering' },
            { const: 'fin', title: 'Finance' },
          ],
        },
      },
      { value: ['eng'] },
      'multi-select'
    );
    await settle();
    expect(container.textContent).toContain('Engineering');
    expect(stored()).toEqual(['eng']);
    unmount();
  });

  it('keeps a stored value outside the permitted set', async () => {
    const { container, stored, unmount } = render(
      enumItems(),
      { value: ['Email', 'Carrier pigeon'] },
      'multi-select'
    );
    await settle();
    expect(container.textContent).toContain('Carrier pigeon');
    expect(stored()).toEqual(['Email', 'Carrier pigeon']);
    unmount();
  });
});
