import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';
import { JsonForms } from '@jsonforms/react';
import { MarkupLabelRenderer, markupLabelTester } from '../../src';

/**
 * What a reader sees when the parser's chunk does not arrive.
 *
 * markdown-it is fetched with a dynamic import, so it has a failure mode the
 * rest of the renderer does not: an offline reload, or a stale chunk hash
 * after a deploy. Suspense has no error path of its own, so without a
 * boundary that rejection throws past it and unmounts the form - a whole page
 * of controls lost because one label could not be styled.
 */
vi.mock('../../src/renderers/MarkupLabelRenderer.impl', () => {
  throw new Error('chunk unavailable');
});

const schema = { type: 'object', properties: {} } as any;
const uischema = {
  type: 'Label',
  text: '**Doors open** at 09:00.',
  options: { markup: 'markdown' },
} as any;

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
const expectedChunkFailure = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return (
    error.message === 'chunk unavailable' || expectedChunkFailure(error.cause)
  );
};
const expectedErrors: ErrorEvent[] = [];
const onExpectedError = (event: ErrorEvent) => {
  if (expectedChunkFailure(event.error)) {
    expectedErrors.push(event);
    event.preventDefault();
  }
};

beforeEach(() => {
  expectedErrors.length = 0;
  window.addEventListener('error', onExpectedError);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  window.removeEventListener('error', onExpectedError);
  document.body.innerHTML = '';
});

describe('a Markdown label whose parser never loads', () => {
  it('falls back to the unparsed text instead of taking the form down', async () => {
    await act(async () => {
      root.render(
        <JsonForms
          data={{}}
          schema={schema}
          uischema={uischema}
          renderers={[
            { tester: markupLabelTester, renderer: MarkupLabelRenderer },
          ]}
          cells={[]}
          onChange={() => undefined}
        />,
      );
      await expect(
        import('../../src/renderers/MarkupLabelRenderer.impl'),
      ).rejects.toSatisfy(expectedChunkFailure);
    });
    await vi.waitFor(async () => {
      await act(async () => {});
      expect(expectedErrors.length).toBeGreaterThan(0);
    });

    // The form is still on the page...
    const label = container.querySelector('[data-markup-label="markdown"]');
    expect(label, 'the form unmounted instead of degrading').toBeTruthy();
    // ...and so are the words, asterisks and all.
    expect(container.textContent).toContain('**Doors open** at 09:00.');
    expect(container.querySelector('strong')).toBeNull();
  });
});
