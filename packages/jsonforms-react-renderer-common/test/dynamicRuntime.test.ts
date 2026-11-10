import { expect, it } from 'vite-plus/test';
import {
  dynamicUiExpressionsReady,
  loadDynamicUiExpressions,
} from '../src/dynamicRuntime';
import {
  createDynamicUiCache,
  createDynamicUiResolver,
} from '../src/dynamicUi';
import type { UISchemaElement } from '@jsonforms/core';

it('loads only on preparation, shares the import, and invalidates pre-load cache entries', async () => {
  expect(dynamicUiExpressionsReady()).toBe(false);
  const resolve = createDynamicUiResolver(createDynamicUiCache());
  const input = { data: {}, path: '', external: { label: 'Bound' } };
  expect(
    resolve(
      {
        type: 'Label',
        $dynamic: { text: { bind: 'external.label' } },
      } as unknown as UISchemaElement,
      input,
    ).element,
  ).toMatchObject({ text: 'Bound' });
  expect(dynamicUiExpressionsReady()).toBe(false);
  const ui = {
    type: 'Label',
    text: 'Fallback',
    $dynamic: { text: { expression: 'external.label' } },
  } as unknown as UISchemaElement;
  expect(resolve(ui, input).failures.length).toBeGreaterThan(0);
  const first = loadDynamicUiExpressions();
  expect(loadDynamicUiExpressions()).toBe(first);
  await first;
  expect(dynamicUiExpressionsReady()).toBe(true);
  expect(resolve(ui, input).element).toMatchObject({ text: 'Bound' });
  expect(resolve(ui, input).failures).toEqual([]);
});
