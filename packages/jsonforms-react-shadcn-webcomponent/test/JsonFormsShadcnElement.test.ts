import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import {
  JSON_FORMS_SHADCN_TAG,
  JsonFormsShadcnElement,
  registerJsonFormsShadcn,
} from '../src/JsonFormsShadcnElement';

describe('JsonFormsShadcnElement', () => {
  it('defers cleanup when a React host removes the element', async () => {
    registerJsonFormsShadcn();
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const error = vi.spyOn(console, 'error');
    try {
      flushSync(() => root.render(React.createElement(JSON_FORMS_SHADCN_TAG)));
      const element = host.firstElementChild as JsonFormsShadcnElement;
      element.schema = { type: 'string' };
      element.data = JSON.stringify('hello');
      await vi.waitFor(() =>
        expect(element.shadowRoot?.querySelector('input')).not.toBeNull()
      );
      flushSync(() => root.render(null));
      await vi.waitFor(() =>
        expect(element.shadowRoot?.childNodes.length).toBe(0)
      );
      expect(error).not.toHaveBeenCalled();
    } finally {
      root.unmount();
      host.remove();
      error.mockRestore();
    }
  });

  it('reuses the root on immediate reconnection and remounts after cleanup', async () => {
    registerJsonFormsShadcn();
    const element = document.createElement(
      JSON_FORMS_SHADCN_TAG
    ) as JsonFormsShadcnElement;
    element.schema = { type: 'string' };
    element.data = JSON.stringify('hello');
    const error = vi.spyOn(console, 'error');
    try {
      document.body.append(element);
      await vi.waitFor(() =>
        expect(element.shadowRoot?.querySelector('input')).not.toBeNull()
      );
      const input = element.shadowRoot?.querySelector('input');
      element.remove();
      document.body.append(element);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(element.shadowRoot?.querySelector('input')).toBe(input);
      element.remove();
      await vi.waitFor(() =>
        expect(element.shadowRoot?.childNodes.length).toBe(0)
      );
      document.body.append(element);
      await vi.waitFor(() =>
        expect(element.shadowRoot?.querySelector('input')).not.toBeNull()
      );
      expect(error).not.toHaveBeenCalled();
    } finally {
      element.remove();
      await Promise.resolve();
      error.mockRestore();
    }
  });

  it('waits for form properties and validates extended formats', async () => {
    registerJsonFormsShadcn();
    const element = document.createElement(
      JSON_FORMS_SHADCN_TAG
    ) as JsonFormsShadcnElement;
    const warn = vi.spyOn(console, 'warn');
    const error = vi.spyOn(console, 'error');
    document.body.append(element);
    try {
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(element.shadowRoot?.querySelector('input')).toBeNull();
      element.schema = {
        type: 'object',
        properties: { badge: { type: 'string', format: 'color' } },
      };
      element.data = { badge: '#123456' };
      element.uischema = { type: 'Control', scope: '#/properties/badge' };
      await vi.waitFor(() => {
        expect(element.shadowRoot?.querySelector('input')).not.toBeNull();
      });
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    } finally {
      element.remove();
      warn.mockRestore();
      error.mockRestore();
    }
  });

  it('uses and updates the demo translator for example labels', async () => {
    registerJsonFormsShadcn();
    const element = document.createElement(
      JSON_FORMS_SHADCN_TAG
    ) as JsonFormsShadcnElement;
    element.schema = { type: 'object' };
    element.data = {};
    element.uischema = { type: 'Label', text: 'intro.text' };
    element.translations = (id: string, fallback: string | undefined) =>
      id === 'intro.text' ? 'One schema, five presentations.' : fallback;
    document.body.append(element);
    try {
      await vi.waitFor(() => {
        expect(element.shadowRoot?.textContent).toContain(
          'One schema, five presentations.'
        );
        expect(element.shadowRoot?.textContent).not.toContain('intro.text');
      });
      element.locale = 'bg';
      element.translations = (id: string, fallback: string | undefined) =>
        id === 'intro.text' ? 'Една схема, пет представяния.' : fallback;
      await vi.waitFor(() => {
        expect(element.shadowRoot?.textContent).toContain(
          'Една схема, пет представяния.'
        );
        expect(element.shadowRoot?.textContent).not.toContain(
          'One schema, five presentations.'
        );
      });
    } finally {
      element.remove();
    }
  });

  it('ships the original Shadcn utility styles inside its shadow root', async () => {
    registerJsonFormsShadcn();
    const element = document.createElement(
      JSON_FORMS_SHADCN_TAG
    ) as JsonFormsShadcnElement;
    element.dark = true;
    element.data = { name: '' };
    element.schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    };
    element.uischema = {
      type: 'Control',
      scope: '#/properties/name',
    };

    document.body.append(element);

    await vi.waitFor(() => {
      expect(element.shadowRoot?.querySelector('input')).not.toBeNull();
    });

    const host = element.shadowRoot?.querySelector('.shadcn-jsonforms-host');
    const input = element.shadowRoot?.querySelector('input');

    expect(host?.classList).toContain('app-dark');
    expect(host?.classList).toContain('dark');
    expect(element.shadowRoot?.querySelectorAll('style')).toHaveLength(3);
    expect(input?.classList).toContain('h-9');
    expect(input?.classList).toContain('bg-transparent');
    expect(element.shadowRoot?.textContent).not.toContain(
      'name.error.required'
    );

    element.remove();
  });
});

describe('Web Component host contract', () => {
  let element: JsonFormsShadcnElement;
  beforeEach(() => {
    registerJsonFormsShadcn();
    element = document.createElement(
      JSON_FORMS_SHADCN_TAG
    ) as JsonFormsShadcnElement;
    element.schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
    };
    element.uischema = { type: 'Control', scope: '#/properties/name' };
    element.data = { name: 'Ada' };
  });
  afterEach(() => element.remove());
  it.each([true, 'true', ''])('honors readonly %j', async (readonly) => {
    element.readonly = readonly;
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')?.disabled).toBe(true)
    );
    expect(
      element.shadowRoot?.querySelector('[aria-label="Clear value"]')
    ).toBeNull();
  });
  it.each([true, false])('honors RTL %j', async (rtl) => {
    element.rtl = rtl;
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')).not.toBeNull()
    );
    expect(
      element.shadowRoot
        ?.querySelector('.shadcn-jsonforms-host')
        ?.getAttribute('dir')
    ).toBe(rtl ? 'rtl' : null);
  });
  it('updates an existing host when data changes', async () => {
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')?.value).toBe('Ada')
    );
    element.data = { name: 'Grace' };
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')?.value).toBe('Grace')
    );
  });
  it('accepts JSON attributes', async () => {
    element.setAttribute('data', JSON.stringify({ name: 'From attribute' }));
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')?.value).toBe(
        'From attribute'
      )
    );
  });
  it('emits composed change events for edits', async () => {
    const change = vi.fn();
    element.addEventListener('change', change);
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')).not.toBeNull()
    );
    const input = element.shadowRoot!.querySelector('input')!;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, 'Grace');
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await vi.waitFor(() =>
      expect(
        change.mock.calls.some(([event]) => event.detail.data.name === 'Grace')
      ).toBe(true)
    );
    const event = change.mock.calls.find(
      ([event]) => event.detail.data.name === 'Grace'
    )![0];
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });
  it('can reconnect after unmounting', async () => {
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')).not.toBeNull()
    );
    element.remove();
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')?.value).toBe('Ada')
    );
  });
});
