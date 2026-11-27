import React from 'react';
import { useDynamicTreeResolver } from '../dynamic/DynamicUiProvider';
import { useI18n } from '../locale/translate';
import {
  isComplexTupleSchema,
  resolveTupleSchema,
  tupleDefinition,
  tupleRenderSchema,
  type TupleSchema,
} from './tupleSchema';
import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  type UISchemaElement,
  type StatePropsOfControlWithDetail,
  findUISchema,
  getControlPath,
} from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';

const POSITION_SCOPE = /\/(?:items|prefixItems)\/(\d+)(\/.*)?$/;

interface TuplePositionContextValue {
  count: number;
  render: (index: number) => React.ReactElement | null;
  renderWithin: (index: number, scope: string) => React.ReactElement | null;
}

/** A module-level renderer keeps focused position controls mounted on re-render. */
export const TuplePositionContext = React.createContext<
  TuplePositionContextValue | undefined
>(undefined);

const TuplePositionRenderer = ({ uischema }: { uischema: UISchemaElement }) => {
  const ctx = React.useContext(TuplePositionContext);
  const scope = (uischema as ControlElement)?.scope;
  const match = typeof scope === 'string' ? POSITION_SCOPE.exec(scope) : null;
  if (!ctx || !match) return null;
  const index = Number(match[1]);
  if (index < 0 || index >= ctx.count) return null;
  return match[2] ? ctx.renderWithin(index, `#${match[2]}`) : ctx.render(index);
};

export const tuplePositionEntry: JsonFormsRendererRegistryEntry = {
  tester: (uischema) => {
    const scope = (uischema as ControlElement)?.scope;
    return uischema?.type === 'Control' &&
      typeof scope === 'string' &&
      POSITION_SCOPE.test(scope)
      ? 9999
      : -1;
  },
  renderer: TuplePositionRenderer as any,
};

const namedPositions = (element: unknown, found = new Set<number>()) => {
  if (!element || typeof element !== 'object') return found;
  const node = element as UISchemaElement & {
    scope?: string;
    elements?: unknown[];
  };
  const match =
    typeof node.scope === 'string' ? POSITION_SCOPE.exec(node.scope) : null;
  if (match) found.add(Number(match[1]));
  if (Array.isArray(node.elements))
    for (const child of node.elements) namedPositions(child, found);
  return found;
};

const positionLayoutOf = (
  options: Record<string, any>,
): UISchemaElement | undefined => {
  const layout = options.detail;
  return layout &&
    typeof layout === 'object' &&
    typeof (layout as UISchemaElement).type === 'string'
    ? (layout as UISchemaElement)
    : undefined;
};

/** Resolve positional schemas and registry entries without any UI toolkit dependency. */
export const useTupleControl = (props: StatePropsOfControlWithDetail) => {
  const {
    data,
    enabled,
    errors,
    path,
    rootSchema,
    schema,
    uischema,
    uischemas,
  } = props;
  const resolveTree = useDynamicTreeResolver(path);
  const t = useI18n();
  const jsonforms = useJsonForms();
  const options = { ...props.config, ...uischema.options } as Record<
    string,
    any
  >;
  const vertical =
    (uischema.options?.vertical ??
      props.config?.jsonformsExtended?.tuple?.vertical ??
      false) === true;
  const definition = tupleDefinition(schema, options.variant === 'tuple');
  const values: unknown[] = Array.isArray(data) ? data : [];
  const editable = enabled !== false;
  const positionLabel = (index: number) =>
    t('tuple.position', { position: index + 1 });
  const fieldSchema = (index: number): TupleSchema => {
    if (!definition) return true;
    const declared = definition.prefix[index];
    const fallback = definition.tail === false ? true : definition.tail;
    return resolveTupleSchema(declared ?? fallback, rootSchema);
  };
  const positionName = (index: number) =>
    tupleRenderSchema(fieldSchema(index)).title ?? positionLabel(index);
  const fieldUiSchema = (index: number): UISchemaElement => {
    const positionSchema = tupleRenderSchema(fieldSchema(index));
    const name = positionName(index);
    if (!isComplexTupleSchema(fieldSchema(index)))
      return { type: 'Control', scope: '#', label: name } as ControlElement;
    const found = findUISchema(
      // A host registry can contain serialized entries without callable testers.
      (uischemas ?? []).filter((entry) => typeof entry?.tester === 'function'),
      positionSchema,
      '#',
      `${path}.${index}`,
      () => ({ type: 'Control', scope: '#', label: name }) as ControlElement,
      { type: 'Control', scope: '#' } as ControlElement,
      rootSchema,
    );
    return {
      ...found,
      label: (found as { label?: unknown }).label ?? name,
    } as UISchemaElement;
  };
  const authoredPositionLayout = positionLayoutOf(options);
  const positionLayout = authoredPositionLayout
    ? resolveTree(authoredPositionLayout)
    : undefined;
  const hiddenPositionErrors = (): string[] => {
    if (!positionLayout || !definition) return [];
    const named = namedPositions(positionLayout);
    const messages: string[] = [];
    definition.prefix.forEach((_, index) => {
      if (named.has(index)) return;
      const target = `${path}.${index}`;
      const own = (jsonforms.core?.errors ?? []).filter((error) => {
        const at = getControlPath(error);
        return at === target || at.startsWith(`${target}.`);
      });
      for (const error of own)
        messages.push(`${positionName(index)}: ${error.message}`);
    });
    return messages;
  };
  const shownErrors = [errors, ...hiddenPositionErrors()]
    .filter(Boolean)
    .join('\n');
  return {
    t,
    options,
    vertical,
    definition,
    values,
    editable,
    positionLabel,
    fieldSchema,
    fieldUiSchema,
    positionLayout,
    shownErrors,
  };
};
