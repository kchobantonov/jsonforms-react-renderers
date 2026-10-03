import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { expect, it } from 'vitest';
import {
  shadcnRenderers,
  shadcnCells,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { shadcnExtendedRenderers } from '../src';
import schema from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/schema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/data.json';
import ui from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/uischema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/translations.json';

import { uischemas } from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/uischemas.mjs';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

it.each([true, false])(
  'renders translated image cards with URL policy (allowed=%s)',
  async (allowed) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () =>
        root.render(
          <JsonForms
            schema={schema as any}
            data={data}
            uischema={
              (
                ui.elements[0].elements.find(
                  (category) => category.i18n === 'cards.navigation'
                ) as any
              ).elements[0]
            }
            config={{
              jsonformsExtended: {
                security: { urlPolicy: { allowImageDataUrls: allowed } },
              },
            }}
            renderers={[...shadcnExtendedRenderers, ...shadcnRenderers]}
            cells={shadcnCells}
            i18n={{
              locale: 'bg',
              translate: (key, fallback) =>
                (translations.bg as Record<string, string>)[key] ?? fallback,
            }}
          />
        )
      );
      expect(host.querySelector('[aria-label="Одобряване"]')).not.toBeNull();
      expect(host.querySelectorAll('img').length).toBe(allowed ? 2 : 0);
      expect(host.textContent).toContain('Одобрено');
      expect(host.querySelectorAll('input[type=radio]')).toHaveLength(8);
      expect(
        (host.querySelector('[aria-label="Одобряване"]') as HTMLInputElement)
          .checked
      ).toBe(true);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);

it.each([false, true])(
  'uses the example complex policy (has details=%s)',
  async (hasDetails) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
      const category = ui.elements[0].elements.find(
        (category) => category.i18n === 'cards.branches'
      ) as any;
      await act(async () =>
        root.render(
          <JsonForms
            schema={schema as any}
            data={{
              ...data,
              cardContact: hasDetails
                ? { kind: 'email', address: 'hello@example.com' }
                : { kind: 'email' },
            }}
            uischema={category.elements[0]}
            renderers={[...shadcnExtendedRenderers, ...shadcnRenderers]}
            cells={shadcnCells}
          />
        )
      );
      await act(async () =>
        (
          host.querySelector('[aria-label="Postal mail"]') as HTMLElement
        ).click()
      );
      expect(
        (host.querySelector('[aria-label="Postal mail"]') as HTMLInputElement)
          .checked
      ).toBe(!hasDetails);
      expect(document.querySelector('[role="dialog"]') !== null).toBe(
        hasDetails
      );
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);

it('shows required and invalid choices from the validation example', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    const category = ui.elements[0].elements.find(
      (category) => category.i18n === 'cards.validation'
    ) as any;
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema as any}
          data={data}
          uischema={category.elements[0]}
          renderers={[...shadcnExtendedRenderers, ...shadcnRenderers]}
          cells={shadcnCells}
        />
      )
    );
    expect(
      host.querySelector('[role="radiogroup"][aria-required="true"]')
    ).not.toBeNull();
    const groups = host.querySelectorAll('fieldset');
    expect(groups[0].querySelectorAll('input:checked')).toHaveLength(0);
    expect(groups[1].querySelectorAll('input:checked')).toHaveLength(0);
    expect(host.querySelectorAll('[role="alert"]').length).toBeGreaterThan(0);
    expect(host.querySelector('input[value="not-an-email"]')).not.toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each(['en', 'bg'] as const)(
  'renders the detail-mode example in %s',
  async (locale) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const category = ui.elements[0].elements.find(
      (c) => c.i18n === 'cards.detailModes'
    )!;
    const render = async (contact: any) => {
      await act(async () =>
        root.render(
          <JsonForms
            schema={schema as any}
            data={{ ...data, cardContact: contact }}
            uischema={
              { type: 'VerticalLayout', elements: category.elements } as any
            }
            uischemas={uischemas}
            renderers={[...shadcnExtendedRenderers, ...shadcnRenderers]}
            cells={shadcnCells}
            i18n={{
              locale,
              translate: (key, fallback) =>
                (translations[locale] as Record<string, string>)[key] ??
                fallback,
            }}
          />
        )
      );
    };
    try {
      await render(data.cardContact);
      const registeredLabel =
        translations[locale]['cards.registeredAddress.label'];
      expect(host.textContent!.split(registeredLabel)).toHaveLength(2);
      expect(
        host.querySelectorAll('input[value="hello@example.com"]')
      ).toHaveLength(2);
      await render({ kind: 'postal', street: 'Main Street', city: 'Sofia' });
      expect(host.textContent).not.toContain(registeredLabel);
      expect(host.querySelectorAll('input[value="Main Street"]')).toHaveLength(
        2
      );
      expect(host.querySelectorAll('input[value="Sofia"]')).toHaveLength(2);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);
