import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers, shadcnCells } from '../src';
import schema from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/schema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/data.json';
import ui from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/uischema.json';

it('shows branch navigation and contrasts enabled and disabled branch errors', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const category =
    (ui.elements[0] as any).elements?.find(
      (entry: any) => entry.i18n === 'branchFeedback.navigation'
    ) ??
    (ui.elements[1] as any)?.elements?.find(
      (entry: any) => entry.i18n === 'branchFeedback.navigation'
    );
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema as any}
          data={data}
          uischema={
            { type: 'VerticalLayout', elements: category.elements } as any
          }
          config={{ validateActiveBranch: true, restrict: true }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    const shortTabs = Array.from(host.querySelectorAll('[role="tab"]')).filter(
      (tab) => tab.textContent?.includes('Short text')
    );
    expect(shortTabs).toHaveLength(2);
    await act(async () =>
      shortTabs.forEach((tab) => (tab as HTMLElement).click())
    );
    expect(host.textContent).toContain('5');
    const invalid = host.querySelectorAll(
      'input[aria-invalid="true"], .ant-input-status-error'
    );
    expect(invalid.length).toBe(1);
    expect(
      Array.from(host.querySelectorAll('input')).filter(
        (input) => input.value === 'Longer text'
      ).length
    ).toBeGreaterThanOrEqual(2);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
