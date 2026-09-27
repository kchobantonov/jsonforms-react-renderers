import { Actions, Generate } from '@jsonforms/core';
import {
  JsonFormsDispatch,
  JsonFormsInitStateProps,
  JsonFormsStateProvider,
  useJsonForms,
} from '@jsonforms/react';
import type { JsonFormsReactProps } from '@jsonforms/react';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  AdditionalErrorStore,
  AdditionalErrorStoreProvider,
  createAdditionalErrorStore,
  useAdditionalErrorStore,
} from '../util/additionalErrors';
import {
  HandleAction,
  HandleActionContext,
  useHandleAction,
} from '../renderers/actionContext';

/**
 * `<JsonForms>` with this renderer set's integration already wired.
 *
 * The React counterpart of the Vue 2 `ResolvedJsonForms`, and it exists for
 * the same reason: the extended renderers need things a bare `<JsonForms>`
 * does not provide, and an application should not have to know what they are.
 *
 * | | Without this |
 * | --- | --- |
 * | The additional-error store | Two props that are only useful together, plus a provider |
 * | The action handler | A `HandleActionContext.Provider` around the form, or every `Button` is a no-op |
 *
 * ```tsx
 * <ExtendedJsonForms schema={schema} uischema={uischema} data={data}
 *   renderers={renderers} cells={cells} onChange={onChange} />
 * ```
 *
 * A form using the Monaco control with `propagateErrors` and a plain
 * `<JsonForms>` publishes into nothing. It now says so - `additionalErrors.noStore`
 * - rather than going quiet, but this is the fix rather than the warning.
 *
 * **Bring your own store** when the application needs to publish too, which is
 * the ordinary case for server-side validation:
 *
 * ```tsx
 * const store = useRef(createAdditionalErrorStore()).current;
 *
 * <ExtendedJsonForms store={store} … />
 *
 * // after a rejected submit
 * store.publish('server', response.validationErrors);
 * ```
 *
 * ## What it deliberately does not do
 *
 * **Resolve `$ref`.** The Vue 2 wrapper does, and it is tempting to copy, but
 * the two cases are not the same:
 *
 * - A **local** `$ref` - `#/$defs/x`, `#/definitions/x` - already works.
 *   JSON Forms resolves it while rendering and Ajv while validating; verified
 *   against both spellings.
 * - A **remote** one, or a `schemaUrl`, does not. Resolving it is asynchronous,
 *   so a wrapper that did it would have to hold the form unmounted while it
 *   fetched, and would own a loading and a failure state.
 *
 * That is a different component with a different lifecycle, and putting it
 * here would make every form pay a mount delay for a capability most do not
 * use. If remote schemas are needed, they belong in a `ResolvedJsonForms` of
 * their own, wrapping this.
 */
export interface ExtendedJsonFormsProps
  extends JsonFormsInitStateProps,
    JsonFormsReactProps {
  /**
   * A store the application also publishes into.
   *
   * Absent, an enclosing `AdditionalErrorStoreProvider` is used if there is
   * one - it can only have been put there deliberately - and otherwise a store
   * is created for this form. Several forms under one provider therefore share
   * a store, which is the host's decision to make and means they see each
   * other's published errors.
   */
  store?: AdditionalErrorStore;
  /**
   * What a `Button` hands its command to.
   *
   * Absent, an enclosing `HandleActionContext` is left in place rather than
   * shadowed with `undefined` - so a container that provides one for several
   * forms keeps working, and only a host that actually passes a handler
   * replaces it.
   */
  onAction?: HandleAction;
}

/**
 * Re-reduces the form when the store changes, so the middleware can inject.
 *
 * Middleware is **passive**: publishing an error dispatches nothing, so
 * without this the form would not see a published error until the user
 * happened to type.
 *
 * The obvious alternative - putting the errors in the `additionalErrors` prop
 * - looks simpler and is broken. `JsonFormsStateProvider` lists that prop in
 * an effect's dependencies and re-dispatches `updateCore(data, …)` with the
 * **prop** data of that render; a renderer publishes from its own effect,
 * which runs *before* the parent's `onChange` has told the host about the
 * edit that provoked it. So the re-dispatch carries the previous data and
 * undoes the edit. It showed up as a language select that would not move:
 * choosing a language made the editor publish, and publishing put the old
 * language back.
 *
 * Dispatching from **inside** the provider avoids the whole question - the
 * data comes from core, which is current by construction, and the prop never
 * changes.
 */
const AdditionalErrorsBridge = ({ store }: { store: AdditionalErrorStore }) => {
  const ctx = useJsonForms();
  const dispatch = ctx.dispatch;
  const coreRef = useRef(ctx.core);
  coreRef.current = ctx.core;

  useEffect(() => {
    if (!dispatch) {
      return undefined;
    }
    return store.subscribe(() => {
      const core = coreRef.current;
      if (!core) {
        return;
      }
      /*
        No `additionalErrors` option, so core keeps what it has and the
        middleware writes the store's current set over it. Data and schema
        come from core rather than from a prop, so this cannot move the form.
      */
      dispatch(
        Actions.updateCore(core.data, core.schema, core.uischema, {
          ajv: core.ajv,
          validationMode: core.validationMode,
        } as never)
      );
    });
  }, [store, dispatch]);

  return null;
};

export const ExtendedJsonForms = ({
  store,
  onAction,
  ajv,
  data,
  schema,
  uischema,
  renderers,
  cells,
  config,
  uischemas,
  readonly,
  validationMode,
  i18n,
  additionalErrors,
  middleware,
  onChange,
}: ExtendedJsonFormsProps) => {
  /*
    Per mounted form, not per render: a store is the identity errors are
    published against, and a new one each render would lose them.
  */
  const fallback = useRef<AdditionalErrorStore>();
  if (!fallback.current) {
    fallback.current = createAdditionalErrorStore();
  }
  const inherited = useAdditionalErrorStore();
  const outerAction = useHandleAction();
  const effective = store ?? (inherited.inert ? fallback.current : inherited);

  /*
    Composed from the same pieces `<JsonForms>` uses, rather than rendering it,
    because the bridge above has to sit **inside** the provider to reach its
    dispatch. Everything else here is what `JsonForms` itself does.
  */
  const schemaToUse = useMemo(
    () => (schema !== undefined ? schema : Generate.jsonSchema(data)),
    [schema, data]
  );
  const uischemaToUse = useMemo(
    () =>
      typeof uischema === 'object'
        ? uischema
        : Generate.uiSchema(schemaToUse, undefined, undefined, schemaToUse),
    [uischema, schemaToUse]
  );

  const combinedMiddleware = useMemo(
    () =>
      middleware
        ? (state: never, action: never, defaultReducer: never) =>
            effective.middleware(state, action, ((innerState, innerAction) =>
              middleware(
                innerState,
                innerAction,
                defaultReducer as never
              )) as never)
        : effective.middleware,
    [effective, middleware]
  ) as typeof effective.middleware;

  const form = (
    <JsonFormsStateProvider
      initState={{
        core: {
          ajv,
          data,
          schema: schemaToUse,
          uischema: uischemaToUse,
          validationMode,
          /*
            Only the host's own. What the store holds arrives through the
            middleware, so this prop never changes when something publishes -
            which is the entire point.
          */
          additionalErrors,
        } as never,
        config,
        uischemas,
        renderers,
        cells,
        readonly,
        i18n,
      }}
      onChange={onChange}
      middleware={combinedMiddleware}
    >
      <AdditionalErrorsBridge store={effective} />
      <JsonFormsDispatch />
    </JsonFormsStateProvider>
  );

  const wrapped = (
    <AdditionalErrorStoreProvider store={effective}>
      {form}
    </AdditionalErrorStoreProvider>
  );

  /*
    Only when this form was given one. Wrapping unconditionally would set the
    context to `undefined` for everything inside, which silently turns every
    `Button` into a no-op in a host whose provider sits further up.
  */
  const handler = onAction ?? outerAction;
  return handler === outerAction ? (
    wrapped
  ) : (
    <HandleActionContext.Provider value={handler}>
      {wrapped}
    </HandleActionContext.Provider>
  );
};
