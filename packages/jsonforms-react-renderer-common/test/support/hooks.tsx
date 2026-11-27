import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  coreReducer,
  init,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';
import { JsonFormsContext, useJsonForms } from '@jsonforms/react';
import { vi } from 'vite-plus/test';

type Context = ReturnType<typeof useJsonForms>;

/** Mounts a public hook with a real core reducer and an observable parent form. */
export function mountHook<T>(
  hook: () => T,
  {
    data = {},
    schema = { type: 'object' } as JsonSchema,
    uischema = { type: 'VerticalLayout', elements: [] } as UISchemaElement,
    context: overrides = {},
    render,
  }: {
    data?: unknown;
    schema?: JsonSchema;
    uischema?: UISchemaElement;
    context?: Partial<Context>;
    render?: (result: T) => React.ReactNode;
  } = {},
) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let result!: T;
  const Probe = () => {
    result = hook();
    return render?.(result) ?? null;
  };
  const dispatch = vi.fn((action: any) => {
    context = { ...context, core: coreReducer(context.core, action) };
    paint();
  });
  let context: Context = {
    core: coreReducer(undefined, init(data, schema, uischema)),
    dispatch,
    ...overrides,
  };
  const paint = () =>
    root.render(
      <JsonFormsContext.Provider value={context}>
        <Probe />
      </JsonFormsContext.Provider>,
    );
  act(paint);
  return {
    container,
    dispatch,
    get current() {
      return result;
    },
    get context() {
      return context;
    },
    rerender(patch: Partial<Context> = {}) {
      context = { ...context, ...patch };
      act(paint);
    },
    replaceData(next: unknown) {
      context = { ...context, core: { ...context.core!, data: next } };
      act(paint);
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}
