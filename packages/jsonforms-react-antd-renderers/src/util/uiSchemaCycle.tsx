import { UISchemaElement } from '@jsonforms/core';
import React, { useContext, useEffect, useMemo } from 'react';

/**
 * Breaks a UI-schema registry entry that resolves to itself.
 *
 * `findUISchema` consults the registry with a schema and a path. A renderer
 * that then **dispatches the result at the same path** can be handed straight
 * back to itself: the entry matches the schema, the dispatch selects the same
 * renderer, the renderer asks the registry the same question, and the tree
 * grows until the heap runs out. Nothing throws - React is happy to build an
 * infinitely deep tree - so the symptom is a frozen tab and an out-of-memory
 * abort with no stack pointing anywhere useful.
 *
 * The shape that does it is ordinary and looks correct:
 *
 * ```ts
 * uischemas = [{
 *   tester: (schema) => (schema.title === 'Address' ? 10 : -1),
 *   uischema: { type: 'Control', scope: '#' },
 * }]
 * ```
 *
 * A **layout** entry is fine, because dispatching a layout does not come back
 * to a control renderer. A Control entry carrying `options.detail` is fine
 * too, because core's `findUISchema` returns that detail before it consults
 * the registry - which is why the combination that hangs is the one an author
 * reaches for first, and the one with the most configuration works.
 *
 * ## How the guard works
 *
 * Each renderer announces, through context, the element it is **about to
 * dispatch at which path**. If a descendant is about to dispatch the same
 * element at the same path, that is the fixed point, and it falls back to the
 * generated UI schema instead - the same thing it would have used had the
 * registry matched nothing.
 *
 * Context rather than a module-level set, because the answer depends on where
 * in the tree the renderer sits: the same element at the same path is only a
 * cycle when it is already an *ancestor*, not when two sibling forms happen
 * to render it.
 */

const emptyStack: ReadonlySet<string> = new Set();

const UiSchemaCycleContext =
  React.createContext<ReadonlySet<string>>(emptyStack);

/** Stable code, so a host can grep for it. */
export const UI_SCHEMA_CYCLE_DIAGNOSTIC = 'uischema.registryCycle';

/**
 * What identifies "the same dispatch".
 *
 * The path and the element's own identity as an author wrote it - its type and
 * scope. Object identity is not usable: a caller may spread the entry to add a
 * label, so the descendant sees a copy of what the ancestor dispatched.
 */
const signatureOf = (uischema: UISchemaElement, path: string) =>
  `${path}::${uischema?.type ?? ''}::${
    (uischema as { scope?: string })?.scope ?? ''
  }`;

export interface UiSchemaCycleGuard {
  /** True when dispatching this element here would re-enter the same renderer. */
  cycle: boolean;
  /** The stack to publish to descendants. */
  stack: ReadonlySet<string>;
}

export const useUiSchemaCycleGuard = (
  uischema: UISchemaElement | undefined,
  path: string,
  /** Named in the diagnostic, so the message says which renderer noticed. */
  renderer: string
): UiSchemaCycleGuard => {
  const seen = useContext(UiSchemaCycleContext);
  const signature = uischema ? signatureOf(uischema, path) : undefined;
  const cycle = signature !== undefined && seen.has(signature);

  const stack = useMemo(() => {
    if (signature === undefined || cycle) {
      return seen;
    }
    const next = new Set(seen);
    next.add(signature);
    return next;
  }, [seen, signature, cycle]);

  /*
    In an effect, not during render: React may render a component more than
    once for one commit, and a warning printed during render would repeat.
  */
  useEffect(() => {
    if (!cycle) {
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(
      `${UI_SCHEMA_CYCLE_DIAGNOSTIC}: the UI schema registry returned an ` +
        `element that ${renderer} would dispatch back to itself at ` +
        `${JSON.stringify(path || '<root>')} (${signature}). The generated ` +
        `UI schema was used instead. A registry entry for an object schema ` +
        `should be a layout, or a Control carrying options.detail.`
    );
  }, [cycle, renderer, path, signature]);

  return { cycle, stack };
};

/** Publishes the stack to everything rendered inside. */
export const UiSchemaCycleProvider = ({
  stack,
  children,
}: {
  stack: ReadonlySet<string>;
  children: React.ReactNode;
}) => (
  <UiSchemaCycleContext.Provider value={stack}>
    {children}
  </UiSchemaCycleContext.Provider>
);
