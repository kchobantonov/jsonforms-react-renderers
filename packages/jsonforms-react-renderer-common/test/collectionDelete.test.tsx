import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { useCollectionDelete } from '../src/useCollectionDelete';

it.each(['additionalItems', 'additionalProperties'])('%s follows policy and rejects stale or forbidden deletes', (catalogId) => {
  const root = createRoot(document.createElement('div'));
  let state: ReturnType<typeof useCollectionDelete<number>>;
  let removed = 0;
  let data: unknown[] = [''];
  let enabled = true;
  let identity = 'first';
  let options: any = { confirmation: { delete: 'always' } };
  let config: any;
  const Harness = () => {
    state = useCollectionDelete({ data, identity, catalogId, options, config,
      canRemove: () => enabled, value: key => data[key], remove: () => { removed++; } });
    return null;
  };
  const render = () => act(() => root.render(<Harness />));
  const request = () => act(() => state.request(0));
  const confirm = () => act(() => state.confirm());
  render(); request();
  expect(state!.confirming).toBe(true); // empty string is an existing value
  act(() => state.cancel()); expect(removed).toBe(0);
  request(); enabled = false; render(); confirm(); expect(removed).toBe(0);
  enabled = true; render(); request(); data = ['replacement']; render(); confirm(); expect(removed).toBe(0);
  request(); identity = 'second'; render(); confirm(); expect(removed).toBe(0);
  request(); confirm(); confirm(); expect(removed).toBe(1);
  options = undefined;
  config = { jsonformsExtended: { confirmation: { default: 'never', renderers: { [catalogId]: { delete: 'always' } } } } };
  render(); request(); expect(state!.confirming).toBe(true); act(() => state.cancel());
  options = { confirmation: { delete: 'never' } }; render(); request(); expect(removed).toBe(2);
  options = { confirmation: { delete: 'complex' } }; data = [{}]; render(); request(); expect(removed).toBe(3);
  data = [{ name: 'Keep' }]; render(); request(); expect(state!.confirming).toBe(true); expect(removed).toBe(3);
  act(() => root.unmount());
});
