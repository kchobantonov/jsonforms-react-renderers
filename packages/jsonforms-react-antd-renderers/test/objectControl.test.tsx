import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import config from '../../jsonforms-react-demo-common/src/examples/spec/object-control/config.json';
import data from '../../jsonforms-react-demo-common/src/examples/spec/object-control/data.json';
import schema from '../../jsonforms-react-demo-common/src/examples/spec/object-control/schema.json';
import uischema from '../../jsonforms-react-demo-common/src/examples/spec/object-control/uischema.json';
import { uischemas } from '../../jsonforms-react-demo-common/src/examples/spec/object-control/uischemas';
import translations from '../../jsonforms-react-demo-common/src/examples/spec/object-control/translations.json';
import { translatorFor } from '../../jsonforms-react-demo-common/src/i18nCatalogs';

/*
  The object-control fixture.

  Objects are the one control whose whole job is to produce other controls, so
  most of what there is to check is where the nested form came from - generated,
  `options.detail`, or the UI-schema registry - and that nesting keeps working
  at depth.

  The last group is the uncomfortable half: three of the fixture's five errors
  belong to an object rather than to any field, and what becomes of them
  depends on where core maps each one - one lands on a control, two have
  nowhere to go. Those tests assert today's behaviour, so the gap is recorded
  rather than merely described.
*/

class ResizeObserverStub {
  observe() {
    /* nothing to measure in jsdom */
  }
  unobserve() {
    /* nothing to measure in jsdom */
  }
  disconnect() {
    /* nothing to measure in jsdom */
  }
}
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const draw = (locale = 'en') => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let structured: any[] = [];
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={uischema as any}
          uischemas={uischemas}
          config={config}
          i18n={{
            locale,
            translate: translatorFor(translations as any, locale),
          }}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={({ errors }) => {
            structured = errors ?? [];
          }}
        />
      </ConfigProvider>
    )
  );

  const items = () =>
    Array.from(container.querySelectorAll<HTMLElement>('.ant-form-item'));
  const itemFor = (title: string) =>
    items().find((item) =>
      item.querySelector('label')?.textContent?.includes(title)
    );

  return {
    container,
    structured: () => structured,
    /** Every visible input's label, in document order. */
    labels: () =>
      items()
        .map((item) => item.querySelector('label')?.textContent ?? '')
        .filter(Boolean),
    valueOf: (title: string) =>
      itemFor(title)?.querySelector<HTMLInputElement>('input')?.value,
    hasError: (title: string) =>
      Boolean(itemFor(title)?.classList.contains('ant-form-item-has-error')),
    messageFor: (title: string) =>
      itemFor(title)?.querySelector('.ant-form-item-explain')?.textContent ??
      '',
    errorCount: () =>
      container.querySelectorAll('.ant-form-item-has-error').length,
    tabs: () =>
      Array.from(container.querySelectorAll('.ant-tabs-tab')).map(
        (tab) => tab.textContent ?? ''
      ),
    text: () => container.textContent ?? '',
    unmount: () => act(() => root.unmount()),
  };
};

describe('where an object gets its layout', () => {
  /*
    No `options.detail` and nothing registered, so the layout is generated from
    the schema - which means schema property order.
  */
  it('generates one from the schema', async () => {
    const view = draw();
    await settle();
    expect(view.valueOf('Legal name')).toBe('');
    expect(view.valueOf('Trading name')).toBe('Cascade Supplies');
    const labels = view.labels();
    expect(labels.indexOf('Legal name')).toBeLessThan(
      labels.indexOf('Trading name')
    );
    view.unmount();
  });

  /*
    `options.detail` puts Phone before Email, which is the reverse of the
    schema's order - so the order alone proves the detail was used and its
    scopes resolved against the object rather than the root.
  */
  it('uses options.detail when the control carries one', async () => {
    const view = draw();
    await settle();
    expect(view.valueOf('Phone')).toBe('+1 503 555 0113');
    expect(view.valueOf('Email')).toBe('dispatch@example.test');
    const labels = view.labels();
    expect(labels.indexOf('Phone')).toBeLessThan(labels.indexOf('Email'));
    view.unmount();
  });

  /*
    `address` carries no `detail`; its layout comes from the registry, whose
    tester matches on the schema's title. Street before Postcode before City is
    the registered order, not the schema's (line1, city, postcode).
  */
  it('uses a registered detail UI schema', async () => {
    const view = draw();
    await settle();
    const labels = view.labels();
    expect(labels.indexOf('Street')).toBeLessThan(labels.indexOf('Postcode'));
    expect(labels.indexOf('Postcode')).toBeLessThan(labels.indexOf('City'));
    view.unmount();
  });

  /*
    `handover` has a registry entry *and* `detail: "GENERATE"`. GENERATE wins,
    so the layout is generated in schema order - Contact name, Window, Gate
    code. The registry entry deliberately reverses that order, so if it had
    been used Gate code would come first.

    This is the one precedence rule that surprises people: "GENERATE" is not
    "no detail", it is an instruction that outranks the registry.
  */
  it('lets detail GENERATE outrank a matching registry entry', async () => {
    const view = draw();
    await settle();
    const labels = view.labels();
    expect(labels.indexOf('Contact name')).toBeLessThan(
      labels.indexOf('Window')
    );
    expect(labels.indexOf('Window')).toBeLessThan(labels.indexOf('Gate code'));
    view.unmount();
  });

  /* A detail is any layout, not only a row of controls. */
  it('accepts a Categorization as a detail', async () => {
    const view = draw();
    await settle();
    expect(view.tabs()).toEqual(['Pickup', 'Delivery']);
    view.unmount();
  });

  /*
    `notes` carries `options.detail` with **no `type`**. `findUISchema` only
    accepts a detail object whose `type` is a string, so this one is skipped
    in silence and the layout is generated - which is why both properties
    appear, though the detail names only one.

    Worth a test because the failure is invisible: the form renders, it just
    ignores what was written.
  */
  it('silently ignores a detail object with no type', async () => {
    const view = draw();
    await settle();
    expect(view.valueOf('For driver')).toBe('Call on arrival');
    // The detail named only `forDriver`; the generated layout has both.
    expect(view.valueOf('For warehouse')).toBe('Dock 3');
    view.unmount();
  });

  /*
    The outermost element of a detail is the **object control's own frame**, so
    the renderer unwraps it - a Group there would nest a box inside whatever
    the parent layout already drew, at every level of nesting.

    Anything *inside* is the author's and is left alone. Same Group, two
    positions, two outcomes.
  */
  it('unwraps only the outermost Group of a detail', async () => {
    const view = draw();
    await settle();
    expect(view.text()).not.toContain('Dropped, because it is outermost');
    expect(view.text()).toContain('Kept, because it is inside');
    // The controls inside it render either way.
    expect(view.valueOf('Hazmat class')).toBe('none');
    view.unmount();
  });

  /* An object inside an object inside the root, dispatched at its own path. */
  it('nests an object within the nested form', async () => {
    const view = draw();
    await settle();
    expect(view.valueOf('Latitude')).toBe('45.5272');
    expect(view.valueOf('Longitude')).toBe('-122.6819');
    view.unmount();
  });
});

describe('errors that have a control to land on', () => {
  it('marks the required field that is empty', async () => {
    const view = draw();
    await settle();
    expect(view.hasError('Legal name')).toBe(true);
    expect(view.messageFor('Legal name')).toBe('This field is required.');
    // Its optional sibling is not implicated.
    expect(view.hasError('Trading name')).toBe(false);
    view.unmount();
  });

  /* The required property is missing from a *nested* object, two levels down. */
  it('marks a required field inside a nested object', async () => {
    const view = draw();
    await settle();
    expect(view.hasError('City')).toBe(true);
    view.unmount();
  });
});

describe('errors that belong to the object itself', () => {
  /*
    Three of the five errors are the object's, not a field's. What happens to
    them is decided by **where core maps them**, which is not the same for all
    three - so "object-level errors are not shown" would be too coarse a
    summary, and the fixture is built to make the difference visible.

    | Error | `getControlPath` | Shown? |
    | --- | --- | --- |
    | `dependencies` on `billing` | `billing.costCentre` | yes - on Cost centre |
    | `additionalProperties` on `routing` | `routing.legacyZone` | no |
    | `minProperties` on `preferences` | `preferences` | no |
  */

  it('produces all three, and they count towards validity', async () => {
    const view = draw();
    await settle();
    expect(view.structured()).toHaveLength(5);
    for (const keyword of [
      'minProperties',
      'additionalProperties',
      'dependencies',
    ]) {
      expect(
        view.structured().some((error: any) => error.keyword === keyword),
        `no ${keyword} error`
      ).toBe(true);
    }
    view.unmount();
  });

  /*
    The one that lands. Core maps a `dependencies` failure onto the property
    that is missing, and that property has a control, so the message arrives
    somewhere sensible without the object renderer doing anything.
  */
  it('shows the dependency failure on the property it names', async () => {
    const view = draw();
    await settle();
    expect(view.hasError('Cost centre')).toBe(true);
    expect(view.messageFor('Cost centre')).toBe(
      'A purchase order needs a cost centre.'
    );
    // Not on the property that triggered it.
    expect(view.hasError('Purchase order')).toBe(false);
    view.unmount();
  });

  /*
    **This is the gap**, and it is exactly the case the specification uses to
    describe it: "Core's web error-path mapping associates that failure with
    the offending property, but that association alone does not create a place
    to display it."

    `additionalProperties` is mapped onto `routing.legacyZone`. That key is
    even rendered, by the dynamic-property editor - but that editor does not
    display errors, so the message has a path and still no home.
  */
  it('does not show the undeclared-property failure, though the key is rendered', async () => {
    const view = draw();
    await settle();
    expect(view.text()).toContain('legacyZone');
    expect(view.text()).not.toContain('does not allow that property');
    view.unmount();
  });

  /*
    The other half of the gap, and the specification's own example:
    `minProperties` fails on the object, where no control exists at all.
    `ObjectRenderer` dispatches a nested form and the dynamic-property editor
    and renders no `errors` of its own, so there is nowhere for it to go.

    Recorded under 6.1 in the gaps document. When it is implemented, this is
    the test to change.
  */
  it('does not show the object-level failure at all', async () => {
    const view = draw();
    await settle();
    expect(view.text()).not.toContain('Fill in at least one preference');
    // Neither field is blamed for it, which is the part that matters most.
    expect(view.hasError('Language')).toBe(false);
    expect(view.hasError('Timezone')).toBe(false);
    view.unmount();
  });

  /* Exactly the three above are marked: two required, one dependency. */
  it('marks three controls in total', async () => {
    const view = draw();
    await settle();
    expect(view.errorCount()).toBe(3);
    view.unmount();
  });

  /*
    "Do not silently delete, rename, or rewrite invalid data merely to remove
    an error without a rendered target." The undeclared key keeps its value.
  */
  it('keeps the undeclared key rather than dropping it', async () => {
    const view = draw();
    await settle();
    expect(view.text()).toContain('legacyZone');
    expect(view.container.innerHTML).toContain('west');
    view.unmount();
  });

  /* "...instead of ... automatically creating a value." The object stays empty. */
  it('does not invent a value to satisfy minProperties', async () => {
    const view = draw();
    await settle();
    expect(view.valueOf('Language')).toBe('');
    expect(view.valueOf('Timezone')).toBe('');
    view.unmount();
  });
});

describe('localization', () => {
  it('translates the messages that are shown', async () => {
    const view = draw('bg');
    await settle();
    expect(view.messageFor('Legal name')).toBe('Полето е задължително.');
    view.unmount();
  });
});
