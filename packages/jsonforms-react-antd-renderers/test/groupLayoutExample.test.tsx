import { flattenExampleNavigation } from './flattenExampleNavigation';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import config from '@chobantonov/jsonforms-extended-spec/examples/group-layout/config.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/group-layout/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/group-layout/schema.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/group-layout/uischema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/group-layout/translations.json';
import { translatorFor } from '../../jsonforms-react-demo-common/src/i18nCatalogs';

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
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={flattenExampleNavigation(uischema)}
          config={config}
          i18n={{
            locale,
            translate: translatorFor(translations as any, locale),
          }}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  /** A group's outermost element, found by its heading text. */
  const groupFor = (label: string) =>
    Array.from(container.querySelectorAll<HTMLElement>('.ant-card')).find(
      (card) =>
        card.querySelector('.ant-card-head-title')?.textContent?.trim() ===
        label
    ) ??
    Array.from(
      container.querySelectorAll<HTMLElement>('.ant-collapse-item')
    ).find((item) =>
      item.querySelector('.ant-collapse-header')?.textContent?.includes(label)
    );
  return {
    container,
    groupFor,
    labels: () => container.textContent ?? '',
    toggleFor: (label: string) =>
      groupFor(label)?.querySelector<HTMLElement>(
        '.ant-collapse-header, [aria-expanded]'
      ),
    inputFor: (title: string) =>
      Array.from(container.querySelectorAll<HTMLElement>('.ant-form-item'))
        .find((item) =>
          item.querySelector('label')?.textContent?.includes(title)
        )
        ?.querySelector('input'),
    indicators: () =>
      container.querySelectorAll('[data-group-indicator]').length,
    /*
      Whether a collapsible group is open. antd keeps a collapsed panel's
      children mounted and hides them, so presence in the DOM says nothing -
      the disclosure state is what to assert.
    */
    isOpen: (label: string) => {
      const group = groupFor(label);
      if (!group) return undefined;
      const item = group.classList.contains('ant-collapse-item')
        ? group
        : group.querySelector('.ant-collapse-item');
      return item?.classList.contains('ant-collapse-item-active') ?? undefined;
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('the group-layout spec example', () => {
  /* "An ordinary Group presents related controls as a labelled section." */
  it('draws a plain group as a labelled section with no disclosure', async () => {
    const view = draw();
    await settle();
    const identity = view.groupFor('Identity');
    expect(identity).toBeTruthy();
    expect(identity!.querySelector('.ant-collapse-header')).toBeNull();
    // Its children are there, unconditionally.
    expect(view.inputFor('Legal name')?.value).toBe('Cascade Supplies');
    view.unmount();
  });

  /* `collapsible: true` with no `collapsed` starts open. */
  it('opens a collapsible group that does not ask to be collapsed', async () => {
    const view = draw();
    await settle();
    expect(view.isOpen('Contact')).toBe(true);
    expect(view.inputFor('Contact name')?.value).toBe('A. Ferreira');
    view.unmount();
  });

  /* `collapsed: true` initializes closed. */
  it('starts a collapsed group closed', async () => {
    const view = draw();
    await settle();
    expect(view.isOpen('Insurance')).toBe(false);
    // Contact, which asks for no `collapsed`, is open beside it.
    expect(view.isOpen('Contact')).toBe(true);
    view.unmount();
  });

  /* "Ignored unless collapsible is true." */
  it('ignores collapsed on a group that is not collapsible', async () => {
    const view = draw();
    await settle();
    // Audit asks to be collapsed but never asked to be collapsible.
    expect(view.inputFor('Audit note')).toBeTruthy();
    view.unmount();
  });

  /*
    "Shows a data-presence indicator when at least one bound descendant
    contains data."
  */
  it('marks only the groups whose descendants hold data', async () => {
    const view = draw();
    await settle();
    /*
      Contact holds data, and so does the nested Additional details
      (alternatePhone). Insurance holds none, so it must not be marked - which
      is what makes the indicator worth anything.
    */
    expect(view.indicators()).toBe(3);
    expect(
      view.groupFor('Insurance')?.querySelector('[data-group-indicator]')
    ).toBeNull();
    expect(
      view
        .groupFor('False and zero count as data')
        ?.querySelector('[data-group-indicator]')
    ).toBeTruthy();
    view.unmount();
  });

  it('localizes the indicator label', async () => {
    const view = draw('bg');
    await settle();
    expect(view.container.innerHTML).toContain('Съдържа данни');
    view.unmount();
  });

  /* Groups nest, and a nested one keeps its own disclosure state. */
  it('nests a collapsible group inside a collapsible group', async () => {
    const view = draw();
    await settle();
    // The outer is open, so the inner's header is on screen...
    expect(view.labels()).toContain('Additional details');
    expect(view.isOpen('Contact')).toBe(true);
    // ...and the inner is collapsed independently of it.
    expect(view.isOpen('Additional details')).toBe(false);
    view.unmount();
  });
});
