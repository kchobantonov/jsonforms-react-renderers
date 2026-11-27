import {
  useTupleAdditionalItems,
  type TupleAdditionalItemsProps,
} from '@chobantonov/jsonforms-react-renderer-common/tuple/useTupleAdditionalItems';
import { DeleteDialog } from './DeleteDialog';
import { PendingChangesProvider } from '@chobantonov/jsonforms-react-renderer-common/interaction/pendingChanges';
import { CollectionPager } from './CollectionPager';
import React from 'react';
import { Button, Typography, theme as antTheme } from 'antd';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
export type { TupleAdditionalItemsProps } from '@chobantonov/jsonforms-react-renderer-common/tuple/useTupleAdditionalItems';

/**
 * The trailing values a tuple permits past its declared positions.
 *
 * Presented as its own section with a heading and an Add button in the header,
 * "consistent with the additional-properties control" as section 18 asks, and
 * each entry gets a positional label and a Delete button. The declared prefix is
 * untouchable from here: Delete refuses any index inside it, so no action in
 * this section can remove or reorder a fixed position.
 */
export const TupleAdditionalItems = (props: TupleAdditionalItemsProps) => {
  const { renderItem, positionLabel } = props;
  const { token } = antTheme.useToken();
  const { t, message, canAdd, canDelete, add, deletion, visibleIndices, page } =
    useTupleAdditionalItems(props);

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
        {visibleIndices.map((index) => (
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
