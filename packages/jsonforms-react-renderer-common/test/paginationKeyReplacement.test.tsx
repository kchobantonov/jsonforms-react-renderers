import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useCollectionPagination } from '../src/collectionPagination';

it('detects an added key even when delimiter-joined keys collide', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const View = ({ keys }: { keys: string[] }) => {
    const page = useCollectionPagination(
      keys,
      { pageSize: 1 },
      {},
      'additionalProperties',
    );
    return <output>{page.current}</output>;
  };
  try {
    act(() => root.render(<View keys={['a', 'b\u0000c']} />));
    act(() => root.render(<View keys={['a', 'b', 'c']} />));
    expect(container.textContent).toBe('2');
  } finally {
    act(() => root.unmount());
  }
});
