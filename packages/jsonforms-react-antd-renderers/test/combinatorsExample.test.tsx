import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { createTranslator } from '@jsonforms/core';
import { antdCells, antdRenderers } from '../src';
import config from '../../jsonforms-react-demo-common/src/examples/spec/combinators/config.json';
import data from '../../jsonforms-react-demo-common/src/examples/spec/combinators/data.json';
import schema from '../../jsonforms-react-demo-common/src/examples/spec/combinators/schema.json';
import translations from '../../jsonforms-react-demo-common/src/examples/spec/combinators/translations.json';
import uischema from '../../jsonforms-react-demo-common/src/examples/spec/combinators/uischema.json';

/*
  The combinators fixture. Each presentation gets its own category, so these
  tests open a tab and then assert inside the panel it opened.

  The last category is the one worth reading the specification for: a schema
  `if`/`then` and a UI rule are separate mechanisms, and the fixture shows
  both acting on the same property.
*/

class ResizeObserverStub {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const draw = (override?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: any = { ...data, ...(override ?? {}) };
  const paint = () =>
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={current}
            schema={schema as any}
            uischema={uischema as any}
            config={config}
            renderers={antdRenderers}
            cells={antdCells}
            i18n={{
              locale: 'en',
              translate: createTranslator(
                (key: string, fallback?: string) =>
                  (translations.en as Record<string, string>)[key] ?? fallback
              ),
            }}
            onChange={({ data: next }) => {
              current = next;
            }}
          />
        </ConfigProvider>
      )
    );
  paint();

  const active = () =>
    container.querySelector<HTMLElement>('.ant-tabs-content-active');

  return {
    container,
    paint,
    active,
    data: () => current,
    setData: (next: any) => {
      current = next;
      paint();
    },
    labels: () =>
      Array.from(
        active()?.querySelectorAll<HTMLElement>('.ant-form-item label') ?? []
      ).map((label) => label.textContent),
    selectTab: async (label: string) => {
      const tab = Array.from(
        container.querySelectorAll<HTMLElement>('.ant-tabs-tab')
      ).find((candidate) => candidate.textContent?.includes(label));
      expect(tab, `no tab labelled ${label}`).toBeTruthy();
      act(() => tab!.click());
      await settle();
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('the three presentations', () => {
  it('gives each combinator its own category', async () => {
    const view = draw();
    await settle();
    expect(
      Array.from(
        view.container.querySelectorAll<HTMLElement>('.ant-tabs-tab')
      ).map((tab) => tab.textContent)
    ).toEqual([
      'oneOf',
      'anyOf',
      'allOf',
      'One input, several alternatives',
      'Schema condition vs UI rule',
      'Fields that appear from the schema',
    ]);
    view.unmount();
  });

  /* "A dropdown of branch labels with the selected branch's form below it." */
  it('renders oneOf as a dropdown showing the branch that fits the data', async () => {
    const view = draw();
    await view.selectTab('oneOf');
    expect(view.active()?.querySelector('.ant-select')).toBeTruthy();
    expect(view.active()?.textContent).toContain('Email contact');
    expect(view.labels()).toContain('Email address');
    view.unmount();
  });

  /* "Tabs selecting the branch form to display over the same bound value." */
  it('renders anyOf as tabs with no selector', async () => {
    const view = draw();
    await view.selectTab('anyOf');
    const inner = view.active()?.querySelectorAll('.ant-tabs-tab') ?? [];
    expect(Array.from(inner).map((tab) => tab.textContent)).toEqual([
      'On site',
      'Online',
    ]);
    expect(view.active()?.querySelector('.ant-select')).toBeNull();
    view.unmount();
  });

  /*
    "The enclosing properties followed by all branch forms in schema order,
    without a branch selector." All three inputs are on screen at once.
  */
  it('renders allOf as every branch at once', async () => {
    const view = draw();
    await view.selectTab('allOf');
    expect(view.labels()).toEqual(
      expect.arrayContaining(['Item', 'Asset tag', 'In working order'])
    );
    expect(view.active()?.querySelector('.ant-tabs')).toBeNull();
    view.unmount();
  });
});

describe('composition that describes one editor', () => {
  /*
    "when composition describes one unambiguous scalar editor, render it once
    and preserve the outer Control's label" - one input, labelled by the outer
    property, no branch tabs and no dropdown.
  */
  it('renders one labelled input for a scalar anyOf', async () => {
    const view = draw();
    await view.selectTab('One input, several alternatives');
    expect(view.labels()).toEqual(
      expect.arrayContaining(['Number of attendees', 'Seats per table'])
    );
    const panel = view.active()!;
    expect(panel.querySelectorAll('.ant-tabs')).toHaveLength(0);
    expect(panel.querySelectorAll('.ant-select')).toHaveLength(0);
    view.unmount();
  });

  /*
    "Do not copy both branches' bounds onto the input: minimum 20 and maximum
    10 would prevent valid entries." Neither bound may reach the input, or
    8000 - which the schema permits - could not be typed.
  */
  it('puts neither branch bound on the input', async () => {
    const view = draw();
    await view.selectTab('One input, several alternatives');
    const inputs = Array.from(
      view.active()!.querySelectorAll<HTMLInputElement>('input')
    );
    for (const input of inputs) {
      expect(input.getAttribute('min')).toBeNull();
      expect(input.getAttribute('max')).toBeNull();
    }
    view.unmount();
  });

  /* 15 matches both branches, so the exclusive-match failure is shown. */
  it('shows the composition failure beside the single input', async () => {
    const view = draw({ seatsPerTable: 15 });
    await view.selectTab('One input, several alternatives');
    await settle();
    expect(view.active()?.textContent).toContain(
      'Enter a multiple of three or of five, but not of both.'
    );
    view.unmount();
  });
});

describe('a schema condition is not a rule', () => {
  /*
    The heart of the category. "A schema condition does not itself define a
    SHOW/HIDE rule." The same property appears twice - once with a UI rule,
    once without - and only the ruled one disappears.
  */
  it('hides only the control that carries the rule', async () => {
    const view = draw({ urgent: false });
    await view.selectTab('Schema condition vs UI rule');
    expect(view.labels()).not.toContain('Needed by');
    expect(view.labels()).toContain('Needed by (no rule)');
    view.unmount();
  });

  it('shows the ruled control once the condition holds', async () => {
    const view = draw({ urgent: true });
    await view.selectTab('Schema condition vs UI rule');
    expect(view.labels()).toContain('Needed by');
    view.unmount();
  });

  /*
    "Hiding an element preserves its data and does not remove its schema
    constraints or exempt it from validation." The `then` still requires the
    value, and the error is on screen through the control that is not hidden.
  */
  it('still validates the conditional requirement', async () => {
    const view = draw({ urgent: true, neededBy: undefined });
    await view.selectTab('Schema condition vs UI rule');
    await settle();
    expect(view.active()?.textContent).toContain(
      'Required for an urgent request.'
    );
    view.unmount();
  });

  it('raises no requirement when the condition does not hold', async () => {
    const view = draw({ urgent: false, neededBy: undefined });
    await view.selectTab('Schema condition vs UI rule');
    await settle();
    expect(view.active()?.textContent).not.toContain(
      'Required for an urgent request.'
    );
    view.unmount();
  });

  /*
    The documented limit, section 18: the required *marker* comes from the
    parent schema's `required` array, which a conditional does not appear in.
    So the asterisk is absent while the requirement is real - and this test is
    what keeps the README honest about it.
  */
  it('marks no asterisk for the conditional requirement', async () => {
    const view = draw({ urgent: true, neededBy: undefined });
    await view.selectTab('Schema condition vs UI rule');
    const required = Array.from(
      view.active()!.querySelectorAll('.ant-form-item-required')
    );
    expect(required).toHaveLength(0);
    view.unmount();
  });
});

/*
  The other half of the conditional story, and the one the section does *not*
  spell out: a schema condition changes validation, but a **combinator branch**
  changes which fields exist. Choosing a method here swaps the fields on
  screen with no `rule` anywhere in the UI schema.
*/
describe('fields that appear from the schema alone', () => {
  const open = async (override?: any) => {
    const view = draw(override);
    await view.selectTab('Fields that appear from the schema');
    return view;
  };

  it('shows the branch that fits the value', async () => {
    const view = await open();
    expect(view.labels()).toContain('Collection point');
    expect(view.labels()).not.toContain('Postcode');
    view.unmount();
  });

  /*
    The regression this needed: the branch was derived once at mount and never
    again, so a discriminator change left the previous branch's fields on
    screen - the exact opposite of the mechanism being demonstrated.
  */
  it('follows the discriminator when the value changes', async () => {
    const view = await open();
    expect(view.labels()).toContain('Collection point');

    view.setData({ ...data, delivery: { method: 'post' } });
    await settle();

    expect(view.labels()).toContain('Postcode');
    expect(view.labels()).toContain('Address');
    expect(view.labels()).not.toContain('Collection point');
    view.unmount();
  });

  /* A branch may contribute no fields at all, which is still a branch. */
  it('shows only the discriminator for a branch with no fields', async () => {
    const view = await open({ delivery: { method: 'none' } });
    expect(view.labels()).toContain('Method');
    expect(view.labels()).not.toContain('Collection point');
    expect(view.labels()).not.toContain('Postcode');
    view.unmount();
  });

  /*
    "Hiding an element preserves its data" - and so does this. A value left
    behind by the previous branch is not on screen and is not deleted either;
    only an explicit branch change discards it.
  */
  it('keeps a value the displayed branch does not show', async () => {
    const view = await open({
      delivery: {
        method: 'post',
        postcode: 'AB1 2CD',
        collectionPoint: 'Main reception',
      },
    });
    expect(view.labels()).not.toContain('Collection point');
    expect(view.data().delivery.collectionPoint).toBe('Main reception');
    view.unmount();
  });

  /*
    No `rule` is involved anywhere in this fixture's delivery section - the
    check that keeps the example honest about what is doing the work.
  */
  it('uses no UI rule to do it', () => {
    const delivery = (uischema as any).elements[1].elements.find(
      (category: any) => category.name === 'schemaVisibility'
    );
    const serialised = JSON.stringify(delivery);
    expect(serialised).not.toContain('"rule"');
    expect(serialised).not.toContain('"effect"');
  });
});
