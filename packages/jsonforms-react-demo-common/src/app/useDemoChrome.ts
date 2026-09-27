import { useEffect } from 'react';
import {
  DemoLayout,
  DemoMode,
  DemoSettingsStorage,
  writePersistedDemoSettings,
} from '../demoPreferences';

/**
 * Puts the demo's appearance on the document, and takes it off again.
 *
 * The cleanup matters: the demo may be one route in a larger application, and
 * a `dark` class or a `dir` left on `<html>` after it unmounts belongs to
 * nobody and is very hard to trace back here.
 */
export const useDocumentChrome = (
  dark: boolean,
  mode: DemoMode,
  rtl: boolean
): void => {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.dataset.mode = mode;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';

    return () => {
      document.documentElement.classList.remove('dark');
      delete document.documentElement.dataset.mode;
      document.documentElement.removeAttribute('dir');
    };
  }, [dark, mode, rtl]);
};

export interface PersistedPreferences {
  mode: DemoMode;
  locale: string;
  layout: DemoLayout;
  rendererSettings: Record<string, unknown>;
}

/**
 * Writes the preferences back, once they have been read.
 *
 * `hydrated` is the guard that matters: writing before the stored values have
 * been read would persist the defaults over whatever the user had chosen, and
 * the read is asynchronous.
 */
export const useDemoPreferencePersistence = (
  storage: DemoSettingsStorage,
  storageKey: string,
  hydrated: boolean,
  { mode, locale, layout, rendererSettings }: PersistedPreferences
): void => {
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    writePersistedDemoSettings(storage, storageKey, {
      version: 1,
      mode,
      locale,
      layout,
      rendererSettings,
    });
  }, [storage, storageKey, hydrated, mode, locale, layout, rendererSettings]);
};
