import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { MarkupLabelRenderer, markupLabelTester } from '../src';

/**
 * Which chunk a label actually reaches for.
 *
 * The evaluator is made **unloadable** here, so any code path that needs it
 * degrades visibly while every path that does not is unaffected. That is a
 * stronger statement than reading the build output: a bundler can split two
 * chunks correctly and the renderer can still import the wrong one at
 * runtime.
 *
 * The Markdown side has the same guard in `markupLabelFallback.test.tsx`.
 */
vi.mock('../src/util/celTemplate', () => {
  throw new Error('the evaluator must not be requested here');
});

const schema: any = { type: 'object', properties: {} };

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
  consoleError.mockRestore();
});

const draw = async (uischema: any) => {
  act(() =>
    root.render(
      <JsonForms
        data={{}}
        schema={schema}
        uischema={uischema}
        config={{ jsonformsExtended: { dynamicValues: { enabled: true } } }}
        renderers={[
          { tester: markupLabelTester, renderer: MarkupLabelRenderer },
        ]}
        cells={[]}
        onChange={() => undefined}
      />
    )
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
};

describe('a label reaches only for what it needs', () => {
  /* Markdown without interpolation must never touch the evaluator. */
  it('parses Markdown while the evaluator is unloadable', async () => {
    await draw({
      type: 'Label',
      text: '**Doors open** at 09:00.',
      options: { markup: 'markdown' },
    });
    await vi.waitFor(
      async () => {
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        });
        expect(container.querySelector('strong')?.textContent).toBe(
          'Doors open'
        );
      },
      { timeout: 5000 }
    );
  });

  /*
    `interpolate: true` is a declaration of intent, not a download. A template
    with no placeholder is finished by the eager split, so the chunk is never
    requested - and the brace escaping still applies.
  */
  it('resolves a placeholder-free template without the evaluator', async () => {
    await draw({
      type: 'Label',
      text: 'Seats are limited. {{note}} is literal.',
      options: { interpolate: true },
    });
    expect(container.textContent).toContain(
      'Seats are limited. {note} is literal.'
    );
  });

  it('still needs no evaluator when that text is also Markdown', async () => {
    await draw({
      type: 'Label',
      text: '**Seats** are limited.',
      options: { interpolate: true, markup: 'markdown' },
    });
    await vi.waitFor(
      async () => {
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        });
        expect(container.querySelector('strong')?.textContent).toBe('Seats');
      },
      { timeout: 5000 }
    );
  });

  /*
    The control case. With a real placeholder the chunk IS required, so a
    broken one must degrade to safe literal text rather than throw - which
    also proves the three assertions above are not passing vacuously.
  */
  it('degrades to safe literal text when it genuinely needs the evaluator', async () => {
    await draw({
      type: 'Label',
      text: 'Welcome, {name}!',
      options: {
        interpolate: true,
        textParams: { name: '{data.firstName}' },
      },
    });
    expect(container.textContent).toContain('Welcome, !');
    expect(container.textContent).not.toContain('{name}');
    // The form is still standing.
    expect(container.querySelector('[data-markup-label]')).toBeTruthy();
  });
});
