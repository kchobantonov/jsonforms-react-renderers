import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import {
  CellSummary,
  ItemProvider,
} from '../../jsonforms-react-renderer-common/src/CellSummary';
import { MarkupLabelRenderer, markupLabelTester } from '../src';
import { it, expect } from 'vitest';

it('interpolates summaries with separate root and row namespaces and updates with the row', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const Summary = () => (
    <ItemProvider path='contact'>
      <CellSummary
        schema={{ type: 'object' }}
        path='contact'
        uischema={
          {
            type: 'Label',
            text: '{root}: {city}',
            options: {
              interpolate: true,
              textParams: { root: '{data.city}', city: '{item.city}' },
            },
          } as any
        }
      />
    </ItemProvider>
  );
  const render = async (city: string, enabled = true) => {
    await act(async () => {
      root.render(
        <JsonForms
          schema={{ type: 'object' }}
          data={{ city: 'Wrong root', contact: { city } }}
          config={{ jsonformsExtended: { dynamicValues: { enabled } } }}
          uischema={{ type: 'SummaryTest' }}
          renderers={[
            {
              tester: (ui) => (ui.type === 'SummaryTest' ? 100 : -1),
              renderer: () => <Summary />,
            },
            { tester: markupLabelTester, renderer: MarkupLabelRenderer },
          ]}
        />
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  };
  try {
    await render('Boston');
    expect(host.textContent).toContain('Boston');
    expect(host.textContent).toContain('Wrong root');
    await render('Seattle');
    expect(host.textContent).toContain('Seattle');
    expect(host.textContent).not.toContain('Boston');
    await render('Private city', false);
    expect(host.textContent).not.toContain('Private city');
    expect(host.textContent).not.toContain('Wrong root');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
