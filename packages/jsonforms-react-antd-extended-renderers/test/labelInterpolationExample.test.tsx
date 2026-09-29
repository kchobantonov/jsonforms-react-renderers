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
import { antdExtendedCells, antdExtendedRenderers } from '../src';
import config from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/config.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/uischema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/translations.json';
import { translatorFor } from '../../jsonforms-react-demo-common/src/i18nCatalogs';

/**
 * The example, tab by tab.
 *
 * It is organised per feature so that the correct-usage tabs carry **no
 * diagnostics at all** - "is everything working" is answered by looking,
 * rather than by reading each message to decide whether it was expected. The
 * failures live on one tab of their own.
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

/* Both chunks arrive through dynamic imports, so every assertion waits. */
const settle = async (ms = 90) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const draw = async (tab: string, locale = 'en') => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: any = data;
  const render = () =>
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={current}
            schema={schema as any}
            uischema={uischema as any}
            config={config}
            i18n={{
              locale,
              translate: translatorFor(translations as any, locale),
            }}
            renderers={[...antdRenderers, ...antdExtendedRenderers]}
            cells={[...antdCells, ...antdExtendedCells]}
            onChange={({ data: next }) => {
              current = next;
            }}
          />
        </ConfigProvider>
      )
    );
  render();
  await settle();

  const openTab = async (label: string) => {
    const found = Array.from(
      container.querySelectorAll<HTMLElement>('.ant-tabs-tab')
    ).find((candidate) => candidate.textContent?.trim() === label);
    if (!found) {
      throw new Error(`no tab labelled ${label}`);
    }
    act(() => found.click());
    await settle();
  };
  await openTab(tab);

  /*
    This Categorization renders no `.ant-tabs-tabpane`, and it unmounts the
    tabs it is not showing - so the container holds exactly the open tab's
    content, and scoping queries to it is both correct and unnecessary.
  */
  const pane = () => container;

  return {
    container,
    /** Text of the open tab only, so a neighbour cannot satisfy an assertion. */
    text: () => pane().textContent ?? '',
    labelWith: (needle: string) =>
      Array.from(
        pane().querySelectorAll<HTMLElement>('[data-markup-label]')
      ).find((el) => el.textContent?.includes(needle)),
    diagnostics: () =>
      Array.from(
        pane().querySelectorAll<HTMLElement>('[data-markup-diagnostic]')
      ),
    /** Types into the editor for a field, so the labels can be watched moving. */
    edit: async (title: string, value: string) => {
      const item = Array.from(
        pane().querySelectorAll<HTMLElement>('.ant-form-item')
      ).find((candidate) =>
        candidate.querySelector('label')?.textContent?.includes(title)
      );
      const input = item?.querySelector('input');
      if (!input) {
        throw new Error(`no editor for ${title}`);
      }
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!;
      act(() => {
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        /*
          A number field is an antd spinbutton and commits on blur, and React
          delegates blur from `focusout` rather than the non-bubbling `blur`.
          A text field does not need this, and is unharmed by it.
        */
        input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      });
      /*
        Longer than the usual settle: text controls debounce their writes by
        300ms, so a shorter wait reads the value before it was committed.

        No re-render either. JSON Forms updates from its own core, and
        re-rendering the whole form would reset the Categorization to its
        first tab - which is what the assertion would then be reading.
      */
      await settle(420);
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('Interpolation', () => {
  it('substitutes a static parameter', async () => {
    const view = await draw('Interpolation');
    expect(view.text()).toContain('You are subscribed to Atlas.');
    view.unmount();
  });

  /*
    Two levels: the parameter's value reads the data, the text runs an
    expression over the parameter. The plural therefore lives in the catalog,
    where each language writes its own test.
  */
  it('reads data in the parameter and runs the plural in the text', async () => {
    const view = await draw('Interpolation');
    expect(view.text()).toContain('Your plan includes 3 seats.');
    view.unmount();
  });

  /* The reason each tab carries its own editors: the text can be watched. */
  it('follows an edit, plural and all', async () => {
    const view = await draw('Interpolation');
    await view.edit('Seats', '1');
    expect(view.text()).toContain('Your plan includes 1 seat.');
    await view.edit('Seats', '7');
    expect(view.text()).toContain('Your plan includes 7 seats.');
    view.unmount();
  });

  /*
    Absent data is not an authoring error. `promoCode` is simply not in the
    record, which is the normal state of a form being filled in.
  */
  it('renders a field nobody has filled in as nothing, silently', async () => {
    const view = await draw('Interpolation');
    const promo = view.labelWith('Promotional code')!;
    expect(promo.textContent?.trim()).toBe('Promotional code:');
    expect(view.diagnostics()).toHaveLength(0);
    view.unmount();
  });

  it('leaves a doubled brace as literal text', async () => {
    const view = await draw('Interpolation');
    expect(view.text()).toContain(
      'Write {seats} to show a placeholder without resolving it.'
    );
    view.unmount();
  });
});

describe('Markdown', () => {
  it('parses the author markup and leaves braces alone', async () => {
    const view = await draw('Markdown');
    const renewal = view.labelWith('first working day')!;
    expect(renewal.querySelector('strong')?.textContent).toBe(
      'first working day'
    );
    expect(renewal.querySelector('a')?.getAttribute('href')).toBe(
      'https://example.com/billing'
    );
    view.unmount();
  });
});

describe('Both together', () => {
  it("interpolates inside the author's own markup", async () => {
    const view = await draw('Both together');
    const summary = view.labelWith('is on the Team plan')!;
    expect(summary.querySelector('strong')?.textContent).toBe(
      'Northwind Books'
    );
    expect(summary.textContent).toContain('€148.50');
    view.unmount();
  });

  /*
    `displayName` is `Ana **Petrova**` in the data. The author's markup around
    it works; the value's own asterisks are text.
  */
  it('refuses to let a data value become markup', async () => {
    const view = await draw('Both together');
    const holder = view.labelWith('Account holder')!;
    expect(holder.textContent).toContain('Ana **Petrova**');
    expect(holder.querySelector('strong')).toBeNull();
    view.unmount();
  });

  it('keeps the escaping when the value is edited to contain markup', async () => {
    const view = await draw('Both together');
    await view.edit('Account holder', '# not a heading');
    const holder = view.labelWith('Account holder')!;
    expect(holder.textContent).toContain('# not a heading');
    expect(holder.querySelector('h1')).toBeNull();
    view.unmount();
  });
});

describe('Locale and translation', () => {
  /*
    A data value is often a key rather than a word: `plan` is "Team" in every
    language. `translate` is registered into the evaluator - it cannot be
    passed in through `context`, which is what stops a host widening the
    sandbox by accident.
  */
  it('turns a data value into the language own word', async () => {
    const en = await draw('Locale and translation');
    expect(en.text()).toContain('Your plan is Team.');
    en.unmount();

    const bg = await draw('Locale and translation', 'bg');
    expect(bg.text()).toContain('Вашият план е Екип.');
    bg.unmount();
  });

  it('formats money and dates per locale from the same catalog string', async () => {
    const en = await draw('Locale and translation');
    expect(en.text()).toContain('It renews on Oct 1, 2026.');
    expect(en.text()).toContain('Seat price €49.50, or 49.50 before tax.');
    en.unmount();

    const bg = await draw('Locale and translation', 'bg');
    // Down to the trailing era marker, which no author should hand-write.
    expect(bg.text()).toContain('Дата на подновяване: 1.10.2026 г.');
    expect(bg.text()).toContain('49,50');
    bg.unmount();
  });

  it('leaves a value that is not a quantity unformatted', async () => {
    const view = await draw('Locale and translation');
    // An implicit rule would render this reference number as "2,026".
    expect(view.text()).toContain('Reference 2026 is not a quantity');
    view.unmount();
  });

  it('reports nothing on this tab', async () => {
    const view = await draw('Locale and translation');
    expect(view.diagnostics()).toHaveLength(0);
    view.unmount();
  });
});

describe('Interpolation off', () => {
  /*
    `interpolate` governs the whole feature. Without it the text is literal -
    including a data path, which is neither resolved nor reported, because
    nothing was asked for.
  */
  it('renders every placeholder as characters', async () => {
    const view = await draw('Interpolation off');
    expect(view.text()).toContain(
      'Without interpolate, {product} and {data.customerName} are just characters.'
    );
    view.unmount();
  });

  it('leaves declared parameters inert', async () => {
    const view = await draw('Interpolation off');
    expect(view.text()).toContain(
      'Declared parameters are inert too: {product}.'
    );
    expect(view.text()).not.toContain('inert too: Atlas');
    view.unmount();
  });

  it('reports nothing, because nothing was attempted', async () => {
    const view = await draw('Interpolation off');
    expect(view.diagnostics()).toHaveLength(0);
    view.unmount();
  });
});

describe('JavaScript names', () => {
  /*
    `constructor` is a legal JSON key, and the evaluator cannot read a plain
    object that has one - its type check is defeated and it rejects the whole
    map, taking every sibling with it. The evaluation is retried with the
    objects rebuilt as maps, whose entries cannot shadow `.constructor`.
  */
  it('reads a property called constructor like any other', async () => {
    const view = await draw('JavaScript names');
    expect(view.text()).toContain(
      'A property called constructor: "a perfectly ordinary value".'
    );
    view.unmount();
  });

  it('does not let it stop its siblings being read', async () => {
    const view = await draw('JavaScript names');
    expect(view.text()).toContain(
      'Its siblings are still readable: "Northwind Books".'
    );
    view.unmount();
  });

  it('needs no repair for a property called toString', async () => {
    const view = await draw('JavaScript names');
    expect(view.text()).toContain(
      'And a property called toString: "also ordinary".'
    );
    view.unmount();
  });

  it('reports nothing on this tab', async () => {
    const view = await draw('JavaScript names');
    expect(view.diagnostics()).toHaveLength(0);
    view.unmount();
  });
});

describe('Incorrect usage', () => {
  it('collects every diagnostic in the example on one tab', async () => {
    const view = await draw('Incorrect usage');
    const reasons = view
      .diagnostics()
      .map((el) => el.textContent ?? '')
      .join(' | ');
    expect(view.diagnostics()).toHaveLength(5);
    expect(reasons).toContain('Unknown variable: data');
    expect(reasons).toContain('Unknown variable: customer');
    expect(reasons).toContain("no matching overload for 'shout");
    expect(reasons).toContain('Unknown variable: nowhere');
    expect(reasons).toContain('reserved name');
    view.unmount();
  });

  /* A data path in the TEXT resolves to nothing, however open the gate is. */
  it('resolves a data path written in the text to nothing', async () => {
    const view = await draw('Incorrect usage');
    expect(view.text()).toContain('A data path in the text: ""');
    expect(view.text()).not.toContain('Northwind Books"');
    view.unmount();
  });

  it('keeps the rest of every sentence', async () => {
    const view = await draw('Incorrect usage');
    expect(view.text()).toContain('A parameter that was never declared:');
    expect(view.text()).toContain('A function that does not exist:');
    expect(view.text()).toContain('A namespace that does not exist:');
    view.unmount();
  });

  /* A reserved name is not shadowed by a parameter, and that is reported. */
  it('keeps the reserved locale rather than the parameter', async () => {
    const view = await draw('Incorrect usage');
    expect(view.text()).toContain('reserved name: "en"');
    view.unmount();
  });
});

describe('localization', () => {
  it("evaluates the catalog's expression, not the authored fallback", async () => {
    const view = await draw('Interpolation', 'bg');
    expect(view.text()).toContain('Планът ви включва 3 места.');
    expect(view.text()).toContain('Абонирани сте за Atlas.');
    view.unmount();
  });

  it('parses Markdown in the translated text too', async () => {
    const view = await draw('Both together', 'bg');
    const summary = view.labelWith('е на план Екип')!;
    expect(summary.querySelector('strong')?.textContent).toBe(
      'Northwind Books'
    );
    view.unmount();
  });
});
