import React, { act } from 'react';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import {
  createChoiceCards,
  choiceCardsTester,
} from '../../src/composition/choiceCards';
const colors = {
  border: 'gray',
  selected: 'blue',
  focus: 'orange',
  background: 'white',
  error: 'red',
};
let cleanup = () => {};
afterEach(() => cleanup());
const mount = (
  fieldSchema: any = { enum: [false, 0, 'x'] },
  data: any = false,
  options: any = {},
  context: any = {},
) => {
  const request = vi.fn((request: any) => request.perform());
  const Cards = createChoiceCards(
    () => ({ request, dialog: <span>confirmation</span> }),
    () => colors,
  );
  const schema = { type: 'object', properties: { value: fieldSchema } };
  const view = mountHook(() => null, {
    schema,
    data: { value: data },
    context,
    render: () => (
      <Cards
        uischema={
          { type: 'Control', scope: '#/properties/value', options } as any
        }
        schema={schema}
        path=''
      />
    ),
  });
  cleanup = view.unmount;
  return {
    view,
    request,
    radios: () =>
      Array.from(
        view.container.querySelectorAll<HTMLInputElement>('input[type=radio]'),
      ),
  };
};
it('selects typed enum values through the real core reducer and pointer card interaction', () => {
  const { view, radios } = mount();
  expect(radios()[0].checked).toBe(true);
  act(() =>
    view.container
      .querySelectorAll<HTMLElement>('.jsonforms-choice-card')[1]
      .click(),
  );
  expect(view.context.core?.data.value).toBe(0);
  act(() => radios()[2].click());
  expect(view.context.core?.data.value).toBe('x');
});
it('honors disabled choices, renders presentation-only content and preserves selection on repeated activation', () => {
  const { view, radios } = mount(
    { type: 'string', enum: ['a', 'b'] },
    'a',
    {
      showRadio: true,
      choices: [
        {
          value: 'a',
          label: 'First',
          content: { type: 'Label', text: 'Presentation' },
        },
        {
          value: 'b',
          disabled: true,
          selectedContent: { type: 'Control', scope: '#' },
        },
      ],
    },
    {
      renderers: [
        { tester: () => 100, renderer: () => <span>Presentation</span> },
      ],
    },
  );
  expect(view.container.textContent).toContain('Presentation');
  expect(radios()[1].disabled).toBe(true);
  act(() => radios()[0].click());
  expect(view.dispatch).not.toHaveBeenCalled();
  const card = view.container.querySelector<HTMLElement>(
    '.jsonforms-choice-card',
  )!;
  act(() =>
    card.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })),
  );
  act(() =>
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    ),
  );
  act(() => radios()[0].focus());
  act(() => radios()[0].blur());
});
it('uses translated explicit labels and schema const titles', () => {
  const { radios } = mount(
    {
      oneOf: [
        { const: 1, title: 'One' },
        { const: 2, title: 'Two' },
      ],
    },
    1,
    { choices: [{ value: 1, i18n: 'choice.first' }] },
    {
      i18n: {
        locale: 'bg',
        translate: (_: string, fallback: string) =>
          fallback === 'One' ? 'Първо' : fallback,
      },
    },
  );
  expect(radios()[0].getAttribute('aria-label')).toBe('Първо');
});
it('confirms branch changes, applies defaults and preserves enclosing properties', () => {
  const { view, request, radios } = mount(
    {
      type: 'object',
      properties: { shared: { type: 'string' } },
      oneOf: [
        { title: 'A', properties: { a: { type: 'string', default: 'a' } } },
        { title: 'B', properties: { b: { type: 'string', default: 'b' } } },
      ],
    },
    { shared: 'kept', a: 'old' },
    {
      confirmation: { branchChange: 'always' },
      choices: [
        { branch: 1, detail: { type: 'VerticalLayout', elements: [] } },
      ],
    },
    { renderers: [{ tester: () => 1, renderer: () => <span>detail</span> }] },
  );
  act(() => radios()[1].click());
  expect(request).toHaveBeenCalledOnce();
  expect(view.context.core?.data.value).toMatchObject({
    shared: 'kept',
    b: 'b',
  });
});
it('resolves referenced branches and refuses interactions while readonly', () => {
  const schema = {
    type: 'object',
    definitions: {
      branch: { type: 'string', title: 'Referenced', default: 'new' },
    },
    properties: {
      value: {
        oneOf: [
          { $ref: '#/definitions/branch' },
          { type: 'number', title: 'Number' },
        ],
      },
    },
  };
  const Cards = createChoiceCards(
    () => ({ request: vi.fn(), dialog: null }),
    () => colors,
  );
  const view = mountHook(() => null, {
    schema,
    data: { value: 'old' },
    context: { readonly: true, uischemas: [] },
    render: () => (
      <Cards
        uischema={
          {
            type: 'Control',
            scope: '#/properties/value',
            options: {
              choices: [
                {
                  branch: 0,
                  content: {
                    type: 'HorizontalLayout',
                    elements: [{ type: 'Label', text: 'x' }],
                  },
                },
              ],
            },
          } as any
        }
        schema={schema}
        path=''
      />
    ),
  });
  cleanup = view.unmount;
  expect(
    view.container.querySelector<HTMLInputElement>('input')!.disabled,
  ).toBe(true);
  expect(
    choiceCardsTester(
      { type: 'Control', scope: '#', options: { format: 'cards' } } as any,
      { enum: ['a'] },
      { rootSchema: {} } as any,
    ),
  ).toBe(21);
});
