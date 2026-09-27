import { RefObject, useEffect, useState } from 'react';

export type EditorAppearance = {
  /** Resolved light/dark for the control, whatever the source. */
  isDark: boolean;
  /**
   * A theme name the uischema supplied verbatim (i.e. not light/dark/system).
   * Only meaningful to renderers that understand named themes, such as Monaco.
   */
  customTheme?: string;
};

export const useEditorAppearance = (
  ref: RefObject<HTMLElement>,
  explicitTheme?: string,
  /**
   * Authoritative light/dark from the host design system (e.g. antd's active
   * theme algorithm). When supplied it wins over the DOM luminance heuristic
   * below, which only guesses and silently falls back to prefers-color-scheme
   * when no ancestor paints an opaque background.
   */
  isDark?: boolean
) => {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ancestors: Element[] = [];
    let current: Element | null = node;
    while (current) {
      ancestors.push(current);
      const root = current.getRootNode();
      current =
        current.parentElement ??
        (root instanceof ShadowRoot ? root.host : null);
    }
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const update = () => {
      for (const element of ancestors) {
        const color = getComputedStyle(element).backgroundColor;
        const values = color.match(/[\d.]+/g)?.map(Number);
        if (
          values &&
          values.length >= 3 &&
          (values.length < 4 || values[3] > 0.5)
        ) {
          setDark(
            values[0] * 0.299 + values[1] * 0.587 + values[2] * 0.114 < 128
          );
          return;
        }
      }
      setDark(Boolean(media?.matches));
    };
    const observer = new MutationObserver(update);
    ancestors.forEach((element) =>
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['class', 'style', 'mode', 'dark'],
      })
    );
    media?.addEventListener('change', update);
    update();
    return () => {
      observer.disconnect();
      media?.removeEventListener('change', update);
    };
  }, [ref]);
  // Precedence: explicit uischema theme > host design system > DOM heuristic.
  // 'system' deliberately skips the design system and follows the environment.
  const named = ['light', 'dark', 'system'];
  return {
    customTheme:
      explicitTheme && !named.includes(explicitTheme)
        ? explicitTheme
        : undefined,
    isDark:
      explicitTheme === 'dark'
        ? true
        : explicitTheme === 'light'
        ? false
        : explicitTheme !== 'system' && isDark !== undefined
        ? isDark
        : dark,
  };
};
