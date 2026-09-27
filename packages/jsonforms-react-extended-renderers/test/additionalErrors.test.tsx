import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import type { ErrorObject } from 'ajv';
import { coreReducer, Actions } from '@jsonforms/core';
import {
  AdditionalErrorStoreProvider,
  additionalErrorOwner,
  createAdditionalErrorStore,
  useAdditionalErrors,
  useOwnedAdditionalErrors,
} from '../src/util/additionalErrors';

/*
  The store, and the middleware that delivers it.

  The two things it has to get right are the ones a host asks about first:
  one owner retracting must not disturb another's errors or the host's, and a
  server error must go when its own field is edited - not when any field is.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 20) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const err = (path: string, message: string): ErrorObject =>
  ({
    instancePath: path,
    schemaPath: '',
    keyword: 'server',
    message,
    params: {},
  } as ErrorObject);

const schema = {
  type: 'object',
  properties: {
    a: { type: 'string' },
    b: { type: 'string' },
    nested: { type: 'object', properties: { c: { type: 'string' } } },
  },
} as any;

/** Drives the middleware the way JSON Forms does, without a React tree. */
const reduce = (
  store: ReturnType<typeof createAdditionalErrorStore>,
  state: any,
  action: any
) => store.middleware(state, action, coreReducer as any);

const init = (
  store: ReturnType<typeof createAdditionalErrorStore>,
  data: any
) =>
  reduce(store, undefined as any, Actions.init(data, schema, undefined as any));

const messages = (state: any) =>
  (state.additionalErrors ?? []).map((e: ErrorObject) => e.message);

describe('publishing through the middleware', () => {
  it('puts published errors into core state', () => {
    const store = createAdditionalErrorStore();
    store.publish('server', [err('/a', 'a is taken')]);
    const state = init(store, { a: '' });
    expect(messages(state)).toEqual(['a is taken']);
  });

  /*
    The point of delivering through middleware rather than the prop: the
    errors are on the form, where `useJsonForms().core.additionalErrors` and
    every control's error lookup can see them - not only under one renderer.
  */
  it('survives an update with no additionalErrors prop', () => {
    const store = createAdditionalErrorStore();
    store.publish('server', [err('/b', 'b is wrong')]);
    let state = init(store, { a: '', b: '' });
    state = reduce(
      store,
      state,
      Actions.update('/a', () => 'typed')
    );
    expect(messages(state)).toEqual(['b is wrong']);
  });

  it('retracts when the owner publishes nothing', () => {
    const store = createAdditionalErrorStore();
    store.publish('server', [err('/a', 'x')]);
    let state = init(store, { a: '' });
    expect(messages(state)).toEqual(['x']);

    store.publish('server', []);
    state = reduce(
      store,
      state,
      Actions.update('/b', () => 'z')
    );
    expect(messages(state)).toEqual([]);
  });

  it('records the owner on each error', () => {
    const store = createAdditionalErrorStore();
    store.publish('server', [err('/a', 'x')]);
    const state = init(store, { a: '' });
    expect(additionalErrorOwner(state.additionalErrors[0])).toBe('server');
  });

  it('does not mutate the caller s error objects', () => {
    const store = createAdditionalErrorStore();
    const mine = err('/a', 'x');
    store.publish('server', [mine]);
    expect(additionalErrorOwner(mine)).toBeUndefined();
  });
});

describe('several owners and the host', () => {
  /*
    The question a host asks first: a button marks a field, then the editor on
    the same field goes quiet. Only the editor's error may go.
  */
  it('keeps two owners at the same path apart', () => {
    const store = createAdditionalErrorStore();
    store.publish('server', [err('/a', 'from the server')]);
    store.publish('editor', [err('/a', 'from the editor')], {
      clearOnChange: false,
    });
    let state = init(store, { a: '' });
    expect(messages(state).sort()).toEqual([
      'from the editor',
      'from the server',
    ]);

    store.publish('editor', []);
    state = reduce(
      store,
      state,
      Actions.update('/b', () => 'anything')
    );
    expect(messages(state)).toEqual(['from the server']);
  });

  /*
    And the other direction: a host that still supplies the prop - which the
    Camunda container does - keeps its own errors through everything.
  */
  it('merges with host-supplied errors and never drops them', () => {
    const store = createAdditionalErrorStore();
    const hostError = err('/a', 'from the host');
    let state = reduce(
      store,
      undefined as any,
      Actions.init(
        { a: '' },
        schema,
        undefined as any,
        {
          additionalErrors: [hostError],
        } as any
      )
    );
    expect(messages(state)).toEqual(['from the host']);

    store.publish('editor', [err('/a', 'from the editor')], {
      clearOnChange: false,
    });
    state = reduce(
      store,
      state,
      Actions.update('/b', () => 'z')
    );
    expect(messages(state).sort()).toEqual([
      'from the editor',
      'from the host',
    ]);

    store.publish('editor', []);
    state = reduce(
      store,
      state,
      Actions.update('/b', () => 'zz')
    );
    expect(messages(state)).toEqual(['from the host']);
  });
});

describe('clearing when the field changes', () => {
  /* The Camunda rule: its own field, not any field. */
  it('clears only the error whose value changed', () => {
    const store = createAdditionalErrorStore();
    store.publish('server', [err('/a', 'about a'), err('/b', 'about b')]);
    let state = init(store, { a: '', b: '' });

    state = reduce(
      store,
      state,
      Actions.update('a', () => 'typed')
    );
    expect(messages(state)).toEqual(['about b']);
  });

  it('clears a nested path', () => {
    const store = createAdditionalErrorStore();
    store.publish('server', [err('/nested/c', 'about c')]);
    let state = init(store, { nested: { c: '' } });
    state = reduce(
      store,
      state,
      Actions.update('nested.c', () => 'typed')
    );
    expect(messages(state)).toEqual([]);
  });

  /*
    By value, not by which path the action named: rewriting a field with what
    it already held is not a correction, and clearing there would let a
    stray re-render dismiss a server error nobody addressed.
  */
  it('keeps the error when the value is rewritten unchanged', () => {
    const store = createAdditionalErrorStore();
    store.publish('server', [err('/a', 'about a')]);
    let state = init(store, { a: 'same' });
    state = reduce(
      store,
      state,
      Actions.update('a', () => 'same')
    );
    expect(messages(state)).toEqual(['about a']);
  });

  /* An owner that manages its own lifecycle opts out - Monaco does. */
  it('leaves an opted-out owner alone', () => {
    const store = createAdditionalErrorStore();
    store.publish('editor', [err('/a', 'syntax')], { clearOnChange: false });
    let state = init(store, { a: '' });
    state = reduce(
      store,
      state,
      Actions.update('a', () => 'typed')
    );
    expect(messages(state)).toEqual(['syntax']);
  });
});

describe('the React surface', () => {
  const Publisher = ({
    owner,
    errors,
    clearOnChange,
  }: {
    owner: string;
    errors: ErrorObject[];
    clearOnChange?: boolean;
  }) => {
    useOwnedAdditionalErrors(owner, errors, { clearOnChange });
    return null;
  };

  const Reader = () => {
    const errors = useAdditionalErrors();
    return <span data-read>{errors.map((e) => e.message).join('|')}</span>;
  };

  const mount = (children: React.ReactNode) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const Harness = () => {
      const store = useRef(createAdditionalErrorStore()).current;
      return (
        <AdditionalErrorStoreProvider store={store}>
          {children}
        </AdditionalErrorStoreProvider>
      );
    };
    act(() => root.render(<Harness />));
    return {
      read: () => container.querySelector('[data-read]')?.textContent ?? '',
      unmount: () => act(() => root.unmount()),
    };
  };

  it('publishes and is readable from inside the form', async () => {
    const view = mount(
      <>
        <Publisher owner='a' errors={[err('/a', 'boom')]} />
        <Reader />
      </>
    );
    await settle();
    expect(view.read()).toBe('boom');
    view.unmount();
  });

  /* A control that leaves takes its error with it. */
  it('retracts on unmount', async () => {
    const Mounted = () => {
      const [there, setThere] = useState(true);
      return (
        <>
          {there && <Publisher owner='a' errors={[err('/a', 'boom')]} />}
          <Reader />
          <button onClick={() => setThere(false)}>go</button>
        </>
      );
    };
    const view = mount(<Mounted />);
    await settle();
    expect(view.read()).toBe('boom');

    act(() => {
      document.querySelector('button')!.click();
    });
    await settle();
    expect(view.read()).toBe('');
    view.unmount();
  });

  /* Publication is a host opt-in; a renderer must not require it. */
  it('is inert outside a provider', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    expect(() =>
      act(() => root.render(<Publisher owner='a' errors={[err('/a', 'x')]} />))
    ).not.toThrow();
    act(() => root.unmount());
  });
});
