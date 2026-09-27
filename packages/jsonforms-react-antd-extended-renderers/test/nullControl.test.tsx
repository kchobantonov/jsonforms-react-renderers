import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import {
  AntdNullControlRenderer,
  antdNullControlTester,
} from '../src/renderers/AntdNullControlRenderer';

/*
  A `{"type": "null"}` property can hold exactly one value, so the control's
  only question is whether that value is present.

  The three states it has to keep apart are `null`, absent, and anything else -
  and the third is not a theoretical case: data arrives from systems that wrote
  a string where a null belonged, and section 19 says to show it rather than
  quietly replace it.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const schema = {
  type: 'object',
  properties: {
    declared: { type: 'null', title: 'Nothing to declare' },
  },
};

const render = (data: any = {}, options?: Record<string, unknown>) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = data;
  let changes = 0;
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={
            {
              type: 'Control',
              scope: '#/properties/declared',
              ...(options ? { options } : {}),
            } as any
          }
          renderers={[
            ...antdRenderers,
            {
              tester: antdNullControlTester,
              renderer: AntdNullControlRenderer,
            },
          ]}
          cells={antdCells}
          onChange={({ data: next }) => {
            changes += 1;
            latest = next;
          }}
        />
      </ConfigProvider>
    )
  );

  const box = () => container.querySelector<HTMLInputElement>('input')!;
  const toggle = async () => {
    act(() => box().click());
    await settle();
    await settle();
  };

  return {
    container,
    box,
    toggle,
    changes: () => changes,
    stored: () => latest.declared,
    present: () => Object.prototype.hasOwnProperty.call(latest, 'declared'),
    unmount: () => act(() => root.unmount()),
  };
};

describe('selecting the null control', () => {
  const context = { rootSchema: schema as any, config: {} };
  const control = { type: 'Control', scope: '#/properties/declared' } as any;

  it('takes a type: null property', () => {
    expect(antdNullControlTester(control, schema as any, context)).toBe(3);
  });

  it('leaves a union containing null to the mixed control', () => {
    // `["string", "null"]` is a mixed value, not a null one.
    const union = {
      type: 'object',
      properties: { declared: { type: ['string', 'null'] } },
    };
    expect(
      antdNullControlTester(control, union as any, {
        rootSchema: union as any,
        config: {},
      })
    ).toBe(-1);
  });

  it('leaves other scalar types alone', () => {
    for (const type of ['string', 'boolean', 'number', 'object', 'array']) {
      const other = {
        type: 'object',
        properties: { declared: { type } },
      };
      expect(
        antdNullControlTester(control, other as any, {
          rootSchema: other as any,
          config: {},
        })
      ).toBe(-1);
    }
  });
});

describe('the three states of a null property', () => {
  it('is ticked when the value is null', () => {
    const { box, unmount } = render({ declared: null });
    expect(box().checked).toBe(true);
    expect(box().indeterminate).toBe(false);
    unmount();
  });

  it('is unticked when the property is absent', () => {
    const { box, unmount } = render({});
    expect(box().checked).toBe(false);
    expect(box().indeterminate).toBe(false);
    unmount();
  });

  /*
    Section 19: out-of-domain data is shown as it is. Drawing this as either
    ticked or unticked would claim the value is something it is not.
  */
  it('is indeterminate when the value is neither, and keeps it', async () => {
    const { box, stored, changes, unmount } = render({ declared: 'n/a' });
    await settle();
    expect(box().indeterminate).toBe(true);
    expect(stored()).toBe('n/a');
    // Mounting must not rewrite it; JsonForms' own initial report is the one.
    expect(changes()).toBe(1);
    unmount();
  });

  it.each([
    ['an empty string', ''],
    ['false', false],
    ['zero', 0],
  ])(
    'treats %s as out of domain rather than as absent',
    async (_label, value) => {
      const { box, stored, unmount } = render({ declared: value });
      await settle();
      expect(box().indeterminate).toBe(true);
      expect(stored()).toBe(value);
      unmount();
    }
  );
});

describe('toggling', () => {
  it('writes null when ticked', async () => {
    const { toggle, stored, present, unmount } = render({});
    await toggle();
    expect(present()).toBe(true);
    expect(stored()).toBeNull();
    unmount();
  });

  it('removes the property when unticked, rather than writing false', async () => {
    const { toggle, stored, present, unmount } = render({ declared: null });
    await toggle();
    expect(stored()).toBeUndefined();
    expect(present()).toBe(false);
    unmount();
  });

  it('replaces an out-of-domain value only on an explicit tick', async () => {
    const { toggle, stored, unmount } = render({ declared: 'n/a' });
    await toggle();
    expect(stored()).toBeNull();
    unmount();
  });

  it('is disabled when the form is read-only', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={{ declared: null }}
            schema={schema as any}
            uischema={
              { type: 'Control', scope: '#/properties/declared' } as any
            }
            readonly
            renderers={[
              ...antdRenderers,
              {
                tester: antdNullControlTester,
                renderer: AntdNullControlRenderer,
              },
            ]}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    await settle();
    expect(container.querySelector<HTMLInputElement>('input')!.disabled).toBe(
      true
    );
    act(() => root.unmount());
  });
});

describe('the label and validation', () => {
  it('shows the schema title beside the box', () => {
    const { container, unmount } = render({ declared: null });
    expect(container.textContent).toContain('Nothing to declare');
    unmount();
  });

  it('reports a required property that is absent', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={{}}
            schema={
              {
                type: 'object',
                properties: { declared: { type: 'null' } },
                required: ['declared'],
              } as any
            }
            uischema={
              { type: 'Control', scope: '#/properties/declared' } as any
            }
            renderers={[
              ...antdRenderers,
              {
                tester: antdNullControlTester,
                renderer: AntdNullControlRenderer,
              },
            ]}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    await settle();
    // Ticking the box is what satisfies `required`: the property then exists.
    expect(container.querySelector('.ant-form-item-has-error')).toBeTruthy();
    act(() => root.unmount());
  });
});
