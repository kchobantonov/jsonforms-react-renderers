import { useEffect } from 'react';
import type { DemoMode } from './demoPreferences';

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
  rtl: boolean,
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
