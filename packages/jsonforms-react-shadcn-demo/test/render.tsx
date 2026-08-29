import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

export const renderMarkup = (node: ReactNode): string => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => root.render(node));
  const markup = container.innerHTML;
  flushSync(() => root.unmount());
  container.remove();
  return markup;
};
