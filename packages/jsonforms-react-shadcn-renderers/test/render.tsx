import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

export const renderMarkup = (node: ReactNode): string => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  const markup = container.innerHTML;
  act(() => root.unmount());
  container.remove();
  return markup;
};
