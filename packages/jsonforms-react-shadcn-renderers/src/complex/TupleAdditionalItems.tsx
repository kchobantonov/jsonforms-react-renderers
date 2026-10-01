import { useCollectionDelete } from '@chobantonov/jsonforms-react-renderer-common/useCollectionDelete';
import { DeleteDialog } from './DeleteDialog';
import { PendingChangesProvider } from '@chobantonov/jsonforms-react-renderer-common/pendingChanges';
import { useCollectionPagination } from '@chobantonov/jsonforms-react-renderer-common/collectionPagination';
import { CollectionPager } from './CollectionPager';
import React, { useState } from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Trash2, Plus } from 'lucide-react';

import { JsonSchema } from '@jsonforms/core';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import {
  TupleDefinition,
  tupleInitialValue,
} from '@chobantonov/jsonforms-react-renderer-common/tuple';

export interface TupleAdditionalItemsProps {
  definition: TupleDefinition;
  data: unknown[];
  schema: JsonSchema;
  rootSchema: JsonSchema;
  options: Record<string, any>;
  config?: any;
  path?: string;
  enabled: boolean;
  onChange: (next: unknown[]) => void;

  renderItem: (index: number) => React.ReactNode;
  positionLabel: (index: number) => string;
}

export const TupleAdditionalItems = ({
  definition,
  data,
  schema,
  rootSchema,
  options,
  config,
  path,
  enabled,
  onChange,
  renderItem,
  positionLabel,
}: TupleAdditionalItemsProps) => {
  const t = useI18n();
  const [message, setMessage] = useState<string | undefined>();

  // `restrict` decides whether bounds *prevent* an edit or merely produce a
  // validation error afterwards. Enabled unless explicitly switched off, as
  // everywhere else in this renderer set.
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
    // Adding past the end of a short array fills the declared prefix first, for
    // the same reason an edit does: the array must not gain a hole.
    for (
      let position = next.length;
      position < definition.prefix.length;
      position += 1
    ) {
      const initial = tupleInitialValue(
        definition.prefix[position],
        rootSchema
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
    // An unconstrained tail starts as an empty string; the mixed renderer the
    // position delegates to is what lets its type be changed from there.
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
    'additionalItems'
  );

  return (
    <section
      data-tuple-additional
      style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: `1px solid ${'var(--border)'}`,
      }}
    >
      <DeleteDialog
        open={deletion.confirming}
        onCancel={deletion.cancel}
        onConfirm={deletion.confirm}
      />
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <strong>{t('tuple.additionalItems')}</strong>
        <Button
          size='icon-sm'
          type='button'
          variant='ghost'
          disabled={!canAdd}
          onClick={add}
          title={t('tuple.add')}
          aria-label={t('tuple.add')}
          data-tuple-add
        >
          <Plus className='h-4 w-4' />
        </Button>
      </header>
      <PendingChangesProvider changes={page.pending}>
        {page.indices
          .map((offset) => trailing[offset])
          .map((index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>{renderItem(index)}</div>
              <Button
                size='icon-sm'
                type='button'
                variant='ghost'
                className='text-destructive'
                disabled={!canDelete}
                onClick={() => deletion.request(index)}
                title={t('tuple.delete', { label: positionLabel(index) })}
                aria-label={t('tuple.delete', {
                  label: positionLabel(index),
                })}
                data-tuple-delete={index}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          ))}
      </PendingChangesProvider>
      <CollectionPager page={page} />
      {message && (
        <span className='text-destructive' role='alert' data-tuple-draft>
          {message}
        </span>
      )}
    </section>
  );
};
