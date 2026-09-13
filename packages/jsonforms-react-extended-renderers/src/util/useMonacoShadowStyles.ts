import { RefObject, useEffect } from 'react';

// Monaco's loader inserts global styles; mirror only Monaco styles for shadow hosts.
export const useMonacoShadowStyles = (ref: RefObject<HTMLElement>) => {
  useEffect(() => {
    const root = ref.current?.getRootNode();
    if (!(root instanceof ShadowRoot)) return;
    const copies = new Map<Element, Element>();
    const sync = () => {
      for (const source of Array.from(
        document.head.querySelectorAll('style, link[rel="stylesheet"]')
      )) {
        const content = source.getAttribute('href') ?? source.textContent ?? '';
        if (!/monaco|\/vs\//i.test(content)) continue;
        const previous = copies.get(source);
        if (
          previous &&
          previous.textContent === source.textContent &&
          previous.getAttribute('href') === source.getAttribute('href')
        )
          continue;
        const copy = source.cloneNode(true) as Element;
        if (previous) previous.replaceWith(copy);
        else root.appendChild(copy);
        copies.set(source, copy);
      }
      for (const [source, copy] of copies) {
        if (!source.isConnected) {
          copy.remove();
          copies.delete(source);
        }
      }
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
    sync();
    return () => {
      observer.disconnect();
      copies.forEach((copy) => copy.remove());
    };
  }, [ref]);
};
