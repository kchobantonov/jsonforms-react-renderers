import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { coreReducer, init, update } from '@jsonforms/core';
import { antdCells, antdRenderers } from '../src';
import {
  branchChangeData,
  discardedByBranchChange,
  enclosingPropertyNames,
} from '../src/util/combinators';

/*
  The two combinator contracts that were being broken, both of them about data
  rather than appearance:

  - a `oneOf` branch change must keep the enclosing schema's own properties;
  - an `anyOf` tab change must write nothing whatsoever.
*/

class ResizeObserverStub {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

/** The specification's own worked example, §18. */
const contactSchema: any = {
  type: 'object',
  properties: { name: { type: 'string', title: 'Name' } },
  oneOf: [
    {
      title: 'Email contact',
      properties: {
        kind: { const: 'email', default: 'email' },
        email: { type: 'string' },
      },
      required: ['kind', 'email'],
    },
    {
      title: 'Phone contact',
      properties: {
        kind: { const: 'phone', default: 'phone' },
        phone: { type: 'string', default: '' },
      },
      required: ['kind', 'phone'],
    },
  ],
};

const anyOfSchema: any = {
  type: 'object',
  anyOf: [
    {
      title: 'Email',
      properties: { email: { type: 'string', title: 'Email' } },
      required: ['email'],
    },
    {
      title: 'Phone',
      properties: { phone: { type: 'string', title: 'Phone' } },
      required: ['phone'],
    },
  ],
};

/*
  Branches of different types. The old renderer compared `typeof data` with
  `typeof <branch default>` and rewrote the value when they differed, so this
  is the shape that exposed navigation writing data.
*/
const mixedAnyOfSchema: any = {
  anyOf: [
    { title: 'Text', type: 'string' },
    {
      title: 'Details',
      type: 'object',
      properties: { note: { type: 'string', title: 'Note' } },
    },
  ],
};

const draw = (schema: any, data: any, config?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current = data;
  const writes: any[] = [];
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={current}
          schema={schema}
          uischema={{ type: 'Control', scope: '#' }}
          config={config}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data: next }) => {
            current = next;
            writes.push(next);
          }}
        />
      </ConfigProvider>
    )
  );

  const paint = () =>
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={current}
            schema={schema}
            uischema={{ type: 'Control', scope: '#' }}
            config={config}
            renderers={antdRenderers}
            cells={antdCells}
            onChange={({ data: next }) => {
              current = next;
              writes.push(next);
            }}
          />
        </ConfigProvider>
      )
    );

  return {
    container,
    data: () => current,
    /** Replaces the form's value from outside, as a host would. */
    setData: (next: any) => {
      current = next;
      paint();
    },
    /** Every value the form has committed, so "wrote nothing" is checkable. */
    writes,
    /*
      antd 6 opens its select on `mousedown`, not `click`, and portals the
      popup to the body - so the option is looked up on `document`.
    */
    selectBranch: async (label: string) => {
      const select = container.querySelector('.ant-select');
      expect(select, 'no branch selector was rendered').toBeTruthy();
      act(() => {
        select!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      });
      await settle();
      const option = Array.from(
        document.querySelectorAll<HTMLElement>('.ant-select-item-option')
      ).find(
        (entry) =>
          (entry.getAttribute('title') ?? entry.textContent ?? '') === label
      );
      expect(option, `no branch option ${label}`).toBeTruthy();
      act(() => option!.click());
      await settle();
    },
    clickTab: (label: string) => {
      const tab = Array.from(
        container.querySelectorAll<HTMLElement>('.ant-tabs-tab')
      ).find((candidate) => candidate.textContent?.includes(label));
      expect(tab, `no tab ${label}`).toBeTruthy();
      act(() => tab!.click());
    },
    /** The shared branchChange dialog: "Clear form?", Yes / No. */
    answer: async (text: 'Yes' | 'No') => {
      const button = Array.from(
        document.querySelectorAll<HTMLButtonElement>('.ant-modal-footer button')
      ).find((candidate) => candidate.textContent?.includes(text));
      expect(
        button,
        `the confirmation dialog was not open (${text})`
      ).toBeTruthy();
      act(() => button!.click());
      await settle();
      await settle();
    },
    /** Types into a controlled input and waits out the 300ms debounce. */
    type: async (input: HTMLInputElement, value: string) => {
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )!.set!;
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      // The control debounces by 300ms, and the flush needs a further turn of
      // the loop after the timer fires before `onChange` has run.
      await settle(400);
      await settle(50);
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('the preservation rule, on its own', () => {
  it('reads the enclosing properties, not the branches', () => {
    expect(enclosingPropertyNames(contactSchema)).toEqual(['name']);
  });

  /* "Those preserved values take precedence over generated defaults." */
  it('lets an existing enclosing value beat a generated default', () => {
    const result = branchChangeData(
      { name: 'Alex', email: 'alex@example.com' },
      { name: 'generated', kind: 'phone', phone: '' },
      contactSchema
    );
    expect(result).toEqual({ name: 'Alex', kind: 'phone', phone: '' });
  });

  /* "do not infer preservation merely because two branches contain the same
     property name" - `kind` is in both branches and is still replaced. */
  it('does not preserve a name merely shared by two branches', () => {
    const result: any = branchChangeData(
      { name: 'Alex', kind: 'email', email: 'alex@example.com' },
      { kind: 'phone', phone: '' },
      contactSchema
    );
    expect(result.kind).toBe('phone');
    expect(result.email).toBeUndefined();
  });

  it('does not materialise an enclosing property that was never set', () => {
    const result = branchChangeData(
      { email: 'alex@example.com' },
      { kind: 'phone', phone: '' },
      contactSchema
    );
    expect(Object.prototype.hasOwnProperty.call(result as object, 'name')).toBe(
      false
    );
  });

  /* Clearing the selection is a branch change with no branch. */
  it('keeps the enclosing properties when the selection is cleared', () => {
    expect(
      branchChangeData(
        { name: 'Alex', email: 'a@b.c' },
        undefined,
        contactSchema
      )
    ).toEqual({ name: 'Alex' });
  });

  /*
    What the confirmation weighs. `name` survives the switch, so a form
    holding only `name` is discarding nothing.
  */
  it('excludes preserved properties from what counts as discarded', () => {
    expect(discardedByBranchChange({ name: 'Alex' }, contactSchema)).toEqual(
      {}
    );
    expect(
      discardedByBranchChange({ name: 'Alex', email: 'a@b.c' }, contactSchema)
    ).toEqual({ email: 'a@b.c' });
  });
});

describe('a oneOf branch change, through the form', () => {
  /*
    The specification's worked example, verbatim: given
    `{"name":"Alex","kind":"email","email":"alex@example.com"}`, a confirmed
    switch to Phone contact yields `{"name":"Alex","kind":"phone","phone":""}`.
    Before, `name` was dropped.
  */
  it('keeps name and replaces the branch data', async () => {
    const view = draw(contactSchema, {
      name: 'Alex',
      kind: 'email',
      email: 'alex@example.com',
    });
    await view.selectBranch('Phone contact');
    await view.answer('Yes');
    expect(view.data()).toEqual({ name: 'Alex', kind: 'phone', phone: '' });
    view.unmount();
  });

  /* "Cancel preserves both committed data and the previous selection." */
  it('changes nothing when the confirmation is declined', async () => {
    const before = {
      name: 'Alex',
      kind: 'email',
      email: 'alex@example.com',
    };
    const view = draw(contactSchema, before);
    await view.selectBranch('Phone contact');
    await view.answer('No');
    expect(view.data()).toEqual(before);
    view.unmount();
  });

  /*
    With `never`, the switch happens straight away - and must still preserve.
    This is the path that proves preservation is in the change itself rather
    than in the dialog.
  */
  it('preserves without a confirmation dialog too', async () => {
    const view = draw(
      contactSchema,
      { name: 'Alex', kind: 'email', email: 'alex@example.com' },
      {
        jsonformsExtended: {
          confirmation: { renderers: { oneOf: { branchChange: 'never' } } },
        },
      }
    );
    await view.selectBranch('Phone contact');
    expect(view.data()).toEqual({ name: 'Alex', kind: 'phone', phone: '' });
    view.unmount();
  });
});

describe('an anyOf tab change', () => {
  /*
    The specification's own case, and the absolute one: "Switching tabs does
    not delete email or phone. A value containing both can satisfy anyOf; the
    active tab is presentation state only." Both branches are objects, so the
    value can hold either.
  */
  it('writes nothing when the value can hold the branch', () => {
    const view = draw(anyOfSchema, { email: 'alex@example.com' });
    const before = view.writes.length;
    view.clickTab('Phone');
    expect(view.writes.length).toBe(before);
    expect(view.data()).toEqual({ email: 'alex@example.com' });
    expect(document.querySelector('.ant-modal')).toBeNull();
    view.unmount();
  });

  it('shows the branch the user selected', () => {
    const view = draw(anyOfSchema, { email: 'alex@example.com' });
    view.clickTab('Phone');
    const active = view.container.querySelector('.ant-tabs-content-active');
    expect(active?.textContent).toContain('Phone');
    view.unmount();
  });

  /* The data still chooses the opening tab when the user has not. */
  it('opens on the branch that fits the data', () => {
    const view = draw(anyOfSchema, { phone: '555-0100' });
    const active = view.container.querySelector('.ant-tabs-content-active');
    expect(active?.textContent).toContain('Phone');
    view.unmount();
  });

  /*
    Section 22 counts the selected tab as runtime state, so it belongs to the
    user once they have set it. The tab used to be re-derived from the data on
    every change of the fitting branch, which meant emptying the value while
    on a chosen tab left *no* tab selected and the panel blank - mid-edit.
  */
  it('keeps the chosen tab when the data stops fitting any branch', async () => {
    const view = draw(anyOfSchema, { phone: '555-0100' });
    view.clickTab('Email');
    view.setData({});
    await settle();
    const active = view.container.querySelector('.ant-tabs-content-active');
    expect(active, 'no tab was selected').toBeTruthy();
    expect(active?.textContent).toContain('Email');
    view.unmount();
  });
});

/*
  The case the rule above cannot cover, and why.

  JSON Forms commits a child edit with a lodash-style `set` on the form data.
  Setting a property on a *string* does nothing at all - so an object branch
  displayed over a string value renders inputs that silently swallow every
  keystroke. Navigation alone must not write, but a tab that cannot be typed
  into is not presentation either, so the value is replaced by the branch's
  generated default, after asking.
*/
/*
  The case that looks like it should not work, and does.

  An object branch displayed over a string value has inputs bound to paths
  that do not exist yet. Nothing is written when the tab is selected, so the
  obvious worry is that those inputs have nowhere to write and swallow every
  keystroke. They do not: JSON Forms builds the containers along the path on
  the first edit.
*/
describe('an anyOf branch whose type the value is not', () => {
  /*
    The mechanism, pinned at the level it actually lives - core's update. If
    this ever stops building the container, every assertion below turns into a
    silent data loss, so it is worth owning a test of its own.
  */
  it('has core build the container on a child write', () => {
    for (const start of ['a plain note', undefined, 42, null, {}]) {
      const state = coreReducer(
        undefined as any,
        init(start, mixedAnyOfSchema)
      );
      const next = coreReducer(
        state,
        update('note', () => 'hello')
      );
      expect(next.data, `parent ${JSON.stringify(start)}`).toEqual({
        note: 'hello',
      });
    }
  });

  it('writes nothing when the tab is selected', () => {
    const view = draw(mixedAnyOfSchema, 'a plain note');
    const before = view.writes.length;
    view.clickTab('Details');
    expect(view.writes.length).toBe(before);
    expect(view.data()).toBe('a plain note');
    view.unmount();
  });

  /* And therefore has nothing to confirm - navigation is not a change. */
  it('does not prompt', () => {
    const view = draw(mixedAnyOfSchema, 'a plain note');
    view.clickTab('Details');
    expect(document.querySelector('.ant-modal')).toBeNull();
    view.unmount();
  });

  /*
    The payoff: the branch is editable. The string is replaced at the point
    the user commits an edit - the moment they actually chose the branch -
    rather than when they merely looked at it.
  */
  it('becomes an object on the first edit', async () => {
    const view = draw(mixedAnyOfSchema, 'a plain note');
    view.clickTab('Details');
    const input = view.container.querySelector<HTMLInputElement>(
      '.ant-tabs-content-active input'
    );
    expect(input, 'the branch renders an input').toBeTruthy();
    await view.type(input!, 'hello');
    expect(view.data()).toEqual({ note: 'hello' });
    view.unmount();
  });

  it('is editable from no value at all', async () => {
    const view = draw(mixedAnyOfSchema, undefined);
    view.clickTab('Details');
    const input = view.container.querySelector<HTMLInputElement>(
      '.ant-tabs-content-active input'
    );
    expect(input).toBeTruthy();
    await view.type(input!, 'first');
    expect(view.data()).toEqual({ note: 'first' });
    view.unmount();
  });
});
