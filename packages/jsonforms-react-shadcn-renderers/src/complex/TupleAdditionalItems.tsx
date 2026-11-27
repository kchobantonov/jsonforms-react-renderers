import {
  useTupleAdditionalItems,
  type TupleAdditionalItemsProps,
} from '@chobantonov/jsonforms-react-renderer-common/tuple/useTupleAdditionalItems';
import { DeleteDialog } from './DeleteDialog';
import { PendingChangesProvider } from '@chobantonov/jsonforms-react-renderer-common/interaction/pendingChanges';
import { CollectionPager } from './CollectionPager';
import React from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Trash2, Plus } from 'lucide-react';

export type { TupleAdditionalItemsProps } from '@chobantonov/jsonforms-react-renderer-common/tuple/useTupleAdditionalItems';

export const TupleAdditionalItems = (props: TupleAdditionalItemsProps) => {
  const { renderItem, positionLabel } = props;
  const { t, message, canAdd, canDelete, add, deletion, visibleIndices, page } =
    useTupleAdditionalItems(props);

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
        {visibleIndices.map((index) => (
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
