import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';

/*
  Two template engines, selected per element.

  `lang` chooses the engine, `config.defaultTemplateLang` supplies the default,
  and `ractive` is the default of last resort. Both engines compile strings
  into executable code, so both are gated on `allowScriptEvaluation`.
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

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 200) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const schema: any = {
  type: 'object',
  properties: {
    firstName: { type: 'string', title: 'First name' },
    note: { type: 'string', title: 'Note' },
  },
};

/** Permission is off by default, so every rendering case has to opt in. */
const allowed = { jsonformsExtended: { security: { allowScriptEvaluation: true } } };

const draw = (uischema: any, config?: any, data: any = { firstName: 'Ada', note: 'keep me' }) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current = data;
  const paint = () =>
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={current}
            schema={schema}
            uischema={uischema}
            config={config}
            renderers={[...antdRenderers, ...antdExtendedRenderers]}
            cells={antdCells}
            onChange={({ data: next }) => {
              current = next;
            }}
          />
        </ConfigProvider>
      )
    );
  paint();
  return {
    container,
    paint,
    setData: (next: any) => {
      current = next;
    },
    text: () => container.textContent ?? '',
    diagnostic: () =>
      container
        .querySelector('[data-template-diagnostic]')
        ?.getAttribute('data-template-diagnostic'),
    unmount: () => act(() => root.unmount()),
  };
};

const jsxLayout = (extra: any = {}) => ({
  type: 'TemplateLayout',
  lang: 'jsx',
  template: "<div data-out>Hello {data.firstName}</div>",
  ...extra,
});

const ractiveLayout = (extra: any = {}) => ({
  type: 'TemplateLayout',
  lang: 'ractive',
  template: '<div data-out>Hello {{data.firstName}}</div>',
  ...extra,
});

describe('choosing the engine', () => {
  it('renders the jsx profile when lang says so', async () => {
    const view = draw(jsxLayout(), allowed);
    await settle();
    expect(view.text()).toContain('Hello Ada');
    view.unmount();
  });

  it('renders the ractive profile when lang says so', async () => {
    const view = draw(ractiveLayout(), allowed);
    await settle();
    expect(view.text()).toContain('Hello Ada');
    view.unmount();
  });

  /*
    The two syntaxes are different, which is the point of selecting per
    element: a JSX template run by Ractive would print its braces literally.
  */
  it('keeps the two syntaxes apart', async () => {
    const jsxSyntaxUnderRactive = draw(
      { type: 'TemplateLayout', lang: 'ractive', template: '<div>{data.firstName}</div>' },
      allowed
    );
    await settle();
    // Ractive needs `{{ }}`; a single brace is literal text, not an error.
    expect(jsxSyntaxUnderRactive.text()).not.toContain('Ada');
    jsxSyntaxUnderRactive.unmount();
  });

  /* "Resolve the language from explicit lang, then config.defaultTemplateLang" */
  it('falls back to defaultTemplateLang when lang is absent', async () => {
    const view = draw(
      { type: 'TemplateLayout', template: '<div data-out>Hi {data.firstName}</div>' },
      { ...allowed, defaultTemplateLang: 'jsx' }
    );
    await settle();
    expect(view.text()).toContain('Hi Ada');
    view.unmount();
  });

  /* "then ractive for the default web profile" */
  it('defaults to ractive when nothing says otherwise', async () => {
    const view = draw(
      { type: 'TemplateLayout', template: '<div data-out>Hi {{data.firstName}}</div>' },
      allowed
    );
    await settle();
    expect(view.text()).toContain('Hi Ada');
    view.unmount();
  });

  /* An explicit lang beats the configured default. */
  it('prefers explicit lang over the configured default', async () => {
    const view = draw(ractiveLayout(), {
      ...allowed,
      defaultTemplateLang: 'jsx',
    });
    await settle();
    expect(view.text()).toContain('Hello Ada');
    view.unmount();
  });
});

describe('languages that cannot be honoured', () => {
  /*
    "Unknown or unsupported languages must be diagnosed rather than
    interpreted as another engine." Falling back to a default is what turns a
    typo into a form that renders the wrong thing and says nothing.
  */
  it('diagnoses an unknown lang instead of guessing', async () => {
    const view = draw(
      { type: 'TemplateLayout', lang: 'handlebars', template: '<div>x</div>' },
      allowed
    );
    await settle();
    expect(view.diagnostic()).toBe('unsupported');
    expect(view.text()).toContain('handlebars');
    view.unmount();
  });

  it('diagnoses an unknown defaultTemplateLang too', async () => {
    const view = draw(
      { type: 'TemplateLayout', template: '<div>x</div>' },
      { ...allowed, defaultTemplateLang: 'mustache' }
    );
    await settle();
    expect(view.diagnostic()).toBe('unsupported');
    view.unmount();
  });
});

describe('the script-evaluation gate', () => {
  /*
    "String evaluation requires allowScriptEvaluation=true… the renderer MUST
    NOT weaken CSP and MUST report unsupported/evaluation-disabled behavior
    instead." Both engines compile strings - JSX through `new Function`,
    Ractive per `{{ }}` expression - so both are gated.
  */
  for (const [name, layout] of [
    ['jsx', jsxLayout()],
    ['ractive', ractiveLayout()],
  ] as const) {
    it(`refuses to run the ${name} profile without permission`, async () => {
      const view = draw(layout, undefined);
      await settle();
      expect(view.diagnostic()).toBe('evaluation-disabled');
      expect(view.text()).not.toContain('Hello Ada');
      view.unmount();
    });
  }

  it('says why, rather than rendering nothing at all', async () => {
    const view = draw(jsxLayout(), undefined);
    await settle();
    expect(view.text()).toContain('allowScriptEvaluation');
    view.unmount();
  });

  it('runs once permission is granted', async () => {
    const view = draw(jsxLayout(), allowed);
    await settle();
    expect(view.diagnostic()).toBeUndefined();
    expect(view.text()).toContain('Hello Ada');
    view.unmount();
  });
});

describe('the ractive profile', () => {
  const withSlot = {
    type: 'TemplateLayout',
    lang: 'ractive',
    template:
      '<div><span data-label>Hello {{data.firstName}}</span>{{>note}}</div>',
    elements: [{ type: 'Control', scope: '#/properties/note', name: 'note' }],
  };

  /* "each named child is available as a partial that mounts its delegated renderer" */
  it('mounts a named child through its partial', async () => {
    const view = draw(withSlot, allowed);
    await settle();
    expect(view.container.querySelector('input')).toBeTruthy();
    expect(
      view.container.querySelector<HTMLInputElement>('input')?.value
    ).toBe('keep me');
    view.unmount();
  });

  /*
    The reason this profile exists: a data change patches the bound text and
    leaves the slotted control alone - same DOM node, same value. React's JSX
    path reconciles to the same outcome, but Ractive never re-runs the
    template at all.
  */
  it('updates bound text without disturbing the slotted control', async () => {
    const view = draw(withSlot, allowed);
    await settle();
    const labelBefore = view.container.querySelector('[data-label]');
    const inputBefore = view.container.querySelector('input');
    expect(labelBefore?.textContent).toContain('Ada');

    view.setData({ firstName: 'Grace', note: 'keep me' });
    view.paint();
    await settle();

    const labelAfter = view.container.querySelector('[data-label]');
    expect(labelAfter?.textContent).toContain('Grace');
    expect(labelAfter).toBe(labelBefore);
    expect(view.container.querySelector('input')).toBe(inputBefore);
    view.unmount();
  });

  /* Unnamed children "receive their decimal index as a fallback name". */
  it('names an unnamed child by its index', async () => {
    const view = draw(
      {
        type: 'TemplateLayout',
        lang: 'ractive',
        template: '<div>{{>0}}</div>',
        elements: [{ type: 'Control', scope: '#/properties/note' }],
      },
      allowed
    );
    await settle();
    expect(view.container.querySelector('input')).toBeTruthy();
    view.unmount();
  });

  /* Iteration and conditionals, the constructs the JSX profile does with JS. */
  it('iterates and branches', async () => {
    const view = draw(
      {
        type: 'TemplateLayout',
        lang: 'ractive',
        template:
          '<div data-out>{{#if data.firstName}}{{#each errors}}{{.keyword}} {{/each}}ok{{else}}none{{/if}}</div>',
      },
      allowed
    );
    await settle();
    expect(view.text()).toContain('ok');
    view.unmount();
  });
});

/*
  Addressing children, and the collision the specification does not cover.

  "Unnamed children receive their decimal index as a fallback name" - and that
  index can already be somebody's explicit name. It used to be that whichever
  child came last won the slot map and the other was never placed: no
  partial, no dispatch, no error, and a control simply missing from the form.
*/
describe('naming a template\'s children', () => {
  const twoChildren = (names: (string | undefined)[]) => ({
    type: 'TemplateLayout',
    lang: 'ractive',
    template:
      '<div><span data-zero>{{>0}}</span><span data-one>{{>1}}</span></div>',
    elements: names.map((name, index) => ({
      type: 'Control',
      scope: index === 0 ? '#/properties/firstName' : '#/properties/note',
      ...(name ? { name } : {}),
    })),
  });

  it('places both children when the indices are free', async () => {
    const view = draw(twoChildren([undefined, undefined]), allowed);
    await settle();
    expect(view.container.querySelectorAll('input')).toHaveLength(2);
    view.unmount();
  });

  /*
    The regression. Child 0 is unnamed and wants "0"; child 1 is explicitly
    named "0". The author's name wins, and child 0 is reported rather than
    disappearing.
  */
  it('does not drop a child whose index another child claimed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = draw(twoChildren([undefined, '0']), allowed);
    await settle();

    // The explicitly named child is placed at "0", as asked.
    expect(
      view.container.querySelector<HTMLInputElement>('[data-zero] input')?.value
    ).toBe('keep me');

    // And the collision is said out loud rather than swallowed.
    expect(warn).toHaveBeenCalled();
    const said = warn.mock.calls.map((call) => String(call[0])).join('\n');
    expect(said).toContain('template.childNameCollision');
    warn.mockRestore();
    view.unmount();
  });

  /* Two children claiming one name: the first keeps it, and it is reported. */
  it('reports a duplicate explicit name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = draw(twoChildren(['body', 'body']), allowed);
    await settle();
    expect(
      warn.mock.calls.map((call) => String(call[0])).join('\n')
    ).toContain('template.duplicateChildName');
    warn.mockRestore();
    view.unmount();
  });

  /*
    Section 22: runtime behaviour must not mutate the UI schema. Generating a
    name used to write it onto the authored element, so a second form sharing
    that object inherited the first one's generated names.
  */
  it('leaves the authored elements untouched', async () => {
    const uischema = twoChildren([undefined, undefined]);
    const before = JSON.parse(JSON.stringify(uischema));
    const view = draw(uischema, allowed);
    await settle();
    expect(JSON.parse(JSON.stringify(uischema))).toEqual(before);
    view.unmount();
  });
});

/*
  Where the configured default lives.

  Adjustment 1 puts every form-wide setting under `jsonformsExtended` and
  leaves element options flat. The specification spells this key
  `config.defaultTemplateLang`; the **name** is kept and only the namespace
  changes, with the flat spelling still honoured so a form written against the
  specification's literal wording keeps working.
*/
describe('the configured default language', () => {
  const noLang = {
    type: 'TemplateLayout',
    template: '<div data-out>Hi {data.firstName}</div>',
  };

  it('is read from the jsonformsExtended namespace', async () => {
    const view = draw(noLang, {
      jsonformsExtended: {
        security: { allowScriptEvaluation: true },
        defaultTemplateLang: 'jsx',
      },
    });
    await settle();
    expect(view.text()).toContain('Hi Ada');
    view.unmount();
  });

  /* The specification's flat spelling still works. */
  it('still honours the flat key underneath', async () => {
    const view = draw(noLang, { ...allowed, defaultTemplateLang: 'jsx' });
    await settle();
    expect(view.text()).toContain('Hi Ada');
    view.unmount();
  });

  it('prefers the namespaced one when both are set', async () => {
    const view = draw(noLang, {
      jsonformsExtended: {
        security: { allowScriptEvaluation: true },
        defaultTemplateLang: 'jsx',
      },
      // A leftover flat key must not override the namespaced setting.
      defaultTemplateLang: 'ractive',
    });
    await settle();
    // jsx interpolates `{data.firstName}`; ractive would print it literally.
    expect(view.text()).toContain('Hi Ada');
    view.unmount();
  });

  it('diagnoses an unknown language from the namespace too', async () => {
    const view = draw(noLang, {
      jsonformsExtended: {
        security: { allowScriptEvaluation: true },
        defaultTemplateLang: 'mustache',
      },
    });
    await settle();
    expect(view.diagnostic()).toBe('unsupported');
    view.unmount();
  });
});

/*
  A Ractive parsing rule worth knowing, because it costs an hour to find.

  Ractive reads any attribute ending in `-in`, `-out` or `-in-out` as a
  **transition directive** (`fade-in`, `fade-out`). So an ordinary-looking
  `data-out` is parsed as the transition named `data` and never reaches the
  DOM, while `data-greeting` beside it is untouched.
*/
describe('ractive attribute names', () => {
  const marker = (attribute: string) => ({
    type: 'TemplateLayout',
    lang: 'ractive',
    template: `<div><p ${attribute}>Hi {{data.firstName}}</p></div>`,
  });

  it('keeps an ordinary data attribute', async () => {
    const view = draw(marker('data-greeting'), allowed);
    await settle();
    expect(
      view.container.querySelector('[data-greeting]')?.textContent
    ).toBe('Hi Ada');
    view.unmount();
  });

  it('swallows one that ends in -out, as a transition directive', async () => {
    const view = draw(marker('data-out'), allowed);
    await settle();
    // The text is there; the attribute is not.
    expect(view.text()).toContain('Hi Ada');
    expect(view.container.querySelector('[data-out]')).toBeNull();
    view.unmount();
  });

  it('does the same for -in', async () => {
    const view = draw(marker('data-in'), allowed);
    await settle();
    expect(view.container.querySelector('[data-in]')).toBeNull();
    view.unmount();
  });
});
