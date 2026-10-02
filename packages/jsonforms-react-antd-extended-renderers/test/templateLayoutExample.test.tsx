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
import config from '@chobantonov/jsonforms-extended-spec/examples/template-layout/config.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/template-layout/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/template-layout/schema.json';
import { composed as uischema } from '../../jsonforms-react-demo-common/src/examples/nativeSpecExamples/template-layout';

/*
  The three-engine fixture. All three templates express the same five things,
  so the example is a comparison - and this file is what keeps the columns
  agreeing.

  Two of them are strings (`lang: "jsx"`, `lang: "ractive"`) and come from
  `uischema.json`. The third is a **function**, which has no JSON spelling, so
  its tab is appended in the example's `index.tsx` - and that is why this file
  imports `composed` rather than the raw JSON.

  The engines sit in separate categories, so only one is mounted at a time and
  every assertion below starts by selecting its tab. That is also the point of
  the arrangement: an engine is fetched when its category is opened, not when
  the form loads.
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

const settle = async (ms = 250) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const draw = (override?: any, configOverride?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: any = { ...data, ...(override ?? {}) };
  const paint = () =>
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={current}
            schema={schema as any}
            uischema={uischema as any}
            config={configOverride ?? config}
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

  /*
    Scoped to the tab panel on screen. antd keeps a visited panel mounted, so
    an unscoped selector would happily read the other engine's output - and
    since both templates print the same words, that would pass either way.
  */
  const active = () =>
    container.querySelector<HTMLElement>('.ant-tabs-content-active');

  /** Both engines emit the same markers, so one selector serves either. */
  const text = (marker: string) =>
    active()?.querySelector<HTMLElement>(`[data-${marker}]`)?.textContent ?? '';

  return {
    container,
    paint,
    text,
    active,
    slotInput: () =>
      active()?.querySelector<HTMLInputElement>('[data-slot] input') ?? null,
    tabs: () =>
      Array.from(container.querySelectorAll<HTMLElement>('.ant-tabs-tab')).map(
        (tab) => tab.textContent ?? ''
      ),
    selectTab: async (label: string) => {
      const tab = Array.from(
        container.querySelectorAll<HTMLElement>('.ant-tabs-tab')
      ).find((candidate) => candidate.textContent?.includes(label));
      expect(tab, `no tab labelled ${label}`).toBeTruthy();
      act(() => tab!.click());
      await settle();
    },
    setData: (next: any) => {
      current = next;
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('the two engines, split into categories', () => {
  it('offers one category per engine, plus the resolution rules', async () => {
    const view = draw();
    await settle();
    expect(view.tabs()).toEqual([
      'lang: jsx',
      'lang: ractive',
      'native (TypeScript)',
      'Language resolution',
      'Nested slots',
    ]);
    view.unmount();
  });

  /*
    The shared controls sit above the categorization, so they stay on screen
    whichever engine is selected - otherwise the reactivity the example is
    about could not be seen.
  */
  it('keeps the controls that drive both engines outside the tabs', async () => {
    const view = draw();
    await settle();
    const labels = Array.from(
      view.container.querySelectorAll<HTMLElement>('.ant-form-item label')
    ).map((label) => label.textContent);
    expect(labels).toContain('Customer');
    await view.selectTab('lang: ractive');
    const after = Array.from(
      view.container.querySelectorAll<HTMLElement>('.ant-form-item label')
    ).map((label) => label.textContent);
    expect(after).toContain('Customer');
    view.unmount();
  });

  /*
    A visited panel stays mounted, which is what lets a tab keep its state -
    but each panel must go on rendering its own category. When it did not, both
    engines ran the selected template and the two notes below came back equal.
  */
  it('leaves each engine rendering its own template', async () => {
    const view = draw();
    await view.selectTab('lang: ractive');
    const notes = Array.from(
      view.container.querySelectorAll<HTMLElement>('.ant-tabs-content')
    ).map(
      (panel) =>
        panel.querySelector<HTMLInputElement>('[data-slot] input')?.value
    );
    expect(notes).toEqual(['Seat near the front, please.', 'Vegetarian meal.']);
    view.unmount();
  });
});

/*
  Every behaviour, asserted against each engine in turn. The expectations are
  identical by design: the two templates say the same thing in two syntaxes,
  and if they ever stop agreeing the example has stopped being a comparison.
*/
describe.each([
  { engine: 'jsx', tab: 'lang: jsx', note: 'Seat near the front, please.' },
  { engine: 'ractive', tab: 'lang: ractive', note: 'Vegetarian meal.' },
  {
    engine: 'native',
    tab: 'native (TypeScript)',
    note: 'Wheelchair access needed.',
  },
])('the $engine profile', ({ tab, note }) => {
  it('interpolates data', async () => {
    const view = draw();
    await view.selectTab(tab);
    expect(view.text('greeting')).toBe('Hello Northwind Books');
    view.unmount();
  });

  it('branches', async () => {
    const priority = draw({ priority: true });
    await priority.selectTab(tab);
    expect(priority.text('branch')).toBe('Priority booking');
    priority.unmount();

    const standard = draw({ priority: false });
    await standard.selectTab(tab);
    expect(standard.text('branch')).toBe('Standard booking');
    standard.unmount();
  });

  /*
    The case that separates the two expression languages: JSX joins with
    `.map().join(', ')`, and Ractive - which has no function literals - uses
    `{{#each}}` with an index guard. Same output, including the space after the
    comma, which a literal separator in a Ractive template would lose.
  */
  it('iterates to the same string', async () => {
    const view = draw();
    await view.selectTab(tab);
    expect(view.text('list')).toBe('Contacts: Ann, Bo, Cy');
    view.unmount();
  });

  it('slots a delegated renderer', async () => {
    const view = draw();
    await view.selectTab(tab);
    expect(view.slotInput()?.value).toBe(note);
    view.unmount();
  });

  /*
    The reactivity claim: editing a control outside the tabs repaints the
    template without disturbing the control slotted inside it.
  */
  it('updates without remounting its slotted control', async () => {
    const view = draw();
    await view.selectTab(tab);
    const before = view.slotInput();
    expect(before).toBeTruthy();

    view.setData({ ...data, customerName: 'Riverside Bakery' });
    view.paint();
    await settle();

    expect(view.text('greeting')).toBe('Hello Riverside Bakery');
    // Same DOM node: the template was patched around it, not rebuilt with it.
    expect(view.slotInput()).toBe(before);
    view.unmount();
  });
});

/*
  The other half of `elements`, which only the jsx profile can express: Ractive
  places children as named partials and has no "all of them" spelling. It is in
  the example because it is the shape that broke - a named child reached
  through the array rather than by its name (adjustment 28.3).
*/
describe('the jsx profile rendering the whole elements array', () => {
  it('mounts both children, named and unnamed', async () => {
    const view = draw();
    await view.selectTab('lang: jsx');
    const block = view.active()?.querySelector<HTMLElement>('[data-children]');
    expect(block, 'the array template rendered nothing').toBeTruthy();
    const values = Array.from(
      block!.querySelectorAll<HTMLInputElement>('input')
    ).map((input) => input.value);
    expect(values).toEqual(['REG-4417', '2']);
    view.unmount();
  });
});

/*
  What only the native tab has. The two string profiles can reach neither a
  local component nor a compile-time type, which is the reason the tab exists
  alongside them rather than instead of them.
*/
describe('the native profile', () => {
  it('renders a component the registry never saw', async () => {
    const view = draw();
    await view.selectTab('native (TypeScript)');
    const pill = view.active()?.querySelector('[data-pill]');
    expect(pill, 'the local component did not render').toBeTruthy();
    expect(pill?.textContent).toContain('problems');
    view.unmount();
  });

  /* `readonly` is a separate binding from `enabled`, and the template shows it. */
  it('is told the form is editable', async () => {
    const view = draw();
    await view.selectTab('native (TypeScript)');
    expect(
      view.active()?.querySelector('[data-native-extra]')?.textContent
    ).toContain('editable');
    view.unmount();
  });

  /*
    A slot nobody declared renders its children rather than nothing, and says
    so - the silence is what makes a mistyped slot name expensive.
  */
  it('falls back for an undeclared slot, and warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = draw();
    await view.selectTab('native (TypeScript)');
    expect(
      view.active()?.querySelector('[data-fallback]')?.textContent
    ).toContain('nothing is named that');
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      'template.unknownSlot'
    );
    warn.mockRestore();
    view.unmount();
  });

  /*
    "No parser, no permission." The string engines are both refused without
    `allowScriptEvaluation`; a function the build already compiled needs
    nothing, so the same run shows one working and the others explaining
    themselves.
  */
  it('renders with script evaluation switched off', async () => {
    const view = draw(undefined, {});
    await view.selectTab('native (TypeScript)');
    expect(view.text('greeting')).toBe('Hello Northwind Books');

    await view.selectTab('lang: jsx');
    expect(
      view.active()?.querySelector('[data-template-diagnostic]')
    ).toBeTruthy();
    view.unmount();
  });

  /* A function has no JSON spelling, so the third tab cannot travel. */
  it('disappears when the model is serialized', () => {
    const roundTripped = JSON.parse(JSON.stringify(uischema));
    const templates: any[] = [];
    const walk = (element: any) => {
      if (element?.type === 'TemplateLayout') templates.push(element);
      (element?.elements ?? []).forEach(walk);
    };
    walk(roundTripped);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some((t) => t.template === undefined)).toBe(true);
  });
});

describe('the language-resolution category', () => {
  /* "then config.defaultTemplateLang" - the fixture sets it to ractive. */
  it('resolves a template with no lang from config', async () => {
    const view = draw();
    await view.selectTab('Language resolution');
    expect(view.text('default')).toBe('Resolved by config: Northwind Books');
    view.unmount();
  });

  /* "Unknown or unsupported languages must be diagnosed." */
  it('diagnoses an unknown language rather than rendering it', async () => {
    const view = draw();
    await view.selectTab('Language resolution');
    const diagnostic = view.container.querySelector(
      '[data-template-diagnostic="unsupported"]'
    );
    expect(diagnostic).toBeTruthy();
    expect(diagnostic?.textContent).toContain('handlebars');
    expect(view.container.textContent).not.toContain('never rendered');
    view.unmount();
  });
});
