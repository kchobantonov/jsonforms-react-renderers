import React, { useState, useRef } from 'react';
import { Button } from 'antd';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import UnorderedListOutlined from '@ant-design/icons/UnorderedListOutlined';
import {
  CellProps,
  Translator,
  ControlElement,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  RankedTester,
  UISchemaElement,
  rankWith,
} from '@jsonforms/core';

/** DispatchCell forwards these, but they are not part of CellProps. */
type CompositeCellProps = CellProps & {
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  /** Supplied by withTranslateProps; every visible string goes through it. */
  t: Translator;
};
import {
  JsonFormsDispatch,
  withJsonFormsCellProps,
  withTranslateProps,
} from '@jsonforms/react';
import { useConfirmation } from '../util/useConfirmation';
import { useI18nDefault } from '../util/translate';
import { compositeSummary } from '../util/compositeSummary';
import {
  CompositeDetailDialog,
  CompositeDetailDialogOptions,
} from './CompositeDetailDialog';

export const AntdCompositeCell = (props: CompositeCellProps) => {
  const { t } = props;
  /*
    The default message carries the locale bundle (§6.5), so it must not be
    read straight out of the English table.
  */
  const d = useI18nDefault();
  const confirmation = useConfirmation();
  const latest = useRef(props);
  latest.current = props;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const options = (props.uischema?.options ??
    {}) as CompositeDetailDialogOptions & {
    summary?: ControlElement;
    detail?: UISchemaElement;
    clearable?: boolean;
  };
  const isArray = Array.isArray(props.data) || props.schema?.type === 'array';
  const label =
    props.schema?.title ??
    (isArray
      ? t('composite.itemsLabel', d('composite.itemsLabel'))
      : t('composite.detailsLabel', d('composite.detailsLabel')));
  const translateWithLabel = (key: 'composite.edit' | 'composite.remove') =>
    t(key, d(key), { label }).replace('{label}', label);
  const detail: UISchemaElement =
    options.detail ?? ({ type: 'Control', scope: '#', label: false } as any);
  // Cell removal shares the destructive-change policy.
  const canClear =
    props.enabled && props.data !== undefined && options.clearable !== false;
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <span
        aria-hidden='true'
        style={{ flex: 'none', opacity: 0.55, lineHeight: 0 }}
      >
        {isArray ? <UnorderedListOutlined /> : <span>{'{}'}</span>}
      </span>
      {/* one line: the row height must not grow with the content */}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {compositeSummary(
          props.data,
          options.summary,
          props.schema?.title,
          t,
          d
        )}
      </span>
      {/* opacity rather than mounting: keeps the row from reflowing on hover */}
      <span
        style={{
          display: 'flex',
          gap: 2,
          flex: 'none',
          opacity: active || open ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        <Button
          size='small'
          type='text'
          icon={<EditOutlined />}
          onClick={() => setOpen(true)}
          title={translateWithLabel('composite.edit')}
          aria-label={translateWithLabel('composite.edit')}
        />
        {canClear && (
          <Button
            size='small'
            type='text'
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              const target = props.data;
              const path = props.path;
              confirmation.request({
                catalogId: 'compositeCell', operation: 'delete',
                options, config: props.config, discarded: [target],
                perform: () => {
                  const current = latest.current;
                  if (current.enabled && current.path === path && current.data === target && current.uischema.options?.clearable !== false)
                    current.handleChange(path, undefined);
                },
              });
            }}
            title={translateWithLabel('composite.remove')}
            aria-label={translateWithLabel('composite.remove')}
          />
        )}
      </span>
      {confirmation.dialog}
      <CompositeDetailDialog
        open={open}
        title={
          props.schema?.title ??
          t('composite.detailsTitle', d('composite.detailsTitle'))
        }
        label={label}
        path={props.path}
        schema={props.schema}
        enabled={Boolean(props.enabled)}
        options={options}
        t={t}
        onClose={() => setOpen(false)}
        onApply={(value) => props.handleChange(props.path, value)}
      >
        <JsonFormsDispatch
          schema={props.schema}
          uischema={detail}
          path={props.path}
          enabled={props.enabled}
          renderers={props.renderers}
          cells={props.cells}
        />
      </CompositeDetailDialog>
    </div>
  );
};

/**
 * Objects and arrays only. A catch-all would tie with the scalar cells (also
 * rank 1) and win on registration order, swallowing every string column.
 */
export const antdCompositeCellTester: RankedTester = rankWith(
  1,
  (_uischema, schema) => schema?.type === 'object' || schema?.type === 'array'
);

export default withJsonFormsCellProps(
  withTranslateProps(AntdCompositeCell) as any
);
