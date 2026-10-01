import { useCollectionDelete } from '@chobantonov/jsonforms-react-renderer-common/useCollectionDelete';
import { DeleteDialog } from './DeleteDialog';
import { PendingChangesProvider } from '@chobantonov/jsonforms-react-renderer-common/pendingChanges';
import { useCollectionPagination } from '@chobantonov/jsonforms-react-renderer-common/collectionPagination';
import { CollectionPager } from './CollectionPager';
import React, { useState } from 'react';
import { Button, Typography, theme as antTheme } from 'antd';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { JsonSchema } from '@jsonforms/core';
import { useI18n } from '../util/translate';
import { TupleDefinition, tupleInitialValue } from '../util/tuple';

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
  /** Renders one trailing position, by index. */
  renderItem: (index: number) => React.ReactNode;
  positionLabel: (index: number) => string;
}

/**
 * The trailing values a tuple permits past its declared positions.
 *
 * Presented as its own section with a heading and an Add button in the header,
 * "consistent with the additional-properties control" as section 18 asks, and
 * each entry gets a positional label and a Delete button. The declared prefix is
 * untouchable from here: Delete refuses any index inside it, so no action in
 * this section can remove or reorder a fixed position.
 */
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
  const { token } = antTheme.useToken();
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
        marginTop: token.margin,
        paddingTop: token.paddingSM,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
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
          gap: token.paddingXS,
          marginBottom: token.paddingXS,
        }}
      >
        <Typography.Text strong>{t('tuple.additionalItems')}</Typography.Text>
        <Button
          size='small'
          type='text'
          icon={<PlusOutlined />}
          disabled={!canAdd}
          onClick={add}
          title={t('tuple.add')}
          aria-label={t('tuple.add')}
          data-tuple-add
        />
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
                gap: token.paddingXS,
                marginBottom: token.paddingXS,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>{renderItem(index)}</div>
              <Button
                size='small'
                type='text'
                danger
                icon={<DeleteOutlined />}
                disabled={!canDelete}
                onClick={() => deletion.request(index)}
                title={t('tuple.delete', { label: positionLabel(index) })}
                aria-label={t('tuple.delete', {
                  label: positionLabel(index),
                })}
                data-tuple-delete={index}
              />
            </div>
          ))}
      </PendingChangesProvider>
      <CollectionPager page={page} />
      {message && (
        <Typography.Text type='warning' role='alert' data-tuple-draft>
          {message}
        </Typography.Text>
      )}
    </section>
  );
};
