// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vite-plus/test';
import { createAdditionalErrorStore } from '@chobantonov/jsonforms-react-extended-renderers';
import { WebComponentHost } from '../../src/app/WebComponentHost';

it('passes the emitting form’s error store to the demo action handler', () => {
  const tagName = 'test-server-errors-form';
  class TestForm extends HTMLElement {
    readonly errorStore = createAdditionalErrorStore();
  }
  customElements.define(tagName, TestForm);
  const host = document.createElement('div');
  const root = createRoot(host);
  const onAction = vi.fn();
  try {
    act(() =>
      root.render(
        <WebComponentHost
          tagName={tagName}
          props={{ data: {}, renderers: [] }}
          dark={false}
          mode='light'
          rtl={false}
          locale='en'
          validationMode='ValidateAndShow'
          rendererSettings={{}}
          onChange={vi.fn()}
          onAction={onAction}
        />,
      ),
    );
    const form = host.querySelector<TestForm>(tagName)!;
    const detail = { action: 'reportServer', params: { errors: [] } };
    form.dispatchEvent(new CustomEvent('handle-action', { detail }));
    expect(onAction).toHaveBeenCalledWith(detail, form.errorStore);
  } finally {
    act(() => root.unmount());
  }
});
