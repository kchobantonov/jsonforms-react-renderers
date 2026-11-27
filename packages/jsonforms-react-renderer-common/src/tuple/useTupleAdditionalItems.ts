import type { JsonSchema } from '@jsonforms/core';
import { useState, type ReactNode } from 'react';
import { useCollectionDelete } from '../collections/useCollectionDelete';
import { useCollectionPagination } from '../collections/collectionPagination';
import { useI18n } from '../locale/translate';
import { tupleInitialValue, type TupleDefinition } from './tupleSchema';

export interface TupleAdditionalItemsInput {
  definition: TupleDefinition;
  data: unknown[];
  schema: JsonSchema;
  rootSchema: JsonSchema;
  options: Record<string, any>;
  config?: any;
  path?: string;
  enabled: boolean;
  onChange: (next: unknown[]) => void;
}

export interface TupleAdditionalItemsProps extends TupleAdditionalItemsInput {
  renderItem: (index: number) => ReactNode;
  positionLabel: (index: number) => string;
}

/** Shared tuple-tail operations; each renderer owns its presentation. */
export const useTupleAdditionalItems = ({
  definition,
  data,
  schema,
  rootSchema,
  options,
  config,
  path,
  enabled,
  onChange,
}: TupleAdditionalItemsInput) => {
  const t = useI18n();
  const [message, setMessage] = useState<string | undefined>();

  // Restrict prevents an edit at the bounds; otherwise validation reports it.
  const restricted = options.restrict !== false;
  const { maxItems, minItems } = schema;

  const canAdd =
    enabled &&
    !options.disableAdd &&
    definition.tail !== false &&
    (!restricted ||
      maxItems === undefined ||
      Math.max(data.length, definition.prefix.length) < maxItems);

  const canDelete =
    enabled &&
    !options.disableRemove &&
    (!restricted || minItems === undefined || data.length > minItems);

  const add = () => {
    const next = [...data];
    // Fill any missing declared positions before appending the tail.
    for (
      let position = next.length;
      position < definition.prefix.length;
      position += 1
    ) {
      const initial = tupleInitialValue(
        definition.prefix[position],
        rootSchema,
      );
      if (initial === undefined) {
        setMessage(t('tuple.missingPosition', { position: position + 1 }));
        return;
      }
      next.push(initial);
    }
    const { tail } = definition;
    const unconstrained =
      tail === true ||
      (typeof tail === 'object' && Object.keys(tail).length === 0);
    const initial = tupleInitialValue(tail, rootSchema);
    if (initial === undefined && !unconstrained) {
      setMessage(t('tuple.initialType'));
      return;
    }
    // The mixed renderer can choose a type after an unconstrained tail starts.
    next.push(initial === undefined ? '' : initial);
    setMessage(undefined);
    onChange(next);
  };

  const deletion = useCollectionDelete<number>({
    data,
    identity: path,
    catalogId: 'additionalItems',
    options,
    config,
    canRemove: (index) =>
      canDelete && index >= definition.prefix.length && index < data.length,
    value: (index) => data[index],
    remove: (index) =>
      onChange(data.filter((_, position) => position !== index)),
  });

  const trailing: number[] = [];
  for (
    let index = definition.prefix.length;
    index < Math.max(data.length, definition.prefix.length);
    index += 1
  ) {
    trailing.push(index);
  }

  const page = useCollectionPagination(
    trailing,
    options.additionalItems?.pagination,
    config,
    'additionalItems',
  );

  const visibleIndices = page.indices.map((offset) => trailing[offset]);
  return {
    visibleIndices,
    t,
    message,
    canAdd,
    canDelete,
    add,
    deletion,
    trailing,
    page,
  };
};
