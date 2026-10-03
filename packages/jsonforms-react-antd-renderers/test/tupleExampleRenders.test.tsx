import { flattenExampleNavigation } from './flattenExampleNavigation';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import config from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/config.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/uischema.json';
import { uischemas } from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/uischemas.mjs';

/*
  The spec example is otherwise only exercised by opening the demo. Its schema
  is the widest one this renderer has to cope with - nine tuples including an
  empty one, a closed tail carrying an extra value, two complex positions, one
  laid out by `options.layout` and a deliberate misconfiguration - so rendering
  it here is what keeps the shipped fixture from quietly breaking.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const render = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={flattenExampleNavigation(uischema)}
          uischemas={uischemas}
          config={config}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  return { container, unmount: () => act(() => root.unmount()) };
};

describe('the tuple-control spec example', () => {
  it('renders every tuple in it', () => {
    const { container, unmount } = render();
    // Eight controls, seven of which are real tuples plus the misconfigured one.
    expect(
      container.querySelectorAll('[data-tuple-control]').length
    ).toBeGreaterThanOrEqual(8);
    unmount();
  });

  it('draws the diagnostic exactly once, for the one control that earns it', () => {
    const { container, unmount } = render();
    expect(container.querySelectorAll('[data-tuple-diagnostic]')).toHaveLength(
      1
    );
    unmount();
  });

  it('shows the registered summaries for the complex positions', () => {
    const { container, unmount } = render();
    const text = container.textContent ?? '';
    // The street, from the Address entry's summary scope.
    expect(text).toContain('1200 NW Naito Parkway');
    // The phone string, from the Phone numbers entry's `#` summary scope.
    expect(text).toContain('+1 503 555 0142');
    unmount();
  });

  it('keeps the trailing value the closed schema forbids, with a way to remove it', () => {
    const { container, unmount } = render();
    /*
      A value past a closed tail has no schema at all, so it is edited through
      the mixed control - which is what shows it rather than hiding it, as
      section 19 requires of data the schema does not admit. It lives in an
      input, not in the document text.
    */
    const values = Array.from(
      container.querySelectorAll<HTMLInputElement>('input')
    ).map((field) => field.value);
    expect(values).toContain('Imported extra value');
    expect(
      container.querySelectorAll('[data-tuple-delete]').length
    ).toBeGreaterThan(0);
    unmount();
  });

  it('renders the empty tuple as editable positions without filling it', () => {
    const { container, unmount } = render();
    // `orderLine` is `[]`; both of its positions are still drawn.
    expect(container.textContent).toContain('Product code');
    expect(container.textContent).toContain('Quantity');
    unmount();
  });

  it('labels the uniform tuple by position and the coordinates by title', () => {
    const { container, unmount } = render();
    const text = container.textContent ?? '';
    expect(text).toContain('Item 1');
    // Coordinates carry titles, so they are not numbered.
    expect(text).toContain('X');
    expect(text).toContain('Y');
    unmount();
  });
});

describe('the survey tuple, laid out by options.layout', () => {
  const positionLabels = (container: HTMLElement) => {
    const region = Array.from(
      container.querySelectorAll<HTMLElement>('[data-tuple-layout]')
    )[0];
    return Array.from(region.querySelectorAll('.ant-form-item'))
      .map((item) => item.querySelector('label')?.textContent ?? '')
      .filter(Boolean);
  };

  it('uses the supplied layout instead of the default row', async () => {
    const { container, unmount } = render();
    expect(container.querySelectorAll('[data-tuple-layout]')).toHaveLength(1);
    unmount();
  });

  /*
    The fixture's layout puts Longitude before Latitude inside a Group, then
    Elevation below it. The reversal is what shows the order is the layout's
    and not the schema's.
  */
  it('places the positions in the layout order, not the schema order', async () => {
    const { container, unmount } = render();
    expect(positionLabels(container)).toEqual([
      'Longitude',
      'Latitude',
      'Elevation (m)',
    ]);
    unmount();
  });

  it('renders the Group the layout asks for', async () => {
    const { container, unmount } = render();
    expect(container.textContent ?? '').toContain('Ground position');
    unmount();
  });
});

/*
  The four ways a registry entry can describe a complex position, as the
  fixture's `handoffContacts` lays them out.

  A fifth - an entry that is a Control with `summary` and no `detail` - is
  absent on purpose: opening its dialog hangs. See the TODO in Adjustment 20.
*/
describe('registry entry combinations', () => {
  const openDialogFor = async (container: HTMLElement, label: string) => {
    const button = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button')
    ).find((entry) => entry.getAttribute('aria-label') === `Edit ${label}`);
    expect(button, `no Edit action for ${label}`).toBeTruthy();
    act(() => button!.click());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 120));
    });
    return document.querySelector('.ant-modal');
  };
  const labelsIn = (root: Element) =>
    Array.from(root.querySelectorAll('label'))
      .map((label) => label.textContent ?? '')
      .filter(Boolean);

  /* 1. summary + detail: the summary previews, the detail fills the dialog. */
  it('previews from summary and opens the detail', async () => {
    const { container, unmount } = render();
    expect(container.textContent).toContain('A. Ferreira');
    const dialog = await openDialogFor(container, 'Both');
    // The detail reverses the schema order, which is how we know it was used.
    expect(labelsIn(dialog!)).toEqual(['Desk', 'Name']);
    unmount();
  });

  /* 2. detail only: no summary descriptor, so the preview is the fallback. */
  it('falls back to View details, and still opens the detail', async () => {
    const { container, unmount } = render();
    const dialog = await openDialogFor(container, 'DetailOnly');
    expect(labelsIn(dialog!)).toEqual(['Desk']);
    unmount();
  });

  /* 3. "A registry entry that is already a layout remains usable directly as
        the dialog detail" - no wrapping Control, no `detail` key. */
  it('uses a layout entry directly as the dialog form', async () => {
    const { container, unmount } = render();
    const dialog = await openDialogFor(container, 'LayoutEntry');
    expect(labelsIn(dialog!)).toEqual(['Name', 'Desk']);
    unmount();
  });

  /* 4. no entry: a generated form, with every property. */
  it('generates the dialog form when nothing matches', async () => {
    const { container, unmount } = render();
    const dialog = await openDialogFor(container, 'NoEntry');
    expect(labelsIn(dialog!)).toEqual(['Name', 'Desk']);
    unmount();
  });
});
