import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { createTranslator } from '@jsonforms/core';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import {
  ActionEvent,
  HandleActionContext,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { antdExtendedRenderers } from '../src';
import config from '@chobantonov/jsonforms-extended-spec/examples/button-actions/config.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/button-actions/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/button-actions/schema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/button-actions/translations.json';
import {
  composed as uischema,
  uischema as portableUischema,
} from '../../jsonforms-react-demo-common/src/examples/nativeSpecExamples/button-actions';

/*
  `Button`, section 14.

  The example's point is the action path: the button hands an `ActionEvent` to
  the host and awaits it, and the host decides what the command means. Here
  the command changes the form's language, which is what makes `params` worth
  having - one `setLocale` action rather than one action per language.
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

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const catalog = (locale: string) =>
  (translations as any)[locale] as Record<string, string>;

const draw = (options?: {
  handler?: (event: ActionEvent) => void | Promise<void>;
  config?: any;
  uischema?: any;
}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const events: ActionEvent[] = [];
  let locale = 'en';

  /*
    The host, in miniature: it records what it was asked to do, and honours
    `setLocale` by re-rendering the form in the requested language - exactly
    what the demo application does.
  */
  const handler =
    options?.handler ??
    ((event: ActionEvent) => {
      events.push(event);
      const next = (event.params as { locale?: unknown } | undefined)?.locale;
      if (event.action === 'setLocale' && typeof next === 'string') {
        locale = next;
        paint();
      }
    });

  const record = (event: ActionEvent) => {
    if (options?.handler) {
      events.push(event);
    }
    return handler(event);
  };

  const paint = () =>
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <HandleActionContext.Provider value={record}>
            <JsonForms
              data={data}
              schema={schema as any}
              uischema={(options?.uischema ?? uischema) as any}
              config={options?.config ?? config}
              renderers={[...antdRenderers, ...antdExtendedRenderers]}
              cells={antdCells}
              i18n={{
                locale,
                translate: createTranslator(
                  (key: string, fallback?: string) =>
                    catalog(locale)[key] ?? fallback
                ),
              }}
              onChange={() => undefined}
            />
          </HandleActionContext.Provider>
        </ConfigProvider>
      )
    );
  paint();

  /*
    The example is a `Categorization`, and antd keeps a visited panel mounted -
    so an unscoped `querySelector` would happily find a button on a tab that is
    no longer on screen. Several fixtures below are a bare `Button` with no
    tabs at all, hence the fallback to the whole container.
  */
  const scope = () =>
    container.querySelector<HTMLElement>('.ant-tabs-content-active') ??
    container;

  const find = (text: string) =>
    Array.from(scope().querySelectorAll<HTMLButtonElement>('button')).find(
      (candidate) => candidate.textContent?.trim() === text
    ) ?? null;

  return {
    container,
    events,
    locale: () => locale,
    buttons: () =>
      Array.from(scope().querySelectorAll<HTMLButtonElement>('button')),
    button: find,
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
      await settle(120);
    },
    diagnostic: () =>
      scope()
        .querySelector('[data-button-diagnostic]')
        ?.getAttribute('data-button-diagnostic'),
    unmount: () => act(() => root.unmount()),
  };
};

describe('the action path', () => {
  /* "Button action renderers call FormContext.fireActionEvent and await it." */
  it('hands the host an action and its params', async () => {
    const view = draw();
    act(() => view.button('Български')!.click());
    await settle();
    expect(view.events).toHaveLength(1);
    expect(view.events[0].action).toBe('setLocale');
    expect(view.events[0].params).toEqual({ locale: 'bg' });
    view.unmount();
  });

  /*
    `params` is what makes one command serve several buttons. Without it the
    schema would need a `setLocaleBg` action, and the host a branch per
    language.
  */
  it('distinguishes the two buttons only by their params', async () => {
    const view = draw();
    act(() => view.button('English')!.click());
    act(() => view.button('Български')!.click());
    await settle();
    expect(view.events.map((event) => event.action)).toEqual([
      'setLocale',
      'setLocale',
    ]);
    expect(view.events.map((event) => (event.params as any).locale)).toEqual([
      'en',
      'bg',
    ]);
    view.unmount();
  });

  /* The whole point of the example: the form comes back in another language. */
  it('changes the language of the form around it', async () => {
    const view = draw();
    expect(view.container.textContent).toContain(catalog('en')['intro.text']);
    act(() => view.button('Български')!.click());
    await settle();
    expect(view.locale()).toBe('bg');
    expect(view.container.textContent).toContain(catalog('bg')['intro.text']);
    // And the buttons themselves are translated, being ordinary elements.
    expect(view.button('Изпращане')).toBeTruthy();
    view.unmount();
  });

  it('carries the triggering element to the host', async () => {
    const view = draw();
    act(() => view.button('English')!.click());
    await settle();
    expect((view.events[0].element as any).type).toBe('Button');
    view.unmount();
  });
});

describe('pending and duplicate activation', () => {
  /*
    "Pending/loading covers the complete fireActionEvent promise. Duplicate
    activation SHOULD be prevented while pending."
  */
  it('prevents a second activation while the first is outstanding', async () => {
    let release: () => void = () => undefined;
    const slow = () =>
      new Promise<void>((resolve) => {
        release = resolve;
      });
    const view = draw({ handler: slow });

    act(() => view.button('English')!.click());
    act(() => view.button('English')!.click());
    act(() => view.button('English')!.click());
    expect(view.events).toHaveLength(1);

    await act(async () => {
      release();
      await Promise.resolve();
    });
    await settle();

    // And it accepts the next one once the first has finished.
    act(() => view.button('English')!.click());
    expect(view.events).toHaveLength(2);
    view.unmount();
  });

  it('marks itself busy while pending', async () => {
    let release: () => void = () => undefined;
    const view = draw({
      handler: () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    });
    act(() => view.button('English')!.click());
    expect(view.container.querySelector('[data-button-pending]')).toBeTruthy();
    await act(async () => {
      release();
      await Promise.resolve();
    });
    await settle();
    expect(view.container.querySelector('[data-button-pending]')).toBeNull();
    view.unmount();
  });

  /*
    "Rejection clears pending and propagates through existing
    application/platform error handling" - two claims, and the second one is
    why this test captures unhandled rejections.

    The renderer deliberately does not swallow the error: the reset is in a
    `finally` and there is no `catch`, so the rejection leaves the click
    handler and reaches the platform, which is where error reporters listen.
    Nothing awaits a DOM event handler, so that arrives as an unhandled
    rejection - real behaviour, and asserted here rather than left to escape.

    Left to escape is what it was doing. Vitest reported it as an unhandled
    error *attributed to whichever file happened to be running*, with every
    test still passing, which is one of the shapes the intermittent
    package-level failures took.
  */
  it('clears pending when the host rejects, and lets the error propagate', async () => {
    const rejections: unknown[] = [];
    const capture = (reason: unknown) => rejections.push(reason);
    process.on('unhandledRejection', capture);
    try {
      const view = draw({
        handler: () => Promise.reject(new Error('refused')),
      });
      act(() => view.button('English')!.click());
      await settle();
      expect(view.container.querySelector('[data-button-pending]')).toBeNull();
      view.unmount();
    } finally {
      process.off('unhandledRejection', capture);
    }

    expect(rejections).toHaveLength(1);
    expect((rejections[0] as Error).message).toBe('refused');
  });
});

describe('the script path', () => {
  /*
    "script is a string containing an async function body… Invoke it with the
    ActionEvent as `this`." So `this.context` reaches the form state.
  */
  it('runs the script with the action event as this', async () => {
    const logged: unknown[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((value) => {
      logged.push(value);
    });
    const view = draw();
    await view.selectTab('Script');
    act(() => view.button('Log the form data')!.click());
    await settle();
    expect(logged).toHaveLength(1);
    expect(logged[0]).toMatchObject({ fullName: 'Alex Moreau' });
    spy.mockRestore();
    view.unmount();
  });

  /* A script does not go through the host at all. */
  it('does not fire an action', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const view = draw();
    await view.selectTab('Script');
    act(() => view.button('Log the form data')!.click());
    await settle();
    expect(view.events).toHaveLength(0);
    spy.mockRestore();
    view.unmount();
  });

  /*
    "String evaluation requires allowScriptEvaluation=true… the renderer MUST
    NOT weaken CSP and MUST report unsupported/evaluation-disabled behavior
    instead."
  */
  it('refuses to run without permission, and says why', async () => {
    const view = draw({ config: {} });
    await view.selectTab('Script');
    expect(view.diagnostic()).toBe('script.evaluationDisabled');
    expect(view.container.textContent).toContain('allowScriptEvaluation');
    expect(view.button('Log the form data')).toBeNull();
    view.unmount();
  });

  /*
    "action and script are mutually exclusive" - stated without saying which
    wins, because an element carrying both is an authoring mistake. The XOR
    type makes it impossible in TypeScript and cannot prevent it in JSON, so
    the runtime picks the **action**: it goes to the host's handler, where it
    can be logged, refused or authorised, while a script runs arbitrary code
    with no such oversight.
  */
  it('prefers the action when an element declares both', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ran: string[] = [];
    const view = draw({
      uischema: {
        type: 'Button',
        label: 'Both',
        action: 'submit',
        script: () => {
          ran.push('script');
        },
      },
    });
    act(() => view.button('Both')!.click());
    await settle();

    expect(view.events.map((event) => event.action)).toEqual(['submit']);
    expect(ran).toEqual([]);
    view.unmount();
    warn.mockRestore();
  });

  /* And the mistake is said out loud rather than replacing the button. */
  it('warns about the conflict without hiding the button', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = draw({
      uischema: {
        type: 'Button',
        label: 'Both',
        action: 'submit',
        script: 'return 1;',
      },
    });
    await settle();
    expect(view.button('Both')).toBeTruthy();
    expect(view.diagnostic()).toBeUndefined();
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      'action.conflict'
    );
    warn.mockRestore();
    view.unmount();
  });
});

describe('naming the action', () => {
  /*
    The label is translated, so an action derived from it would change with
    the form's language - the host would answer `setLocale` in English and
    stop recognising it in Bulgarian. `name` is stable; the label is not a
    fallback at all.
  */
  it('never derives the action from the label', async () => {
    const view = draw({
      uischema: { type: 'Button', label: 'Submit' },
    });
    act(() => view.button('Submit')!.click());
    await settle();
    expect(view.events[0].action).toBe('');
    view.unmount();
  });

  it('falls back to name, which does not move with the locale', async () => {
    const view = draw({
      uischema: { type: 'Button', label: 'Submit', name: 'submitRequest' },
    });
    act(() => view.button('Submit')!.click());
    await settle();
    expect(view.events[0].action).toBe('submitRequest');
    view.unmount();
  });

  /* "Missing optional Button params are normalized to `{}`." */
  it('normalizes absent params to an empty object', async () => {
    const view = draw({
      uischema: { type: 'Button', label: 'Submit', action: 'submit' },
    });
    act(() => view.button('Submit')!.click());
    await settle();
    expect(view.events[0].params).toEqual({});
    view.unmount();
  });
});

describe('appearance', () => {
  /* Semantic names, mapped by the renderer set - `error` is antd's danger. */
  it('maps a semantic colour onto the button', async () => {
    const view = draw();
    expect(view.button('Discard')?.className).toContain('dangerous');
    view.unmount();
  });

  /* "preserving button semantics, keyboard activation, disabled behavior" */
  it('renders a disabled button that still says what it would do', async () => {
    const view = draw();
    const button = view.button('Unavailable');
    expect(button?.disabled).toBe(true);
    expect(button?.textContent).toContain('Unavailable');
    view.unmount();
  });

  it('never fires from a disabled button', async () => {
    const view = draw();
    act(() => view.button('Unavailable')!.click());
    await settle();
    expect(view.events).toHaveLength(0);
    view.unmount();
  });

  it('is a button, not a link', async () => {
    const view = draw();
    for (const button of view.buttons()) {
      expect(button.getAttribute('href')).toBeNull();
    }
    view.unmount();
  });
});

/*
  A `script` written in TypeScript instead of serialized.

  The reason this needed its own pass: a function used to be **silently
  swallowed**. It was stringified into an `AsyncFunction` body, where
  `() => { … }` is a closure expression that is created and discarded - so the
  button clicked, did nothing, and said nothing.
*/
describe('a script written as a function', () => {
  const clickable = (script: any, config?: any) => {
    const view = draw({
      uischema: { type: 'Button', label: 'Go', script },
      ...(config === undefined ? {} : { config }),
    });
    return view;
  };

  it('runs, where before it did nothing at all', async () => {
    let called = 0;
    const view = clickable(() => {
      called += 1;
    });
    act(() => view.button('Go')!.click());
    await settle();
    expect(called).toBe(1);
    view.unmount();
  });

  /*
    The event arrives as an **argument**, which is what makes an arrow usable.
    `.call()` cannot bind an arrow's `this` - it is lexical - so an idiomatic
    `() => this.context` would compile, run and read the wrong thing.
  */
  it('hands the event to an arrow function', async () => {
    let seen: any;
    const view = draw({
      uischema: {
        type: 'Button',
        label: 'Go',
        params: { tier: 'express' },
        script: (event: any) => {
          seen = {
            action: event.action,
            params: event.params,
            hasContext: !!event.context,
          };
        },
      },
    });
    act(() => view.button('Go')!.click());
    await settle();
    expect(seen).toEqual({
      action: '',
      params: { tier: 'express' },
      hasContext: true,
    });
    view.unmount();
  });

  /* `this` is bound too, so a body pasted over from the string form works. */
  it('binds this as well, for a classic function', async () => {
    let seen: any;
    const view = draw({
      uischema: {
        type: 'Button',
        label: 'Go',
        params: { tier: 'standard' },
        script: function (this: any) {
          seen = this.params;
        },
      },
    });
    act(() => view.button('Go')!.click());
    await settle();
    expect(seen).toEqual({ tier: 'standard' });
    view.unmount();
  });

  /* Awaited, as the string form is - the caller cannot tell them apart. */
  it('awaits an async function before clearing pending', async () => {
    const order: string[] = [];
    let release: () => void = () => undefined;
    const view = draw({
      uischema: {
        type: 'Button',
        label: 'Go',
        script: async () => {
          order.push('start');
          await new Promise<void>((resolve) => {
            release = resolve;
          });
          order.push('end');
        },
      },
    });
    act(() => view.button('Go')!.click());
    expect(order).toEqual(['start']);
    expect(view.container.querySelector('[data-button-pending]')).toBeTruthy();

    await act(async () => {
      release();
      await Promise.resolve();
    });
    await settle();
    expect(order).toEqual(['start', 'end']);
    expect(view.container.querySelector('[data-button-pending]')).toBeNull();
    view.unmount();
  });

  /*
    The permission is on **string** evaluation, which is what needs CSP
    `unsafe-eval`. A function the build already compiled needs none - so this
    runs with no config at all, where the string form would be refused.
  */
  it('needs no allowScriptEvaluation', async () => {
    let called = 0;
    const view = clickable(() => {
      called += 1;
    }, {});
    expect(view.diagnostic()).toBeUndefined();
    act(() => view.button('Go')!.click());
    await settle();
    expect(called).toBe(1);
    view.unmount();
  });

  it('still refuses a string without permission', async () => {
    const view = clickable('console.log(1);', {});
    expect(view.diagnostic()).toBe('script.evaluationDisabled');
    view.unmount();
  });
});

/*
  Every case the example is meant to show, asserted against the fixture itself
  rather than against hand-written schemas - so the example cannot drift from
  what the README claims about it.
*/
describe('the example covers every supported case', () => {
  const buttons = () => {
    const found: any[] = [];
    const walk = (element: any) => {
      if (element?.type === 'Button') found.push(element);
      (element?.elements ?? []).forEach(walk);
    };
    walk(uischema);
    return found;
  };

  it('shows an action, with and without params', () => {
    const withParams = buttons().filter((b) => b.params && b.action);
    expect(withParams.length).toBeGreaterThanOrEqual(2);
    expect(buttons().some((b) => b.action && !b.params)).toBe(true);
  });

  it('shows every semantic colour it claims', () => {
    const colours = new Set(
      buttons()
        .map((b) => b.color)
        .filter(Boolean)
    );
    expect(colours).toContain('primary');
    expect(colours).toContain('secondary');
    expect(colours).toContain('error');
    expect(colours).toContain('alternative');
  });

  it('shows a disabled button', () => {
    expect(buttons().some((b) => b.options?.disabled === true)).toBe(true);
  });

  it('shows both script forms', () => {
    expect(buttons().some((b) => typeof b.script === 'string')).toBe(true);
    expect(buttons().some((b) => typeof b.script === 'function')).toBe(true);
  });

  it('shows the two shapes the runtime has to cope with', () => {
    // Both declared - the action wins.
    expect(buttons().some((b) => b.action && b.script)).toBe(true);
    // Neither declared - still fires, with an empty action.
    expect(buttons().some((b) => !b.action && !b.script && !b.name)).toBe(true);
  });

  /*
    The boundary the example exists to teach: the portable half is plain JSON,
    and the function scripts are only reachable from the composed TypeScript
    model.
  */
  it('keeps the function scripts out of the portable JSON', () => {
    const portable: any[] = [];
    const walk = (element: any) => {
      if (element?.type === 'Button') portable.push(element);
      (element?.elements ?? []).forEach(walk);
    };
    walk(portableUischema);
    expect(portable.some((b) => typeof b.script === 'function')).toBe(false);
    expect(portable.some((b) => typeof b.script === 'string')).toBe(true);
    // And JSON.stringify drops them, which is exactly why they cannot travel.
    const roundTripped = JSON.parse(JSON.stringify(uischema));
    const survived: any[] = [];
    const walk2 = (element: any) => {
      if (element?.type === 'Button') survived.push(element);
      (element?.elements ?? []).forEach(walk2);
    };
    walk2(roundTripped);
    expect(
      survived.some(
        (b) => b.script !== undefined && typeof b.script !== 'string'
      )
    ).toBe(false);
  });

  /*
    By label, not by counting `<button>` elements - the text controls render
    their own clear affordances, which are buttons too.

    Every tab is visited, because that is now the only way to see them all.
    Walking the *composed* model and then visiting each tab is what keeps the
    two in step: move a button to another tab and this still passes, but drop
    one and it does not.
  */
  it('renders every one of them, across the tabs', async () => {
    const view = draw();
    await settle();

    const rendered = new Set<string>();
    const collect = () =>
      view
        .buttons()
        .map((button) => button.textContent?.trim())
        .filter(Boolean)
        .forEach((label) => rendered.add(label as string));

    collect();
    for (const tab of view.tabs()) {
      await view.selectTab(tab);
      collect();
    }

    for (const element of buttons()) {
      const label =
        (element.i18n
          ? (translations.en as Record<string, string>)[`${element.i18n}.label`]
          : undefined) ?? element.label;
      expect(Array.from(rendered), `missing button ${label}`).toContain(label);
    }
    view.unmount();
  });

  /* The split the user sees, asserted as the structure it is. */
  it('separates the three paths into three tabs', async () => {
    const view = draw();
    await settle();
    expect(view.tabs()).toEqual(['Action', 'Script', 'TypeScript']);
    view.unmount();
  });

  /*
    Each tab holds its own kind of button, which is the whole reason for the
    split - a reader on the Script tab is not looking at actions.
  */
  it.each([
    { tab: 'Action', present: 'Submit', absent: 'Log the form data' },
    { tab: 'Script', present: 'Log the form data', absent: 'Submit' },
    { tab: 'TypeScript', present: 'Arrow function', absent: 'Submit' },
  ])('puts $present on the $tab tab', async ({ tab, present, absent }) => {
    const view = draw();
    await view.selectTab(tab);
    expect(view.button(present), `${present} missing from ${tab}`).toBeTruthy();
    expect(view.button(absent), `${absent} leaked onto ${tab}`).toBeNull();
    view.unmount();
  });

  /*
    The TypeScript tab needs no permission: its scripts are functions the
    build already compiled, so there is nothing to `eval`. The string script
    on the Script tab is refused in the same run.
  */
  it('runs the function scripts with script evaluation switched off', async () => {
    const logged: unknown[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((value) => {
      logged.push(String(value));
    });
    const view = draw({ config: {} });

    await view.selectTab('Script');
    expect(view.button('Log the form data')).toBeNull();
    expect(view.diagnostic()).toBe('script.evaluationDisabled');

    await view.selectTab('TypeScript');
    act(() => view.button('Arrow function')!.click());
    await settle();
    expect(logged.join('\n')).toContain('arrow saw params');

    spy.mockRestore();
    view.unmount();
  });
});
