import { resolveCollapsed } from './groupState';
import { Categorization, Category, isVisible } from '@jsonforms/core';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * A category's stable identity, for keeping the selection across a reorder.
 *
 * The specification says to "preserve the selected category's identity across
 * reordering" and that sibling `name`s SHOULD be unique, so the name is the
 * identity when there is one. Without a name there is nothing to preserve -
 * position is all a category has - so the index stands in, and moving an
 * unnamed category moves the selection with the slot rather than the content.
 * Prefixed so a category named `2` cannot collide with the third unnamed one.
 */
export const categoryKey = (category: Category, index: number): string => {
  const name = (category as Category & { name?: unknown }).name;
  return typeof name === 'string' && name.length > 0
    ? `name:${name}`
    : `index:${index}`;
};

/** Warned-about elements, so an authoring mistake is reported once, not per render. */
const warned = new WeakSet<Categorization>();

/**
 * The index `options.initial` asks for, or `0`.
 *
 * "Missing target falls back to first visible category with diagnostic."
 * The diagnostic is a console warning rather than something rendered: a name
 * that does not match any category is a mistake in the UI schema, which the
 * author can fix and the person filling in the form can do nothing about.
 * That is why the specification's `categorization.initialNotFound` key has no
 * entry in our catalogue - nothing user-facing uses it. See Adjustment 10.
 */
export const resolveInitialIndex = (
  categories: Category[],
  categorization: Categorization
): number => {
  const initial = (
    categorization.options as Record<string, unknown> | undefined
  )?.initial;
  if (typeof initial !== 'string' || initial.length === 0) {
    return 0;
  }
  const found = categories.findIndex(
    (category) => (category as Category & { name?: unknown }).name === initial
  );
  if (found >= 0) {
    return found;
  }
  if (!warned.has(categorization)) {
    warned.add(categorization);
    // eslint-disable-next-line no-console
    console.warn(
      `Categorization: options.initial "${initial}" matches no visible category; opening the first one instead.`
    );
  }
  return 0;
};

/** Nothing open: no visible categories, or the accordion was closed. */
export const NO_CATEGORY = -1;

export interface CategorySelection {
  /** The visible categories, in UI schema order. */
  categories: Category[];
  /** Index into {@link categories}, or {@link NO_CATEGORY}. */
  active: number;
  /** Selects by index into {@link categories}. */
  select: (index: number) => void;
  /**
   * Closes the open category, where the presentation permits it.
   *
   * Ignored unless the caller passed `closable` - a tab strip or a stepper
   * with nothing selected has no meaning. See Adjustment 10.2.
   */
  close: () => void;
}

/**
 * The navigation contract shared by the tabs, stepper and accordion
 * presentations of a Categorization.
 *
 * All three answer the same questions - which categories are visible, which
 * one is current, what happens when the current one disappears - and section 8
 * specifies the answers once, for all of them:
 *
 * - Visibility is the category's own rule. A visible category with no visible
 *   children stays selectable; there is no `hideWhenEmpty`.
 * - "When the selected category becomes hidden, select an available visible
 *   category": the selection is resolved from identity on every render, so a
 *   category that disappears falls back to the initial one rather than leaving
 *   a stale index pointing at a different category's content.
 * - With nothing visible there is "no active category or stale active panel",
 *   which is what {@link NO_CATEGORY} means here.
 *
 * `closable` adds the one place this project **differs** from section 8: an
 * accordion may be closed entirely, so an explicit close is remembered and is
 * not undone by the fallback above. A tab strip and a stepper are not
 * closable - there is no such thing as a tab strip with no current tab - so
 * they leave it off and behave exactly as specified. See Adjustment 10.2.
 *
 * Selection is runtime UI state: it never writes form data or the UI schema.
 */
export const useCategorySelection = (
  categorization: Categorization,
  data: unknown,
  ajv: unknown,
  config: unknown,
  initiallySelected?: number,
  closable = false
): CategorySelection => {
  const categories = useMemo(
    () =>
      (categorization.elements ?? []).filter((category) =>
        isVisible(category, data, undefined, ajv as never, config as never)
      ) as Category[],
    [categorization, data, ajv, config]
  );
  /*
    `undefined` means untouched, so `options.initial` decides. `null` means
    the user closed the accordion, which is a state they chose and which a
    later visibility change must not quietly undo - so it is a third value
    rather than a second meaning for `undefined`.
  */
  const initiallyCollapsed = resolveCollapsed(
    categorization.options,
    config,
    'accordion'
  );
  const [selectedKey, setSelectedKey] = useState<string | null | undefined>(
    () =>
      initiallySelected === undefined
        ? closable && initiallyCollapsed && !categorization.options?.initial
          ? null
          : undefined
        : categoryKey(
            (categorization.elements ?? [])[initiallySelected] as Category,
            initiallySelected
          )
  );

  const previousCollapsed = useRef(initiallyCollapsed);
  useEffect(() => {
    if (previousCollapsed.current !== initiallyCollapsed) {
      previousCollapsed.current = initiallyCollapsed;
      if (closable) setSelectedKey(initiallyCollapsed ? null : undefined);
    }
  }, [initiallyCollapsed, closable]);

  const fromKey =
    typeof selectedKey !== 'string'
      ? NO_CATEGORY
      : categories.findIndex(
          (category, index) => categoryKey(category, index) === selectedKey
        );
  const active =
    categories.length === 0 || selectedKey === null
      ? NO_CATEGORY
      : fromKey >= 0
      ? fromKey
      : resolveInitialIndex(categories, categorization);

  return {
    categories,
    active,
    select: (index: number) => {
      const category = categories[index];
      if (category) {
        setSelectedKey(categoryKey(category, index));
      }
    },
    close: () => {
      if (closable) {
        setSelectedKey(null);
      }
    },
  };
};
