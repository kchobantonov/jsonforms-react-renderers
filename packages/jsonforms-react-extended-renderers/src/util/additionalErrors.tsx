import type { JsonFormsCore, Middleware } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import React, { createContext, useContext, useRef } from 'react';

/**
 * Errors that have nothing to do with JSON Schema validation.
 *
 * A server rejects a submit and names two fields; a code editor's language
 * service finds a syntax error; a host wants to mark a field from somewhere
 * else entirely. JSON Forms calls these `additionalErrors` and treats them as
 * first-class - `getErrorsAt` merges them with schema errors, and
 * `validationMode` does not suppress them - but supplies no way for anything
 * inside the form to produce one.
 *
 * This is that way. A **store**, owner-keyed, delivered through JSON Forms'
 * own `middleware` hook.
 *
 * ```tsx
 * const store = useRef(createAdditionalErrorStore()).current;
 *
 * <JsonForms {...useAdditionalErrorProps(store)} … />
 *
 * store.publish('server', response.validationErrors);  // after a submit
 * store.all();                                          // read them back
 * ```
 *
 * `useAdditionalErrorProps` supplies **both** halves, and both are needed:
 *
 * | | Does |
 * | --- | --- |
 * | `additionalErrors` | Carries the published errors in. Middleware is passive - publishing dispatches nothing, so without a prop change the form would not re-reduce until the user happened to type. |
 * | `middleware` | Clears on change, and merges. Only middleware sees `UPDATE` with the data before *and* after, which is what the clearing rule needs. |
 *
 * Neither alone is enough, and that is not an accident of this design: core
 * offers no action a renderer or a host can dispatch to add an additional
 * error, and no hook that fires when one should be withdrawn.
 *
 * ## What the store buys over passing the prop directly
 *
 * - **A renderer can publish**, because the store is reachable through context
 *   rather than through the host's props.
 * - **Ownership.** One owner retracting cannot disturb another's errors, or
 *   the host's. Two editors on one path, or an editor beside a server error,
 *   coexist.
 * - **Clearing is automatic**, and is the rule the Camunda forms already use.
 * - The errors are in core state, so `useJsonForms().core.additionalErrors`
 *   reads them - the point is having them *on the form*, not only under one
 *   control.
 *
 * **A host that already passes its own `additionalErrors` keeps working.**
 * The middleware filters out only what this store produced and leaves the rest
 * in place, so host-supplied errors and published ones coexist and neither
 * clears the other.
 *
 * ## Clearing
 *
 * By default an owner's error is dropped when **the value at its own
 * `instancePath` changes** - the rule the Vue 2 Camunda container already
 * applies to server errors, moved from one container component to somewhere
 * every form gets it. Comparison is by value, not by the action's path, so an
 * update that rewrites a field with what it already held clears nothing.
 *
 * An owner that manages its own lifecycle opts out with
 * `{ clearOnChange: false }`. The Monaco control does: it republishes or
 * retracts its summary as the language service reports, and a keystroke
 * clearing it would make the message flicker.
 */

/** Marks an error this store produced, so host-supplied ones are left alone. */
const OWNED = Symbol.for('jsonforms.additionalError.owner');

const isOwned = (error: ErrorObject): boolean =>
  (error as unknown as Record<symbol, unknown>)[OWNED] !== undefined;

const ownerOf = (error: ErrorObject): string | undefined =>
  (error as unknown as Record<symbol, string>)[OWNED];

export interface PublishOptions {
  /**
   * Drop these errors when the value at their `instancePath` changes.
   * Default true.
   */
  clearOnChange?: boolean;
}

interface OwnerEntry {
  errors: ErrorObject[];
  clearOnChange: boolean;
}

/** Stable code, so a host can grep for it. */
export const NO_STORE_DIAGNOSTIC = 'additionalErrors.noStore';

export interface AdditionalErrorStore {
  /**
   * True for the placeholder a renderer gets outside a provider.
   *
   * A renderer that was *asked* to publish - Monaco with `propagateErrors` on
   * - can then say so instead of going quiet, which is the difference between
   * a host learning it forgot the wiring and a host concluding the option
   * does not work.
   */
  readonly inert?: boolean;
  /** Replaces everything this owner had published. An empty list retracts. */
  publish: (
    owner: string,
    errors: ErrorObject[],
    options?: PublishOptions
  ) => void;
  /** Retracts one owner's errors. */
  clear: (owner: string) => void;
  /** Retracts everything - a fresh submit, for instance. */
  clearAll: () => void;
  /** Everything published, in publication order. */
  all: () => ErrorObject[];
  /** Called after any change; returns an unsubscribe. */
  subscribe: (listener: () => void) => () => void;
  /** Hand this to `<JsonForms middleware={…} />`. */
  middleware: Middleware;
}

/** `/a/b/0/c` as lodash's `a.b.0.c`; the empty pointer is the whole document. */
const pathOf = (instancePath: string): string =>
  instancePath.replace(/^\//, '').split('/').join('.');

const valueAt = (data: unknown, instancePath: string): unknown =>
  instancePath === '' || instancePath === '/'
    ? data
    : get(data, pathOf(instancePath));

export const createAdditionalErrorStore = (): AdditionalErrorStore => {
  const owners = new Map<string, OwnerEntry>();
  const listeners = new Set<() => void>();
  let snapshot: ErrorObject[] = [];

  const rebuild = () => {
    const next: ErrorObject[] = [];
    owners.forEach((entry) => next.push(...entry.errors));
    /*
      Identity follows content. Anything reading this - a React subscription,
      or the middleware deciding whether the state changed - would otherwise
      see a change on every rebuild and re-render or re-dispatch forever.
    */
    if (!isEqual(next, snapshot)) {
      snapshot = next;
      listeners.forEach((listener) => listener());
      return true;
    }
    return false;
  };

  const publish: AdditionalErrorStore['publish'] = (owner, errors, options) => {
    if (errors.length === 0) {
      if (owners.delete(owner)) {
        rebuild();
      }
      return;
    }
    /*
      Stamped on a copy, so a caller's array is never mutated and a host that
      hands the same objects to something else is unaffected. The marker is a
      `Symbol.for`, which cannot collide with a `params` key a host chose and
      does not appear in JSON.
    */
    const stamped = errors.map((error) => {
      const copy = { ...error } as ErrorObject;
      (copy as unknown as Record<symbol, string>)[OWNED] = owner;
      return copy;
    });
    owners.set(owner, {
      errors: stamped,
      clearOnChange: options?.clearOnChange !== false,
    });
    rebuild();
  };

  const clear: AdditionalErrorStore['clear'] = (owner) => {
    if (owners.delete(owner)) {
      rebuild();
    }
  };

  const clearAll = () => {
    if (owners.size > 0) {
      owners.clear();
      rebuild();
    }
  };

  /**
   * Drops the errors whose own value changed.
   *
   * Only owners that did not opt out, and only the individual errors that
   * point at something that moved - one server error going does not take its
   * siblings with it.
   */
  const pruneChanged = (before: unknown, after: unknown) => {
    let changed = false;
    owners.forEach((entry, owner) => {
      if (!entry.clearOnChange) {
        return;
      }
      const kept = entry.errors.filter((error) =>
        isEqual(
          valueAt(before, error.instancePath ?? ''),
          valueAt(after, error.instancePath ?? '')
        )
      );
      if (kept.length === entry.errors.length) {
        return;
      }
      changed = true;
      if (kept.length === 0) {
        owners.delete(owner);
      } else {
        owners.set(owner, { ...entry, errors: kept });
      }
    });
    if (changed) {
      rebuild();
    }
  };

  const middleware: Middleware = (state, action, defaultReducer) => {
    const next = defaultReducer(state, action) as JsonFormsCore;

    /*
      `UPDATE_DATA` is spelled `jsonforms/UPDATE`. The published middleware
      documentation names the constant, not the string, and the two do not
      match - a filter written against `'jsonforms/UPDATE_DATA'` silently
      never runs.
    */
    if (action?.type === 'jsonforms/UPDATE' && state !== next) {
      pruneChanged(state?.data, next.data);
    }

    const published = snapshot;
    /*
      Whatever the host supplied stays: only errors this store produced are
      replaced. That is what lets a form use the prop and this together, and
      what stops one owner's retraction from taking another's - or the host's
      - errors with it.
    */
    const hostErrors = (next.additionalErrors ?? []).filter(
      (error) => !isOwned(error)
    );
    const combined =
      published.length === 0 ? hostErrors : [...hostErrors, ...published];

    if (
      combined.length === (next.additionalErrors ?? []).length &&
      combined.every((error, index) => error === next.additionalErrors?.[index])
    ) {
      return next;
    }
    return { ...next, additionalErrors: combined };
  };

  return {
    publish,
    clear,
    clearAll,
    all: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    middleware,
  };
};

/** Which owner an error belongs to, or undefined for a host-supplied one. */
export const additionalErrorOwner = (error: ErrorObject): string | undefined =>
  ownerOf(error);

const inertStore: AdditionalErrorStore = {
  inert: true,
  publish: () => undefined,
  clear: () => undefined,
  clearAll: () => undefined,
  all: () => [],
  subscribe: () => () => undefined,
  middleware: (state, action, defaultReducer) => defaultReducer(state, action),
};

const StoreContext = createContext<AdditionalErrorStore>(inertStore);

export const AdditionalErrorStoreProvider = ({
  store,
  children,
}: {
  store: AdditionalErrorStore;
  children: React.ReactNode;
}) => <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;

/**
 * The store for the enclosing form, or an inert one.
 *
 * Inert rather than throwing, because a renderer must not require the host to
 * have wired anything: publication is what a host opts into, and a renderer
 * that also shows its diagnostic locally keeps doing so either way.
 */
export const useAdditionalErrorStore = (): AdditionalErrorStore =>
  useContext(StoreContext);

/**
 * Publishes one owner's errors for as long as the component is mounted.
 *
 * Republished when the content changes, and **retracted on unmount** - an
 * error left behind by a control that is no longer on the form would make it
 * invalid with nothing on screen to explain why.
 */
export const useOwnedAdditionalErrors = (
  owner: string,
  errors: ErrorObject[],
  options?: PublishOptions
): void => {
  const store = useAdditionalErrorStore();

  /*
    Publication is a host opt-in, so having no store is not an error - but a
    renderer that has something to publish and nowhere to put it must say so.
    Silence here reads as "the option does not work".
  */
  const wanted = errors.length > 0;
  React.useEffect(() => {
    if (!store.inert || !wanted) {
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(
      `${NO_STORE_DIAGNOSTIC}: ${JSON.stringify(
        owner
      )} has errors to publish, ` +
        `but this form installed no additional-error store, so they will not ` +
        `appear. Render the form with <ExtendedJsonForms>, or pass ` +
        `useAdditionalErrorProps(store) to <JsonForms> and wrap it in ` +
        `<AdditionalErrorStoreProvider>.`
    );
  }, [store, owner, wanted]);
  const latest = useRef({ errors, options });
  latest.current = { errors, options };

  const signature = errors
    .map((error) => `${error.instancePath}|${error.keyword}|${error.message}`)
    .join('\u0000');
  const clearOnChange = options?.clearOnChange !== false;

  React.useEffect(() => {
    store.publish(owner, latest.current.errors, latest.current.options);
  }, [store, owner, signature, clearOnChange]);

  React.useEffect(
    () => () => {
      store.clear(owner);
    },
    [store, owner]
  );
};

/** Everything published, re-rendering the caller when it changes. */
export const useAdditionalErrors = (): ErrorObject[] => {
  const store = useAdditionalErrorStore();
  return React.useSyncExternalStore(store.subscribe, store.all, store.all);
};

/**
 * Read by `ExtendedJsonForms`, which is how a form should install a store.
 *
 * There is no `useAdditionalErrorProps` for a host assembling `<JsonForms>`
 * itself, and that is deliberate: delivering published errors through the
 * `additionalErrors` **prop** undoes the edit that provoked them.
 * `JsonFormsStateProvider` lists the prop in an effect's dependencies and
 * re-dispatches `updateCore(data, …)` with the prop data of that render, while
 * a renderer publishes from its own effect - which runs before the parent's
 * `onChange` has told the host about the edit. The re-dispatch then carries
 * the previous data.
 *
 * `ExtendedJsonForms` composes JSON Forms' own provider so it can dispatch
 * from **inside**, where the data comes from core and is current by
 * construction. A host that needs to assemble the form itself should copy that
 * arrangement rather than reach for the prop.
 */
