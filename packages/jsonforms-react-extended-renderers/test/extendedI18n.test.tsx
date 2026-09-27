import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  JsonForms,
  JsonFormsStateProvider,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import { createTranslator, rankWith, scopeEndsWith } from '@jsonforms/core';
import { GenericAdditionalProperties } from '../src/renderers/GenericAdditionalProperties';
import { createLazyTemplate } from '../src/util/lazyTemplate';
import { useDurationControl } from '../src/util/useDurationControl';
import { extendedI18nDefaults } from '../src/util/i18nDefaults';

/*
  The counterpart of the antd package's `rendererI18n.test.tsx`, for the
  strings this package owns. Every one of these was English until now: the
  generic additional-properties editor in full, the duration format message,
  the template engine's loading and failure text, and the code editor's
  accessible name.
*/

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

/** Marks every catalog entry, so an untranslated string is visible as English. */
const marking = createTranslator((key, fallback) =>
  key in extendedI18nDefaults ? `«${key}»` : fallback
);

const i18n = { locale: 'bg', translate: marking };

const mount = async (node: React.ReactNode) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  return { container, unmount: () => act(() => root.unmount()) };
};

const textOf = (container: HTMLElement) =>
  [
    ...Array.from(container.querySelectorAll('[aria-label]')).map((el) =>
      el.getAttribute('aria-label')
    ),
    ...Array.from(container.querySelectorAll('[placeholder]')).map((el) =>
      el.getAttribute('placeholder')
    ),
    container.textContent ?? '',
  ].join(' | ');

describe('extended renderer strings reach the translator', () => {
  it('translates the generic additional-properties editor', async () => {
    const schema: any = {
      type: 'object',
      additionalProperties: { type: 'string' },
    };
    const { container, unmount } = await mount(
      <JsonFormsStateProvider
        initState={{
          core: { data: {}, schema, uischema: undefined as any },
          i18n,
        }}
      >
        <GenericAdditionalProperties
          data={{ existing: 'value' }}
          enabled
          handleChange={() => undefined}
          label='Extras'
          path='root'
          rootSchema={schema}
          schema={schema}
          uischema={{ type: 'Control', scope: '#' }}
        />
      </JsonFormsStateProvider>
    );
    const text = textOf(container);
    expect(text).toContain('«additionalProperties.addTo»');
    expect(text).toContain('«additionalProperties.namePlaceholder»');
    expect(text).toContain('«additionalProperties.add»');
    expect(text).toContain('«additionalProperties.rename»');
    expect(text).toContain('«additionalProperties.delete»');
    expect(text).not.toContain('Property name');
    expect(text).not.toContain('Add property to');
    unmount();
  });

  it('translates the name validation, which only appears once a name is wrong', async () => {
    const schema: any = {
      type: 'object',
      additionalProperties: { type: 'string' },
    };
    const { container, unmount } = await mount(
      <JsonFormsStateProvider
        initState={{
          core: { data: {}, schema, uischema: undefined as any },
          i18n,
        }}
      >
        <GenericAdditionalProperties
          data={{ existing: 'value' }}
          enabled
          handleChange={() => undefined}
          label='Extras'
          path='root'
          rootSchema={schema}
          schema={schema}
          uischema={{ type: 'Control', scope: '#' }}
        />
      </JsonFormsStateProvider>
    );
    const input = container.querySelector('input') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!;
      setter.call(input, 'existing');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(textOf(container)).toContain('«additionalProperties.nameTaken»');
    expect(textOf(container)).not.toContain('already defined');
    unmount();
  });

  it('translates the duration format message', async () => {
    let message: string | undefined;
    /*
      Wrapped, not bare: `useDurationControl` reads `props.data`, which only a
      control-props HOC supplies. A plain renderer gets schema and path and
      would report no value at all - and an empty value is not invalid, so the
      assertion would pass against nothing.
    */
    const Probe = withJsonFormsControlProps((props: any) => {
      message = useDurationControl(props).error as string;
      return null;
    });
    const { unmount } = await mount(
      <JsonForms
        data={{ span: 'not a duration' }}
        schema={
          {
            type: 'object',
            /*
              No `format`, so ajv says nothing: the control's own message is
              the fallback for text that is not a duration, and `props.errors`
              takes precedence over it.
            */
            properties: { span: { type: 'string' } },
          } as any
        }
        uischema={{ type: 'Control', scope: '#/properties/span' } as any}
        renderers={[
          { tester: rankWith(10, scopeEndsWith('span')), renderer: Probe },
        ]}
        i18n={i18n}
        onChange={() => undefined}
      />
    );
    expect(message).toBe('«duration.invalid»');
    unmount();
  });

  it('translates the template engine loading and failure text', async () => {
    const never = new Promise<never>(() => undefined);
    const Loading = createLazyTemplate<Record<string, never>>(() => never, {
      loading: 'template.loading',
      error: 'template.loadError',
    });
    const { container, unmount } = await mount(
      <JsonFormsStateProvider
        initState={{
          core: { data: {}, schema: {}, uischema: undefined as any },
          i18n,
        }}
      >
        <Loading />
      </JsonFormsStateProvider>
    );
    expect(container.textContent).toBe('«template.loading»');
    unmount();
  });

  it('every default has a key, so nothing is looked up by its English text', () => {
    for (const key of Object.keys(extendedI18nDefaults)) {
      expect(key).toMatch(/^[a-z][\w.]*$/i);
      expect(key).not.toContain(' ');
    }
  });
});
