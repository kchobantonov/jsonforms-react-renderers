import { Resolve, toDataPathSegments, UISchemaElement } from '@jsonforms/core';
import { JSONFORMS_EXTENDED_CONFIG_KEY } from './configNamespaces';
import { useJsonForms } from '@jsonforms/react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

/** Matches Svelte Group semantics: false and zero count, empty containers do not. */
export const hasGroupValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasGroupValue);
  if (typeof value === 'object')
    return Object.values(value).some(hasGroupValue);
  return true;
};

/** Where one Control below a container is bound. */
export interface BoundPath {
  /** Scope segments, for resolving a value against the container's context. */
  segments: string[];
  /** The same path dotted, to prefix with the container's data path. */
  relative: string;
}

/**
 * Every Control bound below an element, as data paths.
 *
 * This is the traversal both container indicators need, so it is done once and
 * shared rather than once per indicator:
 *
 * - the data-presence indicator resolves `segments` against the container's
 *   data context and asks whether any value is present;
 * - an error indicator prefixes `relative` with the container's data path and
 *   asks whether any of them is in the error index.
 *
 * It depends only on the UI schema, never on the data, so it is computed once
 * per element rather than on every render - splitting each scope string was
 * previously repeated for every Control on every keystroke.
 *
 * Keyed by element identity: a regenerated element simply misses the cache and
 * is recomputed, and entries for discarded elements are collected.
 */
const boundPathsCache = new WeakMap<UISchemaElement, BoundPath[]>();

export const collectBoundPaths = (element: UISchemaElement): BoundPath[] => {
  const cached = boundPathsCache.get(element);
  if (cached) {
    return cached;
  }
  const paths: BoundPath[] = [];
  const walk = (node: UISchemaElement) => {
    const candidate = node as UISchemaElement & {
      scope?: string;
      elements?: UISchemaElement[];
    };
    if (
      (candidate.type === 'Control' || candidate.type === 'ListWithDetail') &&
      typeof candidate.scope === 'string'
    ) {
      const segments = toDataPathSegments(candidate.scope);
      paths.push({ segments, relative: segments.join('.') });
    }
    candidate.elements?.forEach(walk);
  };
  walk(element);
  boundPathsCache.set(element, paths);
  return paths;
};

/**
 * Absolute data paths of everything bound below a container, for looking each
 * one up in the shared error index.
 */
export const boundDataPaths = (element: UISchemaElement, path = ''): string[] =>
  collectBoundPaths(element).map(({ relative }) =>
    [path, relative].filter(Boolean).join('.')
  );

const resolveSegments = (context: unknown, segments: string[]): unknown =>
  segments.reduce<unknown>(
    (current, key) =>
      current !== null && typeof current === 'object'
        ? (current as Record<string, unknown>)[key]
        : undefined,
    context
  );

export const groupHasData = (
  element: UISchemaElement,
  data: unknown,
  path = ''
): boolean => {
  // Resolved once for the whole subtree. It used to be resolved again for
  // every Control, which is the same answer each time.
  const context = path ? Resolve.data(data, path) : data;
  return collectBoundPaths(element).some(({ segments }) =>
    hasGroupValue(resolveSegments(context, segments))
  );
};

export const useGroupState = (
  uischema: UISchemaElement,
  path: string,
  config?: Record<string, unknown>
) => {
  const context = useJsonForms();
  const { collapsible, collapsed, setExpanded } = useGroupExpansion(
    uischema,
    config
  );
  const showDataIndicator =
    groupOption(uischema, config, 'showDataIndicator') === true;
  const data = context.core?.data;
  const contentId = useId();
  // Only re-resolve when the data actually changes. Collapsing a panel, a
  // locale change or any unrelated parent render no longer walks the group.
  const hasData = useMemo(
    () => showDataIndicator && groupHasData(uischema, data, path),
    [showDataIndicator, uischema, data, path]
  );
  return {
    contentId,
    collapsible,
    collapsed: collapsible && collapsed,
    hasData,
    toggle: () => setExpanded(collapsed),
  };
};

/** Element options override namespaced defaults, then legacy flat defaults. */
const groupOption = (
  uischema: UISchemaElement,
  config: Record<string, unknown> | undefined,
  name: string
) => {
  const namespaced = config?.[JSONFORMS_EXTENDED_CONFIG_KEY] as
    | Record<string, unknown>
    | undefined;
  return (
    uischema.options?.[name] ??
    namespaced?.[name] ??
    (name === 'collapsed' ? undefined : config?.[name])
  );
};

/** Shared outer-frame expansion; independent of tree and array-item state. */
export const useGroupExpansion = (
  uischema: UISchemaElement,
  config?: Record<string, unknown>,
  defaultCollapsible = false,
  component: CollapseComponent = 'group'
) => {
  const collapsible =
    (groupOption(uischema, config, 'collapsible') ?? defaultCollapsible) ===
    true;
  const initiallyCollapsed = resolveCollapsed(
    uischema.options,
    config,
    component
  );
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  useEffect(() => setCollapsed(initiallyCollapsed), [initiallyCollapsed]);
  return {
    collapsible,
    collapsed: collapsible && collapsed,
    setExpanded: useCallback(
      (expanded: boolean) => setCollapsed(!expanded),
      []
    ),
  };
};

export type CollapseComponent = 'group' | 'mixed' | 'accordion' | 'array';

/** False overrides true; omitted component settings inherit the shared default. */
export const resolveCollapsed = (
  options: Record<string, any> | undefined,
  config: any,
  component: CollapseComponent
): boolean =>
  (options?.collapsed ??
    config?.jsonformsExtended?.[component]?.collapsed ??
    config?.jsonformsExtended?.collapsed ??
    false) === true;
