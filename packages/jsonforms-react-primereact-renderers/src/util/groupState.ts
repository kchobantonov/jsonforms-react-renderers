import { Resolve, toDataPathSegments, UISchemaElement } from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import { useEffect, useId, useState } from 'react';

/** Matches Svelte Group semantics: false and zero count, empty containers do not. */
export const hasGroupValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasGroupValue);
  if (typeof value === 'object')
    return Object.values(value).some(hasGroupValue);
  return true;
};

export const groupHasData = (
  element: UISchemaElement,
  data: unknown,
  path = ''
): boolean => {
  const node = element as UISchemaElement & {
    scope?: string;
    elements?: UISchemaElement[];
  };
  if (node.type === 'Control' && typeof node.scope === 'string') {
    const context = path ? Resolve.data(data, path) : data;
    const value = toDataPathSegments(node.scope).reduce<unknown>(
      (current, key) =>
        current !== null && typeof current === 'object'
          ? (current as Record<string, unknown>)[key]
          : undefined,
      context
    );
    if (hasGroupValue(value)) return true;
  }
  return (
    node.elements?.some((child) => groupHasData(child, data, path)) ?? false
  );
};

export const useGroupState = (
  uischema: UISchemaElement,
  path: string,
  config?: Record<string, unknown>
) => {
  const context = useJsonForms();
  const option = (name: string) =>
    uischema.options?.[name] !== undefined
      ? uischema.options[name]
      : config?.[name];
  const collapsible = option('collapsible') === true;
  const initiallyCollapsed = option('collapsed') === true;
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const contentId = useId();
  useEffect(() => setCollapsed(initiallyCollapsed), [initiallyCollapsed]);
  return {
    contentId,
    collapsible,
    collapsed: collapsible && collapsed,
    hasData:
      option('showDataIndicator') === true &&
      groupHasData(uischema, context.core?.data, path),
    toggle: () => setCollapsed((value) => !value),
  };
};
