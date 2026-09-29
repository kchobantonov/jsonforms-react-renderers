import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider, DatePicker } from 'antd';
import dayjs from 'dayjs';
import {
  defaultAntdLocaleLoaders,
  getAntdLocaleLoaders,
  localeKey,
  setAntdLocaleLoaders,
  useAntdLocale,
} from '../src/util/locale';

/*
  antd owns a second set of strings the form never authors - month and weekday
  names, "Today", "OK", a select's empty text. They stay English unless its
  locale is set, which reads as a translation gap in the form rather than a
  missing setting.
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
  setAntdLocaleLoaders(defaultAntdLocaleLoaders);
});

const settle = async (ms = 60) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

/** Renders a calendar, whose month names are antd's strings, not ours. */
const drawCalendar = async (locale: string | undefined) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let resolvedLocale: ReturnType<typeof useAntdLocale>;
  const View = () => {
    resolvedLocale = useAntdLocale(locale);
    return (
      <ConfigProvider
        locale={resolvedLocale}
        theme={{ token: { motion: false } }}
      >
        <DatePicker open value={dayjs('2026-01-15')} />
      </ConfigProvider>
    );
  };
  act(() => root.render(<View />));
  // Locale chunks can take more than 150 ms during a full parallel test run.
  // Wait for the hook result instead of treating elapsed time as completion.
  if (locale && defaultAntdLocaleLoaders[localeKey(locale)!]) {
    await vi.waitFor(
      async () => {
        await act(async () => {});
        expect(resolvedLocale).toBeDefined();
      },
      { timeout: 5000 }
    );
  }
  await settle(150);
  return {
    header: () =>
      document.querySelector('.ant-picker-header-view')?.textContent ?? '',
    weekdays: () =>
      Array.from(document.querySelectorAll('.ant-picker-content th')).map(
        (cell) => cell.textContent
      ),
    unmount: () => act(() => root.unmount()),
  };
};

describe('matching a language tag to a locale', () => {
  it('accepts a bare language', () => {
    expect(localeKey('bg')).toBe('bg');
  });

  /* A host carrying a regional tag should not have to normalise it. */
  it('falls back from a regional tag to its language', () => {
    expect(localeKey('bg-BG')).toBe('bg');
    expect(localeKey('bg_BG')).toBe('bg');
    expect(localeKey('BG')).toBe('bg');
  });

  it('has nothing to match for an empty tag', () => {
    expect(localeKey(undefined)).toBeUndefined();
  });
});

describe('loading the locale', () => {
  it('leaves antd on its own default until one arrives', async () => {
    const view = await drawCalendar(undefined);
    expect(view.header()).toContain('Jan');
    view.unmount();
  });

  /*
    The point of the whole module: the calendar chrome changes language
    although nothing in the form's own catalogs was involved.
  */
  it('translates the calendar chrome', async () => {
    const view = await drawCalendar('bg');
    expect(view.header()).not.toContain('Jan');
    expect(view.header()).toMatch(/яну/i);
    view.unmount();
  });

  it('translates the weekday headings too', async () => {
    const english = await drawCalendar('en');
    const week = english.weekdays();
    english.unmount();
    document.body.innerHTML = '';

    const bulgarian = await drawCalendar('bg');
    expect(bulgarian.weekdays()).not.toEqual(week);
    bulgarian.unmount();
  });

  /* dayjs supplies the formatted date; antd only supplies the chrome. */
  it('sets the dayjs locale as well', async () => {
    const view = await drawCalendar('bg');
    expect(dayjs.locale()).toBe('bg');
    view.unmount();
  });

  /*
    A tag this build does not carry is antd's default - English chrome is a
    better answer than a form that will not render.
  */
  it('falls back for a language the build does not carry', async () => {
    const view = await drawCalendar('xx');
    expect(view.header()).toContain('Jan');
    view.unmount();
  });

  it('survives a loader that rejects', async () => {
    setAntdLocaleLoaders({
      broken: () => Promise.reject(new Error('chunk missing')),
    });
    const view = await drawCalendar('broken');
    expect(view.header()).toContain('Jan');
    view.unmount();
  });
});

describe('choosing what the build carries', () => {
  /*
    Each entry is a separate `import()` with a literal specifier, so the
    bundler emits one chunk per locale and fetches only the one asked for. The
    list is therefore the build-time selection.
  */
  it('ships a set that can be replaced wholesale', () => {
    expect(Object.keys(defaultAntdLocaleLoaders)).toContain('en');
    expect(Object.keys(defaultAntdLocaleLoaders)).toContain('bg');
    setAntdLocaleLoaders({ en: defaultAntdLocaleLoaders.en });
    expect(Object.keys(getAntdLocaleLoaders())).toEqual(['en']);
  });

  it('stops matching a language the replacement dropped', () => {
    setAntdLocaleLoaders({ en: defaultAntdLocaleLoaders.en });
    // No `bg` entry, so nothing to load - and antd keeps its default.
    expect(getAntdLocaleLoaders()['bg']).toBeUndefined();
  });
});

/*
  The regression the design above exists for: dayjs is global, so returning a
  cached locale without re-applying it leaves whichever language was loaded
  most recently in charge of formatting.
*/
describe('switching back to a locale already loaded', () => {
  it('re-applies dayjs, not just the antd chrome', async () => {
    const first = await drawCalendar('bg');
    expect(dayjs.locale()).toBe('bg');
    first.unmount();
    document.body.innerHTML = '';

    const second = await drawCalendar('en');
    expect(dayjs.locale()).toBe('en');
    second.unmount();
    document.body.innerHTML = '';

    // `bg` is cached now. Without re-applying, dayjs would still say `en`.
    const third = await drawCalendar('bg');
    expect(dayjs.locale()).toBe('bg');
    expect(third.header()).toMatch(/яну/i);
    third.unmount();
  });
});
