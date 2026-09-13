import { RefObject, useEffect, useState } from 'react';

export const useEditorAppearance = (
  ref: RefObject<HTMLElement>,
  explicitTheme?: string
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
  return explicitTheme && !['light', 'dark', 'system'].includes(explicitTheme)
    ? explicitTheme
    : explicitTheme === 'dark'
    ? 'vs-dark'
    : explicitTheme === 'light'
    ? 'vs'
    : dark
    ? 'vs-dark'
    : 'vs';
};
