import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider, Input } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';
import type { TemplateRenderProps } from '@chobantonov/jsonforms-react-extended-renderers';

/*
  `TemplateLayout`, authored in TypeScript.

  The same element as the string forms, written as a function instead of
  serialized. Nothing is compiled from a string, so there is no parser and no
  `allowScriptEvaluation` - the permission exists for CSP `unsafe-eval`, which
  a function the build already compiled does not need.

  The price is portability: a function cannot be sent over the wire.
*/

(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ??
  class {
    observe() {
      /* nothing to measure in jsdom */
    }
    unobserve() {
      /* nothing to measure in jsdom */
    }
    disconnect() {
      /* nothing to measure in jsdom */
    }
  };
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const schema: any = {
  type: 'object',
  properties: {
    customer: { type: 'string', title: 'Customer' },
    schedule: { type: 'string', title: 'Schedule' },
    note: { type: 'string', title: 'Note', minLength: 3 },
  },
};

const draw = (
  uischema: any,
  data: any = { customer: 'Ada', schedule: '0 9 * * 1', note: 'ok' },
  extra: any = {}
) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current = data;
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={current}
          schema={schema}
          uischema={uischema}
          renderers={[...antdRenderers, ...antdExtendedRenderers]}
          cells={antdCells}
          onChange={({ data: next }) => {
            current = next;
          }}
          {...extra}
        />
      </ConfigProvider>
    )
  );
  return {
    container,
    data: () => current,
    text: (marker: string) =>
      container.querySelector(`[data-${marker}]`)?.textContent ?? '',
    unmount: () => act(() => root.unmount()),
  };
};

describe('selecting the TypeScript form', () => {
  /*
    By the shape of `template`, not by `lang` - a function is not written in
    any template language.
  */
  it('wins over the string engines with no lang at all', async () => {
    const view = draw({
      type: 'TemplateLayout',
      template: ({ data }: TemplateRenderProps<any>) => (
        <p data-out>Hello {data.customer}</p>
      ),
    });
    await settle();
    expect(view.text('out')).toBe('Hello Ada');
    view.unmount();
  });

  /* The whole point of the build-time form: no string, so no permission. */
  it('needs no allowScriptEvaluation', async () => {
    const view = draw({
      type: 'TemplateLayout',
      template: ({ data }: TemplateRenderProps<any>) => (
        <p data-out>{data.customer}</p>
      ),
    });
    await settle();
    // No config at all was supplied, and it still rendered.
    expect(view.text('out')).toBe('Ada');
    expect(
      view.container.querySelector('[data-template-diagnostic]')
    ).toBeNull();
    view.unmount();
  });

  /*
    A string template is untouched by any of this.

    The marker is `data-marker`, not `data-out`: Ractive parses any attribute
    ending in `-in`, `-out` or `-in-out` as a **transition directive**, so
    `data-out` silently disappears from the DOM. Nothing to do with this
    renderer, and a good way to lose an hour.
  */
  it('leaves the string form to the string engines', async () => {
    const view = draw(
      {
        type: 'TemplateLayout',
        lang: 'ractive',
        template: '<p data-marker>Hello {{data.customer}}</p>',
      },
      undefined,
      {
        config: {
          jsonformsExtended: { security: { allowScriptEvaluation: true } },
        },
      }
    );
    // The Ractive engine is behind React.lazy, so its chunk has to arrive.
    await settle(400);
    expect(view.text('marker')).toBe('Hello Ada');
    view.unmount();
  });
});

describe('placing children', () => {
  const withChildren = (template: any) => ({
    type: 'TemplateLayout',
    template,
    elements: [
      { type: 'Control', scope: '#/properties/note', name: 'note' },
      { type: 'Control', scope: '#/properties/customer' },
    ],
  });

  it('places a named child through Slot', async () => {
    const view = draw(
      withChildren(({ Slot }: TemplateRenderProps<any>) => (
        <div data-out>
          <Slot name='note' />
        </div>
      ))
    );
    await settle();
    expect(
      view.container.querySelector<HTMLInputElement>('[data-out] input')?.value
    ).toBe('ok');
    view.unmount();
  });

  /* An unnamed child still takes its decimal index. */
  it('places an unnamed child by index', async () => {
    const view = draw(
      withChildren(({ Slot }: TemplateRenderProps<any>) => (
        <div data-out>
          <Slot name='1' />
        </div>
      ))
    );
    await settle();
    expect(
      view.container.querySelector<HTMLInputElement>('[data-out] input')?.value
    ).toBe('Ada');
    view.unmount();
  });

  /* Section 13's fallback, and a diagnostic rather than silence. */
  it('renders the fallback for a name no child answers to', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = draw(
      withChildren(({ Slot }: TemplateRenderProps<any>) => (
        <div data-out>
          <Slot name='typo'>
            <em data-fallback>nothing here</em>
          </Slot>
        </div>
      ))
    );
    await settle();
    expect(view.text('fallback')).toBe('nothing here');
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      'template.unknownSlot'
    );
    warn.mockRestore();
    view.unmount();
  });

  /*
    `elements` gives the **definitions**, so a template can inspect a child
    before deciding how to place it.
  */
  it('exposes the child elements for inspection', async () => {
    const view = draw(
      withChildren(({ elements }: TemplateRenderProps<any>) => (
        <div data-out>
          {elements.note.type}:{(elements.note as any).scope}
        </div>
      ))
    );
    await settle();
    expect(view.text('out')).toBe('Control:#/properties/note');
    view.unmount();
  });
});

describe('what the template is handed', () => {
  const probe = (render: (p: TemplateRenderProps<any>) => React.ReactNode) =>
    draw({ type: 'TemplateLayout', template: render, elements: [] });

  it('carries the path, schema and errors', async () => {
    const view = probe(({ path, schema: s, errors }) => (
      <div data-out>
        {JSON.stringify({
          path,
          title: (s as any).properties.customer.title,
          errors: errors.length,
        })}
      </div>
    ));
    await settle();
    const seen = JSON.parse(view.text('out'));
    expect(seen.path).toBe('');
    expect(seen.title).toBe('Customer');
    view.unmount();
  });

  it('reports errors from the form', async () => {
    const view = draw(
      {
        type: 'TemplateLayout',
        template: ({ errors }: TemplateRenderProps<any>) => (
          <div data-out>{errors.length}</div>
        ),
      },
      { customer: 'Ada', schedule: '', note: 'x' } // note is too short
    );
    await settle();
    expect(Number(view.text('out'))).toBeGreaterThan(0);
    view.unmount();
  });
});

/*
  The case that drove the design: a control-like widget the registry knows
  nothing about - a cron expression editor - drawn by the template and bound
  through the normal change dispatch.
*/
describe('a bound widget the registry does not know', () => {
  const cron = (extra: any = {}) =>
    draw(
      {
        type: 'TemplateLayout',
        template: ({
          data,
          path,
          handleChange,
          enabled,
        }: TemplateRenderProps<any>) => (
          <Input
            data-cron
            disabled={!enabled}
            value={data.schedule}
            onChange={(e) =>
              handleChange(
                path ? `${path}.schedule` : 'schedule',
                e.target.value
              )
            }
          />
        ),
      },
      undefined,
      extra
    );

  it('writes through the normal dispatch', async () => {
    const view = cron();
    await settle();
    const input = view.container.querySelector<HTMLInputElement>('input')!;
    expect(input.value).toBe('0 9 * * 1');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!;
      setter.call(input, '*/5 * * * *');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    expect(view.data().schedule).toBe('*/5 * * * *');
    view.unmount();
  });

  /*
    "engine two-way binding must not bypass readonly/restrict or normal form
    change dispatch" - so a write while the form is read-only does nothing.
  */
  it('refuses to write while the form is read-only', async () => {
    const view = cron({ readonly: true });
    await settle();
    const input = view.container.querySelector<HTMLInputElement>('input')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!;
      setter.call(input, 'should not stick');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
    expect(view.data().schedule).toBe('0 9 * * 1');
    view.unmount();
  });
});

describe('visibility', () => {
  it('obeys a rule', async () => {
    const view = draw({
      type: 'TemplateLayout',
      template: ({ data }: TemplateRenderProps<any>) => (
        <p data-out>{data.customer}</p>
      ),
      rule: {
        effect: 'HIDE',
        condition: { scope: '#/properties/customer', schema: { const: 'Ada' } },
      },
    });
    await settle();
    expect(view.container.querySelector('[data-out]')).toBeNull();
    view.unmount();
  });
});

/*
  `context` is section 3's `FormContext`, not a bag of whatever the renderer
  happened to have. It used to be `{ locale }`, which left `readonly`
  unreachable - and readonly is exactly what a template drawing its own widget
  needs, because **readonly and disabled are different states**.
*/
describe('the form context', () => {
  const contextProbe = (extra: any = {}) =>
    draw(
      {
        type: 'TemplateLayout',
        template: ({
          context,
          readonly,
          enabled,
        }: TemplateRenderProps<any>) => (
          <span data-out>
            {JSON.stringify({
              keys: Object.keys(context).sort(),
              readonly,
              enabled,
              ctxReadonly: context.readonly,
              locale: context.locale,
            })}
          </span>
        ),
      },
      undefined,
      extra
    );

  it('carries the fields section 3 declares', async () => {
    const view = contextProbe();
    await settle();
    const seen = JSON.parse(view.text('out'));
    expect(seen.keys).toEqual([
      'additionalErrors',
      'config',
      'data',
      'errors',
      'fireActionEvent',
      'locale',
      'readonly',
      'schema',
      'translate',
      'uischema',
    ]);
    view.unmount();
  });

  /* The gap that prompted this: a widget must tell the two states apart. */
  it('distinguishes readonly from disabled', async () => {
    const editable = contextProbe();
    await settle();
    expect(JSON.parse(editable.text('out'))).toMatchObject({
      readonly: false,
      enabled: true,
    });
    editable.unmount();

    const locked = contextProbe({ readonly: true });
    await settle();
    const seen = JSON.parse(locked.text('out'));
    // Read-only disables as well, but says *why* it is disabled.
    expect(seen).toMatchObject({
      readonly: true,
      enabled: false,
      ctxReadonly: true,
    });
    locked.unmount();
  });

  it('carries the locale', async () => {
    const view = contextProbe({ i18n: { locale: 'bg' } });
    await settle();
    expect(JSON.parse(view.text('out')).locale).toBe('bg');
    view.unmount();
  });
});
