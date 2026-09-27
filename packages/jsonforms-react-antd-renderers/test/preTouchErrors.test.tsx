import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import { antdCells, antdRenderers } from '../src';
import { filterErrorsBeforeTouch } from '../src/util/preTouchErrors';
import config from '../../jsonforms-react-demo-common/src/examples/spec/pre-touch-errors/config.json';
import data from '../../jsonforms-react-demo-common/src/examples/spec/pre-touch-errors/data.json';
import schema from '../../jsonforms-react-demo-common/src/examples/spec/pre-touch-errors/schema.json';
import uischema from '../../jsonforms-react-demo-common/src/examples/spec/pre-touch-errors/uischema.json';
import translations from '../../jsonforms-react-demo-common/src/examples/spec/pre-touch-errors/translations.json';
import { translatorFor } from '../../jsonforms-react-demo-common/src/i18nCatalogs';

/*
  The pre-touch error filtering fixture.

  **The feature itself is not implemented.** These tests describe the fixture,
  not the filter: that the data really does produce the mix of errors the
  example's README claims, and that every one of them is on screen today. They
  are the floor the implementation starts from.

  The filtering cases are deliberately written and skipped rather than left
  out. Unwriting them would lose the part that is hard to reconstruct - which
  DOM state each rule predicts - and a skipped test says "not yet" where a
  missing one says nothing at all.
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

const draw = (extraConfig?: Record<string, unknown>, locale = 'en') => {
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
          config={{ ...config, ...(extraConfig ?? {}) }}
          i18n={{
            locale,
            // The demo supplies this; without it the raw Ajv text shows and
            // the catalog is never exercised.
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

  /** The item whose label is `title`, or undefined. */
  const itemFor = (title: string) =>
    Array.from(container.querySelectorAll<HTMLElement>('.ant-form-item')).find(
      (item) => item.querySelector('label')?.textContent?.includes(title)
    );

  return {
    container,
    /** The form's structured errors, as a host validity consumer sees them. */
    structured: () => structured,
    /** The visible message under the control labelled `title`. */
    messageFor: (title: string) =>
      itemFor(title)?.querySelector('.ant-form-item-explain')?.textContent ??
      '',
    hasError: (title: string) =>
      Boolean(itemFor(title)?.classList.contains('ant-form-item-has-error')),
    blur: async (title: string) => {
      const input =
        itemFor(title)?.querySelector<HTMLElement>('input, textarea');
      expect(input, `no input under ${title}`).toBeTruthy();
      act(() => {
        input!.focus();
        input!.blur();
      });
      await settle();
    },
    focusOnly: async (title: string) => {
      const input =
        itemFor(title)?.querySelector<HTMLElement>('input, textarea');
      act(() => input!.focus());
      await settle();
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('the fixture itself', () => {
  /*
    A filter that hid all seven errors would be indistinguishable from one that
    hid the right four, so the example is only useful while it carries both
    kinds. This is the guard on that.
  */
  it('produces required errors and errors that are not required errors', async () => {
    const view = draw();
    await settle();

    // Required and absent.
    expect(view.hasError('Legal name')).toBe(true);
    expect(view.hasError('Contact email')).toBe(true);
    expect(view.hasError('Internal code')).toBe(true);

    // Present but wrong - nothing to do with being required.
    expect(view.hasError('Member number')).toBe(true);
    expect(view.messageFor('Member number')).toContain('seven digits');
    expect(view.hasError('Notes')).toBe(true);

    view.unmount();
  });

  /* The control that has to stay quiet: absent, but not required. */
  it('leaves the optional absent property alone', async () => {
    const view = draw();
    await settle();
    expect(view.hasError('Membership expiry')).toBe(false);
    view.unmount();
  });

  /*
    Filtering decides whether a message is shown, never which language it is
    in - so both halves of the catalog have to resolve before the feature can
    be said to respect either.
  */
  it('resolves both catalogs', async () => {
    const en = draw();
    await settle();
    expect(en.messageFor('Legal name')).toBe('This field is required.');
    en.unmount();

    const bg = draw(undefined, 'bg');
    await settle();
    expect(bg.messageFor('Legal name')).toBe('Полето е задължително.');
    expect(bg.messageFor('Member number')).toContain('седем цифри');
    bg.unmount();
  });

  it('shows every error before anything is touched', async () => {
    const view = draw();
    await settle();
    // Today nothing is filtered, so this is simply the whole set.
    expect(
      view.container.querySelectorAll('.ant-form-item-has-error').length
    ).toBeGreaterThanOrEqual(5);
    view.unmount();
  });
});

describe('filtering before touch', () => {
  const filtering = { enableFilterErrorsBeforeTouch: true };

  it('hides required messages and keeps the others', async () => {
    const view = draw(filtering);
    await settle();
    expect(view.hasError('Legal name')).toBe(false);
    expect(view.hasError('Contact email')).toBe(false);
    // "nonmatching errors remain eligible for display"
    expect(view.hasError('Member number')).toBe(true);
    expect(view.hasError('Notes')).toBe(true);
    view.unmount();
  });

  it('reveals the message on blur, with no edit', async () => {
    const view = draw(filtering);
    await settle();
    expect(view.hasError('Legal name')).toBe(false);
    // "leaving the control counts even if the user did not change its data"
    await view.blur('Legal name');
    expect(view.hasError('Legal name')).toBe(true);
    view.unmount();
  });

  it('does not count focus as touch', async () => {
    const view = draw(filtering);
    await settle();
    // "receiving focus alone is insufficient"
    await view.focusOnly('Legal name');
    expect(view.hasError('Legal name')).toBe(false);
    view.unmount();
  });

  it('touches one control without touching its neighbours', async () => {
    const view = draw(filtering);
    await settle();
    await view.blur('Legal name');
    expect(view.hasError('Legal name')).toBe(true);
    expect(view.hasError('Contact email')).toBe(false);
    view.unmount();
  });

  it('lets a control opt out of filtering', async () => {
    const view = draw(filtering);
    await settle();
    // `options.enableFilterErrorsBeforeTouch: false` on this control.
    expect(view.hasError('Internal code')).toBe(true);
    view.unmount();
  });

  it('suppresses every message when the keyword list is empty', async () => {
    const view = draw({
      ...filtering,
      filterErrorKeywordsBeforeTouch: [],
    });
    await settle();
    // "an absent or empty array suppresses all otherwise displayable control
    // error text before touch"
    expect(view.hasError('Member number')).toBe(false);
    expect(view.hasError('Notes')).toBe(false);
    view.unmount();
  });

  it('ignores the keyword list while filtering is off', async () => {
    const view = draw({ filterErrorKeywordsBeforeTouch: [] });
    await settle();
    // "Ignored when filtering is disabled" - an empty list must not suppress
    // anything here.
    expect(view.hasError('Legal name')).toBe(true);
    view.unmount();
  });

  /*
    "The form remains invalid while a required error is hidden." Filtering is
    presentation; hiding a message must not make anything reading validity
    think the form is fine.
  */
  it('stays invalid, with every structured error intact', async () => {
    const unfiltered = draw();
    await settle();
    const before = unfiltered.structured().length;
    expect(before).toBe(7);
    unfiltered.unmount();

    const view = draw(filtering);
    await settle();
    // The messages are gone from the screen...
    expect(view.hasError('Legal name')).toBe(false);
    expect(view.hasError('Contact email')).toBe(false);
    /*
      ...and nothing else moved. "Filtering must not remove structured errors,
      suspend validation, modify data, or alter the error collections used by
      host validity consumers."
    */
    expect(view.structured()).toHaveLength(before);
    expect(
      view.structured().filter((error: any) => error.keyword === 'required')
    ).toHaveLength(4);
    view.unmount();
  });
});

/*
  The policy on its own. These are the branches a rendered form does not reach
  easily - a host-published `additionalError`, an error with no keyword, and
  the case where the keyword list matches nothing.
*/
describe('the filter itself', () => {
  const error = (keyword: string, instancePath: string): any => ({
    keyword,
    instancePath,
    schemaPath: '#/x',
    params: {},
    message: `${keyword} failed`,
  });
  const base = {
    errors: 'required failed',
    path: 'legalName',
    coreErrors: [error('required', '/legalName')],
    // No custom `error.custom` key, so the per-error translator does the work.
    translate: (() => undefined) as any,
    translateError: ((e: any) => e.message) as any,
  };

  it('returns the errors untouched once the control is touched', () => {
    expect(
      filterErrorsBeforeTouch({
        ...base,
        touched: true,
        appliedOptions: {
          enableFilterErrorsBeforeTouch: true,
          filterErrorKeywordsBeforeTouch: ['required'],
        },
      })
    ).toBe('required failed');
  });

  it('returns them untouched when filtering is off', () => {
    expect(
      filterErrorsBeforeTouch({
        ...base,
        touched: false,
        appliedOptions: { filterErrorKeywordsBeforeTouch: ['required'] },
      })
    ).toBe('required failed');
  });

  it('suppresses everything when no keywords are named', () => {
    for (const appliedOptions of [
      { enableFilterErrorsBeforeTouch: true },
      {
        enableFilterErrorsBeforeTouch: true,
        filterErrorKeywordsBeforeTouch: [],
      },
    ]) {
      expect(
        filterErrorsBeforeTouch({ ...base, touched: false, appliedOptions })
      ).toBe('');
    }
  });

  /*
    Nothing matched, so the original string is returned rather than one
    recomposed from core - which would be a silent difference wherever the
    control's own props carry more than core's errors do.
  */
  it('returns the original string when the keywords match nothing', () => {
    const result = filterErrorsBeforeTouch({
      ...base,
      touched: false,
      appliedOptions: {
        enableFilterErrorsBeforeTouch: true,
        filterErrorKeywordsBeforeTouch: ['minLength'],
      },
    });
    expect(result).toBe('required failed');
  });

  it('keeps the errors it does not match and drops the ones it does', () => {
    const result = filterErrorsBeforeTouch({
      ...base,
      errors: 'required failed\npattern failed',
      touched: false,
      coreErrors: [
        error('required', '/legalName'),
        error('pattern', '/legalName'),
      ],
      appliedOptions: {
        enableFilterErrorsBeforeTouch: true,
        filterErrorKeywordsBeforeTouch: ['required'],
      },
    });
    expect(result).toBe('pattern failed');
  });

  /* "Apply granular filtering to the complete set of errors eligible for the
     control, including mapped additionalErrors. A nonmatching additional error
     must not be lost merely because a matching core error was suppressed." */
  it('keeps a host-published error when a core error beside it is suppressed', () => {
    const result = filterErrorsBeforeTouch({
      ...base,
      errors: 'required failed\nbooking already taken',
      touched: false,
      coreErrors: [
        error('required', '/legalName'),
        {
          ...error('custom', '/legalName'),
          message: 'booking already taken',
        },
      ],
      appliedOptions: {
        enableFilterErrorsBeforeTouch: true,
        filterErrorKeywordsBeforeTouch: ['required'],
      },
    });
    expect(result).toBe('booking already taken');
  });

  /* `!error.keyword ||` in the reference implementations: an error with no
     keyword can never be matched, so it is always shown. */
  it('never suppresses an error that has no keyword', () => {
    const result = filterErrorsBeforeTouch({
      ...base,
      errors: 'required failed\nno keyword',
      touched: false,
      coreErrors: [
        error('required', '/legalName'),
        {
          ...error('', '/legalName'),
          keyword: undefined,
          message: 'no keyword',
        },
      ],
      appliedOptions: {
        enableFilterErrorsBeforeTouch: true,
        filterErrorKeywordsBeforeTouch: ['required'],
      },
    });
    expect(result).toBe('no keyword');
  });

  it('ignores errors belonging to other controls', () => {
    const result = filterErrorsBeforeTouch({
      ...base,
      touched: false,
      coreErrors: [
        error('required', '/legalName'),
        error('pattern', '/memberNumber'),
      ],
      appliedOptions: {
        enableFilterErrorsBeforeTouch: true,
        filterErrorKeywordsBeforeTouch: ['required'],
      },
    });
    // The neighbour's pattern error is not this control's to show.
    expect(result).toBe('');
  });
});
