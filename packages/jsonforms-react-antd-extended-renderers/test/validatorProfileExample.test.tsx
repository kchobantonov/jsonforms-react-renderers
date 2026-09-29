import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { createTranslator } from '@jsonforms/core';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import {
  createAjvErrorTranslator,
  createFormsAjv,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { ajvLocalizers } from '@chobantonov/jsonforms-react-extended-renderers/ajv-localizers';
import { antdExtendedRenderers } from '../src';
import config from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/config.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/schema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/translations.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/validator-profile/uischema.json';

/*
  The validator profile, through a form.

  Every assertion here is about something Ajv did before a renderer saw
  anything: reported a failure, rewrote a value, filled a field in, or said it
  in another language. The one thing the fixture must keep proving is that the
  localized wording is **the validator's**, not a translation key this
  catalog supplies - so the catalog deliberately carries no error text, and a
  test below fails if anyone adds some.
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

const ADDRESS = '/enrol?ref=AB-1234&campaign=spring#/form?source=email';

beforeEach(() => {
  window.history.replaceState({}, '', ADDRESS);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

const settle = async (ms = 200) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const catalog = (locale: string) =>
  (translations as Record<string, Record<string, string>>)[locale];

const draw = (options?: { locale?: string; config?: any }) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let locale = options?.locale ?? 'en';
  let current: any = JSON.parse(JSON.stringify(data));
  const formConfig = options?.config ?? config;

  /*
    Built exactly as the demo builds it: one validator, reading the locale and
    the permission through getters, because Ajv caches compiled schemas and a
    validator per render would recompile on every keystroke.
  */
  const ajv = createFormsAjv({
    i18n: () => ({
      locale,
      translate: createTranslator(
        (key: string, fallback?: string) => catalog(locale)?.[key] ?? fallback
      ),
    }),
    localizers: ajvLocalizers,
    allowScriptEvaluation: () =>
      formConfig?.jsonformsExtended?.security?.allowScriptEvaluation === true,
  });

  const paint = () =>
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={current}
            schema={schema as any}
            uischema={uischema as any}
            config={formConfig}
            ajv={ajv}
            validationMode='ValidateAndShow'
            i18n={{
              locale,
              translate: createTranslator(
                (key: string, fallback?: string) =>
                  catalog(locale)?.[key] ?? fallback
              ),
              /*
                Ajv's own wording, localized when the error is **rendered**.
                Core does not revalidate on a locale change, so translating at
                validation time would leave the previous language on screen
                until the data happened to change.
              */
              translateError: createAjvErrorTranslator(
                ajvLocalizers,
                () => locale
              ),
            }}
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

  const active = () =>
    container.querySelector<HTMLElement>('.ant-tabs-content-active');

  /** The message antd shows under the control whose label matches. */
  const messageFor = (label: string) => {
    const item = Array.from(
      (active() ?? container).querySelectorAll<HTMLElement>('.ant-form-item')
    ).find((candidate) =>
      candidate.querySelector('label')?.textContent?.trim().startsWith(label)
    );
    return (
      item?.querySelector<HTMLElement>('.ant-form-item-explain')?.textContent ??
      ''
    );
  };

  return {
    container,
    paint,
    active,
    messageFor,
    data: () => current,
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
    setLocale: async (next: string) => {
      locale = next;
      paint();
      await settle();
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('the example', () => {
  it('offers one tab per capability', async () => {
    const view = draw();
    await settle();
    expect(view.tabs()).toEqual([
      'Errors',
      'transform',
      'Defaults',
      'Messages in the schema',
    ]);
    view.unmount();
  });
});

describe('ordinary validator errors', () => {
  it('shows the validator s own wording', async () => {
    const view = draw();
    await view.selectTab('Errors');
    expect(view.messageFor('Full name')).toContain('3 characters');
    expect(view.messageFor('Seats')).toContain('<= 4');
    view.unmount();
  });

  /*
    The claim the example exists for: the Bulgarian wording comes from
    `ajv-i18n`, not from this catalog. `error.minLength` and friends are
    absent, so if the localizer stopped being wired the message would stay
    English rather than falling back to a key.
  */
  it('localizes them without any error key in the catalog', async () => {
    const view = draw();
    await view.selectTab('Errors');
    const english = view.messageFor('Full name');
    expect(english).toMatch(/[a-z]/);

    await view.setLocale('bg');
    const bulgarian = view.messageFor(
      catalog('bg')['fullName.label'] ?? 'Full name'
    );
    expect(bulgarian || view.messageFor('Full name')).toMatch(/[Ѐ-ӿ]/);
    view.unmount();
  });

  it('keeps the catalog free of error text, which is what makes that test mean something', () => {
    for (const locale of ['en', 'bg']) {
      const keys = Object.keys(catalog(locale));
      const errorKeys = keys.filter(
        (key) =>
          key.startsWith('error.') && !key.startsWith('error.errorMessage.')
      );
      expect(errorKeys, `${locale} defines validator error text`).toEqual([]);
    }
  });
});

describe('transform', () => {
  /* It rewrites the data as a side effect of validating - not on render. */
  it('normalises the stored values', async () => {
    const view = draw();
    await view.selectTab('transform');
    await settle();
    const tidy = view.data().tidy;
    expect(tidy.code).toBe('AB-12');
    expect(tidy.town).toBe('North Harbour');
    expect(tidy.note).toBe('Please seat us together');
    view.unmount();
  });

  /* `toEnumCase` matches the nearest declared choice rather than guessing. */
  it('matches a value to its declared choice', async () => {
    const view = draw();
    await settle();
    expect(view.data().tidy.level).toBe('Intermediate');
    view.unmount();
  });
});

describe('defaults', () => {
  it('writes a plain default into the data', async () => {
    const view = draw();
    await settle();
    expect(view.data().defaults.currency).toBe('EUR');
  });

  /* `false` is a value, not an absence - the case a truthiness check loses. */
  it('preserves a false default', async () => {
    const view = draw();
    await settle();
    expect(view.data().defaults.confirmed).toBe(false);
  });

  it('computes today and an offset from it', async () => {
    const view = draw();
    await settle();
    const { opensOn, closesOn, year } = view.data().defaults;
    expect(opensOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(
      (new Date(closesOn).getTime() - new Date(opensOn).getTime()) /
        (24 * 60 * 60 * 1000)
    ).toBe(14);
    expect(year).toBe(new Date().getFullYear());
    view.unmount();
  });

  /*
    The request-parameter case, which is the reason `searchParams` exists: an
    object field arrives holding the current query. Both halves are read - the
    ordinary query string and the one after the hash, which is where a
    hash-routed application puts them.
  */
  it('fills an object field from the page address', async () => {
    const view = draw();
    await settle();
    expect(view.data().request).toEqual({
      ref: 'AB-1234',
      campaign: 'spring',
      source: 'email',
    });
    view.unmount();
  });

  it('leaves the field empty when the address carries nothing', async () => {
    window.history.replaceState({}, '', '/enrol');
    const view = draw();
    await settle();
    expect(view.data().request).toEqual({});
    view.unmount();
  });
});

describe('a default computed by a function in the schema', () => {
  it('runs when the example grants the permission', async () => {
    const view = draw();
    await settle();
    expect(view.data().computed.greeting).toBe('Welcome, student.');
    view.unmount();
  });

  /* Section 14's gate, on the one entry point the Vue 2 original left open. */
  it('is refused without it, and says so', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = draw({ config: { restrict: true } });
    await settle();
    expect(view.data().computed.greeting).toBeUndefined();
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      'dynamicDefaults.evaluationDisabled'
    );
    view.unmount();
  });
});

describe('messages written into the schema', () => {
  it('puts each message under the control it belongs to', async () => {
    const view = draw();
    await view.selectTab('Messages in the schema');
    expect(view.messageFor('Nickname')).toContain(
      catalog('en')['error.errorMessage.nicknameRequired']
    );
    expect(view.messageFor('Age')).toContain(
      catalog('en')['error.errorMessage.tooYoung']
    );
    view.unmount();
  });

  it('follows the form s language', async () => {
    const view = draw();
    await view.selectTab('Messages in the schema');
    await view.setLocale('bg');
    expect(view.messageFor('Age')).toContain(
      catalog('bg')['error.errorMessage.tooYoung']
    );
    view.unmount();
  });

  /* A message that is a sentence rather than a key is used as written. */
  it('uses a literal message as written', async () => {
    const view = draw();
    await view.selectTab('Messages in the schema');
    expect(view.messageFor('Postcode')).toContain('four digits');
    view.unmount();
  });
});
