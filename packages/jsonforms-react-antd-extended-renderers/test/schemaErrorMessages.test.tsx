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
import { createFormsAjv } from '@chobantonov/jsonforms-react-extended-renderers';
import { ajvLocalizers } from '@chobantonov/jsonforms-react-extended-renderers/ajv-localizers';
import { antdExtendedRenderers } from '../src';

/*
  The extended validator profile, seen from the form rather than from Ajv.

  The unit tests in `jsonforms-react-extended-renderers` prove the validator
  produces the right errors. This file proves the part that could still be
  wrong afterwards: that they reach the **right control**.

  That is the whole reason `errorMessage` needs unwrapping. `ajv-errors`
  replaces the failures it covers with a single error at the enclosing
  object's path, and JSON Forms maps errors to controls by path - so left
  alone, a schema that adds friendly messages makes every field go silent.
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

const settle = async (ms = 150) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name', minLength: 3 },
    age: { type: 'number', title: 'Age', minimum: 18 },
  },
  errorMessage: {
    properties: {
      name: 'nameTooShort',
      age: 'tooYoung',
    },
  },
} as any;

const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/name' },
    { type: 'Control', scope: '#/properties/age' },
  ],
} as any;

const catalogs: Record<string, Record<string, string>> = {
  en: {
    'error.errorMessage.nameTooShort': 'Please give a longer name.',
    'error.errorMessage.tooYoung': 'Must be 18 or over.',
  },
  bg: {
    'error.errorMessage.nameTooShort': 'Моля, въведете по-дълго име.',
    'error.errorMessage.tooYoung': 'Трябва да сте на 18 или повече.',
  },
};

const draw = async (locale: string, useCatalog = true) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current = locale;

  const ajv = createFormsAjv({
    i18n: () => ({
      locale: current,
      translate: ((key: string, fallback?: string) =>
        (useCatalog ? catalogs[current]?.[key] : undefined) ?? fallback) as any,
    }),
    localizers: ajvLocalizers,
  });

  const paint = () =>
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={{ name: 'ab', age: 1 }}
            schema={schema}
            uischema={uischema}
            ajv={ajv}
            validationMode='ValidateAndShow'
            i18n={{
              locale: current,
              translate: ((key: string, fallback?: string) =>
                catalogs[current]?.[key] ?? fallback) as any,
            }}
            renderers={[...antdRenderers, ...antdExtendedRenderers]}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
  paint();
  await settle();

  /** The message antd renders under one control, by its label. */
  const messageFor = (label: string) => {
    const item = Array.from(
      container.querySelectorAll<HTMLElement>('.ant-form-item')
    ).find((candidate) =>
      candidate.querySelector('label')?.textContent?.includes(label)
    );
    return (
      item?.querySelector<HTMLElement>('.ant-form-item-explain')?.textContent ??
      ''
    );
  };

  return {
    container,
    messageFor,
    setLocale: async (next: string) => {
      current = next;
      paint();
      await settle();
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('a schema that carries its own error messages', () => {
  /*
    The claim that unwrapping exists for: each message under the field it
    belongs to, not one message under the object.
  */
  it('shows each message under its own control', async () => {
    const view = await draw('en');
    expect(view.messageFor('Name')).toContain('Please give a longer name.');
    expect(view.messageFor('Age')).toContain('Must be 18 or over.');
    view.unmount();
  });

  /* And nothing of Ajv's own wording survives for those fields. */
  it('replaces the validator wording entirely', async () => {
    const view = await draw('en');
    expect(view.messageFor('Name')).not.toContain('3 characters');
    expect(view.messageFor('Age')).not.toContain('>= 18');
    view.unmount();
  });

  it('follows the form s language', async () => {
    const view = await draw('en');
    expect(view.messageFor('Name')).toContain('Please give a longer name.');

    await view.setLocale('bg');
    expect(view.messageFor('Name')).toContain('Моля, въведете по-дълго име.');
    view.unmount();
  });

  /*
    A message that the catalog does not resolve is used literally, which is
    the same rule this renderer set applies to labels - a schema may carry a
    sentence rather than a key.
  */
  it('uses the message literally when it is not a catalog key', async () => {
    const view = await draw('en', false);
    expect(view.messageFor('Name')).toContain('nameTooShort');
    view.unmount();
  });
});

describe('a schema with no messages of its own', () => {
  const plain = {
    type: 'object',
    properties: { a: { type: 'number', title: 'A', minimum: 5 } },
  } as any;

  const drawPlain = async (locale: string) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const ajv = createFormsAjv({
      i18n: () => ({
        locale,
        translate: ((_k: string, f?: string) => f) as any,
      }),
      localizers: ajvLocalizers,
    });
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={{ a: 1 }}
            schema={plain}
            uischema={{
              type: 'VerticalLayout',
              elements: [{ type: 'Control', scope: '#/properties/a' }],
            }}
            ajv={ajv}
            validationMode='ValidateAndShow'
            renderers={[...antdRenderers, ...antdExtendedRenderers]}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    await settle();
    return {
      text: () =>
        container.querySelector<HTMLElement>('.ant-form-item-explain')
          ?.textContent ?? '',
      unmount: () => act(() => root.unmount()),
    };
  };

  /* Ajv's own wording, localized - the half that needs the locale data. */
  it('shows the validator s own message, in the form s language', async () => {
    const english = await drawPlain('en');
    expect(english.text()).toContain('>= 5');
    english.unmount();

    const bulgarian = await drawPlain('bg');
    expect(bulgarian.text()).toMatch(/[Ѐ-ӿ]/);
    bulgarian.unmount();
  });
});
