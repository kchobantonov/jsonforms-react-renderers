import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';

/*
  Every non-array renderer that discards data has to reach the shared policy.

  The array renderers have their own guard in `arrayDeleteConfirmation.test.tsx`;
  this covers the rest of section 14's covered operations - mixed type change,
  mixed tree delete, and `oneOf` branch change and clear - by driving the real
  widgets rather than by calling the policy directly, because the failure mode
  that keeps recurring is a renderer handing the policy the wrong value, not the
  policy deciding wrongly.
*/

class ResizeObserverStub {
  observe() {
    /* nothing to measure in jsdom */
  }
  unobserve() {
    /* nothing to measure in jsdom */
  }
  disconnect() {
    /* nothing to measure in jsdom */
  }
}
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const render = (schema: any, uischema: any, data: any, config?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = data;
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema}
          uischema={uischema}
          config={config}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ data: next }) => {
            latest = next;
          }}
        />
      </ConfigProvider>
    )
  );

  /**
   * Opens the first antd select and picks an option by its label.
   *
   * antd 6 renders `.ant-select-content`, not the `.ant-select-selector` older
   * guides use, and the popup portals to the body - so the option is looked up
   * on `document`, not in the container.
   */
  const choose = async (label: string) => {
    const select = container.querySelector('.ant-select');
    expect(select, 'no select was rendered').toBeTruthy();
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
    expect(option, `no option labelled ${label}`).toBeTruthy();
    act(() => option!.click());
    await settle();
  };

  const clear = async () => {
    const button = container.querySelector('.ant-select-clear');
    expect(button, 'no clear affordance was rendered').toBeTruthy();
    act(() => {
      button!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      (button as HTMLElement).click();
    });
    await settle();
  };

  return {
    container,
    choose,
    clear,
    prompted: () => Boolean(document.querySelector('.ant-modal')),
    promptFor: () =>
      document.querySelector('[data-confirm]')?.getAttribute('data-confirm'),
    accept: async () => {
      const ok = Array.from(
        document.querySelectorAll<HTMLButtonElement>('.ant-modal-footer button')
      ).find((button) => button.textContent?.includes('Yes'));
      act(() => ok!.click());
      await settle();
      await settle();
    },
    stored: () => latest,
    unmount: () => act(() => root.unmount()),
  };
};

// ------------------------------------------------------------------- mixed

const mixedSchema = {
  type: 'object',
  properties: {
    payload: {
      type: ['object', 'string', 'null'],
      additionalProperties: { type: 'string' },
    },
  },
};
const mixedUi = { type: 'Control', scope: '#/properties/payload' } as any;

describe('a mixed type change', () => {
  /*
    The fallback here is `complex`, not `always` - the one documented
    exception. A populated object is worth asking about.
  */
  it('asks before discarding a nonempty object', async () => {
    const { choose, prompted, promptFor, stored, unmount } = render(
      mixedSchema,
      mixedUi,
      { payload: { supplier: 'Cascade Supplies' } }
    );
    await settle();
    await choose('string');
    expect(prompted()).toBe(true);
    expect(promptFor()).toBe('typeChange');
    // Nothing committed yet.
    expect(stored().payload).toEqual({ supplier: 'Cascade Supplies' });
    unmount();
  });

  it('performs the change once confirmed', async () => {
    const { choose, accept, stored, unmount } = render(mixedSchema, mixedUi, {
      payload: { supplier: 'Cascade Supplies' },
    });
    await settle();
    await choose('string');
    await accept();
    expect(stored().payload).not.toEqual({ supplier: 'Cascade Supplies' });
    unmount();
  });

  /* "Inspect the old value, not the destination type." */
  it('does not ask when the old value is a simple one', async () => {
    const { choose, prompted, unmount } = render(mixedSchema, mixedUi, {
      payload: 'TASK-14',
    });
    await settle();
    await choose('object');
    expect(prompted()).toBe(false);
    unmount();
  });

  it('does not ask for an empty container, which is not complex', async () => {
    const { choose, prompted, unmount } = render(mixedSchema, mixedUi, {
      payload: {},
    });
    await settle();
    await choose('string');
    expect(prompted()).toBe(false);
    unmount();
  });

  it('asks for a simple value once the policy is always', async () => {
    const { choose, prompted, unmount } = render(
      mixedSchema,
      { ...mixedUi, options: { confirmation: { typeChange: 'always' } } },
      { payload: 'TASK-14' }
    );
    await settle();
    await choose('object');
    expect(prompted()).toBe(true);
    unmount();
  });

  it('never asks when the element says never', async () => {
    const { choose, prompted, unmount } = render(
      mixedSchema,
      { ...mixedUi, options: { confirmation: { typeChange: 'never' } } },
      { payload: { supplier: 'Cascade Supplies' } }
    );
    await settle();
    await choose('string');
    expect(prompted()).toBe(false);
    unmount();
  });

  it('does nothing at all when the current type is chosen again', async () => {
    const { choose, prompted, stored, unmount } = render(mixedSchema, mixedUi, {
      payload: { supplier: 'Cascade Supplies' },
    });
    await settle();
    await choose('object');
    // "Selecting the already selected type/branch" is not a change.
    expect(prompted()).toBe(false);
    expect(stored().payload).toEqual({ supplier: 'Cascade Supplies' });
    unmount();
  });
});

// ------------------------------------------------------------------- oneOf

const oneOfSchema = {
  type: 'object',
  properties: {
    contact: {
      type: 'object',
      oneOf: [
        {
          title: 'By email',
          properties: { email: { type: 'string' } },
          required: ['email'],
        },
        {
          title: 'By phone',
          properties: { phone: { type: 'string' } },
          required: ['phone'],
        },
      ],
    },
  },
};
const oneOfUi = { type: 'Control', scope: '#/properties/contact' } as any;

describe('a oneOf branch change', () => {
  it('asks before replacing the current branch', async () => {
    const { choose, prompted, stored, unmount } = render(oneOfSchema, oneOfUi, {
      contact: { email: 'support@example.test' },
    });
    await settle();
    await choose('By phone');
    expect(prompted()).toBe(true);
    expect(stored().contact).toEqual({ email: 'support@example.test' });
    unmount();
  });

  it('performs the change once confirmed', async () => {
    const { choose, accept, stored, unmount } = render(oneOfSchema, oneOfUi, {
      contact: { email: 'support@example.test' },
    });
    await settle();
    await choose('By phone');
    await accept();
    expect(stored().contact).not.toEqual({
      email: 'support@example.test',
    });
    unmount();
  });

  /*
    "Clearing a oneOf selection follows branchChange." This used to skip the
    prompt entirely.
  */
  it('asks when the selection is cleared', async () => {
    const { clear, prompted, stored, unmount } = render(oneOfSchema, oneOfUi, {
      contact: { email: 'support@example.test' },
    });
    await settle();
    await clear();
    expect(prompted()).toBe(true);
    expect(stored().contact).toEqual({ email: 'support@example.test' });
    unmount();
  });

  /*
    The old rule was lodash's `isEmpty`, which reports `0` and `false` as
    empty - so a branch holding `0` changed without a prompt. Section 14 counts
    them as existing values.
  */
  it('asks for a branch holding a falsy value', async () => {
    const zeroSchema = {
      type: 'object',
      properties: {
        amount: {
          type: 'object',
          oneOf: [
            {
              title: 'Fixed',
              properties: { fixed: { type: 'number' } },
              required: ['fixed'],
            },
            {
              title: 'Percent',
              properties: { percent: { type: 'number' } },
              required: ['percent'],
            },
          ],
        },
      },
    };
    const { choose, prompted, unmount } = render(
      zeroSchema,
      { type: 'Control', scope: '#/properties/amount' } as any,
      { amount: { fixed: 0 } }
    );
    await settle();
    await choose('Percent');
    expect(prompted()).toBe(true);
    unmount();
  });

  it('never asks when configured for this renderer', async () => {
    const { choose, prompted, unmount } = render(
      oneOfSchema,
      oneOfUi,
      { contact: { email: 'support@example.test' } },
      {
        jsonformsExtended: {
          confirmation: { renderers: { oneOf: { branchChange: 'never' } } },
        },
      }
    );
    await settle();
    await choose('By phone');
    expect(prompted()).toBe(false);
    unmount();
  });
});

// -------------------------------------------------------- mixed tree delete

const treeSchema = {
  type: 'object',
  properties: {
    payload: {
      type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
      additionalProperties: {
        type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
      },
      items: {
        type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
      },
    },
  },
};
const treeUi = { type: 'Control', scope: '#/properties/payload' } as any;
const treeData = () => ({
  payload: {
    supplier: 'Cascade Supplies',
    assignment: { origin: 'Portland', destination: 'Salem' },
    phases: ['PLAN-REVIEW', 'REVIEW-DONE'],
    blank: {},
  },
});

/*
  Scoped to the tree on purpose. The detail pane beside it lists the same
  properties through the dynamic-properties renderer, whose Delete carries an
  identical `aria-label` but a different catalog id (`additionalProperties`) -
  and, being a different control, does not see this element's options.
*/
const deleteTreeNode = async (container: HTMLElement, name: string) => {
  const tree = container.querySelector('.jsonforms-mixed-tree');
  expect(tree, 'the structure workspace did not render').toBeTruthy();
  const button = Array.from(
    tree!.querySelectorAll<HTMLButtonElement>('button')
  ).find((entry) => entry.getAttribute('aria-label') === `Delete ${name}`);
  expect(button, `no Delete action for ${name} in the tree`).toBeTruthy();
  act(() => button!.click());
  await settle();
};

describe('a mixed tree delete', () => {
  /*
    Tree Delete uses the shared complex fallback and prompts for nonempty containers.
  */
  it('asks before removing a node', async () => {
    const { container, prompted, promptFor, stored, unmount } = render(
      treeSchema,
      treeUi,
      treeData()
    );
    await settle();
    await deleteTreeNode(container, 'assignment');
    expect(prompted()).toBe(true);
    expect(promptFor()).toBe('delete');
    expect(stored().payload.assignment).toEqual({
      origin: 'Portland',
      destination: 'Salem',
    });
    unmount();
  });

  it('performs it once confirmed, leaving the siblings alone', async () => {
    const { container, accept, stored, unmount } = render(
      treeSchema,
      treeUi,
      treeData()
    );
    await settle();
    await deleteTreeNode(container, 'assignment');
    await accept();
    expect(
      Object.prototype.hasOwnProperty.call(stored().payload, 'assignment')
    ).toBe(false);
    expect(stored().payload.phases).toEqual(['PLAN-REVIEW', 'REVIEW-DONE']);
    expect(stored().payload.supplier).toBe('Cascade Supplies');
    unmount();
  });

  it('never asks when the element says never', async () => {
    const { container, prompted, stored, unmount } = render(
      treeSchema,
      { ...treeUi, options: { confirmation: { delete: 'never' } } },
      treeData()
    );
    await settle();
    await deleteTreeNode(container, 'assignment');
    expect(prompted()).toBe(false);
    // Proves the delete is wired up, so the tests above are not passing
    // merely because nothing can be deleted.
    expect(
      Object.prototype.hasOwnProperty.call(stored().payload, 'assignment')
    ).toBe(false);
    unmount();
  });

  /*
    A node with children used to raise the tree's own "and all of its nested
    content?" modal *as well as* the shared one - two prompts for one
    operation, the second of which no policy could switch off. Section 14:
    "one confirmation covers the operation".
  */
  it('asks exactly once for a node that has children', async () => {
    const { container, unmount } = render(treeSchema, treeUi, treeData());
    await settle();
    await deleteTreeNode(container, 'assignment');
    expect(document.querySelectorAll('.ant-modal')).toHaveLength(1);
    expect(
      document.querySelector('.ant-modal .ant-modal-title')?.textContent
    ).toBe('Delete this value?');
    unmount();
  });

  it('deletes an empty container without prompting', async () => {
    const { container, prompted, unmount } = render(
      treeSchema,
      treeUi,
      treeData()
    );
    await settle();
    // Empty containers do not prompt under the complex fallback.
    await deleteTreeNode(container, 'blank');
    expect(prompted()).toBe(false);
    unmount();
  });
});
