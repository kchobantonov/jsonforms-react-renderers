import { isMixedSchema } from '@chobantonov/jsonforms-react-renderer-common/mixed';
import { CellSummary } from '@chobantonov/jsonforms-react-renderer-common/CellSummary';
import {
  usePathErrorMessages,
  labelDetailErrorPaths,
} from '@chobantonov/jsonforms-react-renderer-common/errorSummary';
import { ValidationIcon } from '../complex/ValidationIcon';
import React, { useState, useRef } from 'react';
import { Button, theme } from 'antd';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import {
  CellProps,
  Translator,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  RankedTester,
  UISchemaElement,
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
import { compositeSummaryPresentation } from '@chobantonov/jsonforms-react-renderer-common/compositeSummary';
import {
  CompositeDetailDialog,
  CompositeDetailDialogOptions,
} from './CompositeDetailDialog';

export const AntdCompositeCell = (props: CompositeCellProps) => {
  const { t } = props;
  const { token } = theme.useToken();
  const errors = usePathErrorMessages(
    props.path,
    labelDetailErrorPaths(props.path, props.uischema.options)
  );
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
    summary?: UISchemaElement;
    detail?: UISchemaElement;
    clearable?: boolean;
    summaryOnly?: boolean;
    showTypeIndicator?: boolean;
  };
  const summary = compositeSummaryPresentation(
    props.data,
    options.summary?.type === 'Control' ? (options.summary as any) : undefined,
    props.schema?.title,
    t,
    d,
    props.schema
  );
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
    props.enabled &&
    !options.summaryOnly &&
    (options.summary?.type !== 'Label' || !!options.detail) &&
    props.data !== undefined &&
    options.clearable !== false;
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      {(options.showTypeIndicator ??
        props.config?.showTypeIndicator ??
        false) === true &&
        (isArray || props.schema?.type === 'object') && (
          <span
            aria-hidden='true'
            style={{ flex: 'none', opacity: 0.55, lineHeight: 0 }}
          >
            {isArray ? '[]' : '{}'}
          </span>
        )}
      {/* one line: the row height must not grow with the content */}
      <span
        style={{
          color:
            summary.generated && options.summary?.type !== 'Label'
              ? token.colorTextSecondary
              : undefined,
          fontStyle:
            summary.generated && options.summary?.type !== 'Label'
              ? 'italic'
              : undefined,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {options.summary?.type === 'Label' ? (
          <CellSummary
            schema={props.schema}
            path={props.path}
            uischema={options.summary}
          />
        ) : (
          summary.text
        )}
      </span>
      <ValidationIcon
        errorMessages={errors}
        path={props.path}
        id={`${props.path}-cell-errors`}
      />
      {/* opacity rather than mounting: keeps the row from reflowing on hover */}
      {((!options.summaryOnly && options.summary?.type !== 'Label') ||
        options.detail) && (
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
                  catalogId: 'compositeCell',
                  operation: 'delete',
                  options,
                  config: props.config,
                  discarded: [target],
                  perform: () => {
                    const current = latest.current;
                    if (
                      current.enabled &&
                      current.path === path &&
                      current.data === target &&
                      current.uischema.options?.clearable !== false
                    )
                      current.handleChange(path, undefined);
                  },
                });
              }}
              title={translateWithLabel('composite.remove')}
              aria-label={translateWithLabel('composite.remove')}
            />
          )}
        </span>
      )}
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
 * Structured, mixed and composed values. A catch-all would tie with scalar cells (also
 * rank 1) and win on registration order, swallowing every string column.
 */
export const antdCompositeCellTester: RankedTester = (_ui, schema, context) =>
  _ui.options?.summary?.type === 'Label'
    ? 6
    : schema?.type === 'object' ||
      schema?.type === 'array' ||
      Boolean(
        schema?.anyOf?.length || schema?.oneOf?.length || schema?.allOf?.length
      ) ||
      isMixedSchema({ ..._ui, scope: '#' }, schema, context)
    ? 1
    : -1;

export default withJsonFormsCellProps(
  withTranslateProps(AntdCompositeCell) as any
);
