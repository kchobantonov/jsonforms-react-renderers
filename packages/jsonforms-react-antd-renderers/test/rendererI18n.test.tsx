import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { createTranslator } from '@jsonforms/core';
import { antdRenderers, antdCells } from '../src';
import { i18nDefaults } from '../src/util/i18nDefaults';

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {
      /* jsdom has no layout */
    }
    unobserve() {
      /* no-op */
    }
    disconnect() {
      /* no-op */
    }
  }
);

/** Marks every catalog entry, so an untranslated string is visible as English. */
const marking = createTranslator((key, fallback) =>
  key in i18nDefaults ? `«${key}»` : fallback
);

const render = (schema: any, uischema: any, data: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={data}
        schema={schema}
        uischema={uischema}
        renderers={antdRenderers}
        cells={antdCells}
        i18n={{ locale: 'bg', translate: marking }}
        onChange={() => undefined}
      />
    )
  );
  return { container, unmount: () => act(() => root.unmount()) };
};

const textOf = (container: HTMLElement) => {
  const labels = Array.from(container.querySelectorAll('[aria-label]')).map(
    (el) => el.getAttribute('aria-label')
  );
  const placeholders = Array.from(
    container.querySelectorAll('[placeholder]')
  ).map((el) => el.getAttribute('placeholder'));
  return [...labels, ...placeholders, container.textContent ?? ''].join(' | ');
};

describe('renderer strings reach the translator', () => {
  it('translates the additional-properties editor', () => {
    const { container, unmount } = render(
      { type: 'object', additionalProperties: { type: 'string' } },
      { type: 'Control', scope: '#' },
      { existing: 'value' }
    );
    const text = textOf(container);
    expect(text).toContain('«additionalProperties.title»');
    expect(text).toContain('«additionalProperties.namePlaceholder»');
    expect(text).toContain('«additionalProperties.add»');
    // The row actions, which name the property they act on.
    expect(text).toContain('«additionalProperties.renameNamed»');
    expect(text).toContain('«additionalProperties.deleteNamed»');
    // None of the English defaults should survive.
    expect(text).not.toContain('Additional Properties');
    expect(text).not.toContain('Property name');
    unmount();
  });

  it('translates the mixed-value tree and its type selector', () => {
    const { container, unmount } = render(
      { type: ['string', 'object'] },
      { type: 'Control', scope: '#' },
      { nested: 'x' }
    );
    const text = textOf(container);
    expect(text).toContain('«mixed.searchLabel»');
    expect(text).toContain('«mixed.searchPlaceholder»');
    expect(text).toContain('«mixed.treeLabel»');
    expect(text).toContain('«mixed.typeLabel»');
    expect(text).not.toContain('Search tree...');
    expect(text).not.toContain('Value structure');
    unmount();
  });

  it('translates the array item index marker', () => {
    const { container, unmount } = render(
      {
        type: 'array',
        items: {
          type: 'object',
          properties: { nested: { type: 'object', properties: {} } },
        },
      },
      { type: 'Control', scope: '#' },
      [{ nested: {} }]
    );
    expect(textOf(container)).toContain('«array.indexLabel»');
    unmount();
  });

  it('translates the stepper navigation buttons', () => {
    const { container, unmount } = render(
      { type: 'object', properties: { a: { type: 'string' } } },
      {
        type: 'Categorization',
        options: { variant: 'stepper', showNavButtons: true },
        elements: [
          { type: 'Category', label: 'One', elements: [] },
          { type: 'Category', label: 'Two', elements: [] },
        ],
      },
      {}
    );
    const text = textOf(container);
    expect(text).toContain('«categorization.next»');
    expect(text).toContain('«categorization.previous»');
    // The Translator returns undefined without a fallback, which would have
    // rendered these buttons empty.
    expect(text).not.toMatch(/>\s*<\/button>/);
    unmount();
  });

  /*
    The cases below are states the tests above never reach - a dialog that has
    to be opened, a message that only appears once a name is wrong, an
    attribute that is only set while a value is missing. Every one of them was
    still drawing English after this file already passed, which is the failure
    mode of a guard that only visits the default state.
  */

  it("translates the slider's not-set announcement", () => {
    const { container, unmount } = render(
      {
        type: 'object',
        /* isRangeControl needs a default, or the slider is never selected. */
        properties: {
          weight: { type: 'number', minimum: 0, maximum: 10, default: 5 },
        },
      },
      {
        type: 'Control',
        scope: '#/properties/weight',
        options: { slider: true },
      },
      {}
    );
    const announced = container
      .querySelector('[aria-valuetext]')
      ?.getAttribute('aria-valuetext');
    expect(announced).toBe('«control.notSet»');
    unmount();
  });

  it('translates the rename dialog and its name validation', async () => {
    const { container, unmount } = render(
      { type: 'object', additionalProperties: { type: 'string' } },
      { type: 'Control', scope: '#', options: { renameProperties: true } },
      { existing: 'value' }
    );
    const rename = Array.from(container.querySelectorAll('button')).find(
      (button) =>
        button.getAttribute('aria-label') ===
        '«additionalProperties.renameNamed»'
    );
    expect(rename, 'no rename action').toBeTruthy();
    await act(async () => {
      rename!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // The dialog is portalled, so it is read from the document, not the host.
    const dialog = document.querySelector('.ant-modal') as HTMLElement;
    expect(dialog, 'no rename dialog').toBeTruthy();
    const text = textOf(dialog);
    expect(text).toContain('«additionalProperties.renameNamed»');
    expect(text).toContain('«additionalProperties.namePlaceholder»');
    expect(text).not.toContain('Rename ');
    expect(text).not.toContain('Property name');

    // A name already in use: a message that exists only in this state.
    const input = dialog.querySelector('input') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set!;
      setter.call(input, 'existing');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(textOf(dialog)).not.toContain('already');
    unmount();
  });

  it('every default has a key, so nothing is looked up by its English text', () => {
    for (const key of Object.keys(i18nDefaults)) {
      expect(key).toMatch(/^[a-z][\w.]*$/i);
      expect(key).not.toContain(' ');
    }
  });
});
