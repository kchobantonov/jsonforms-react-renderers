import { ObjectDetailContext } from '../complex/ObjectDetailContext';
import { ValidationIcon } from '../complex/ValidationIcon';
import { ObjectErrorContext } from '@chobantonov/jsonforms-react-renderer-common/errorSummary';
import { useDynamicTreeResolver } from '@chobantonov/jsonforms-react-renderer-common/DynamicUiProvider';
import React from 'react';
import { Card, Collapse, theme as antTheme } from 'antd';
import {
  GroupLayout,
  LayoutProps,
  RankedTester,
  UISchemaElement,
  rankWith,
  uiTypeIs,
  withIncreasedRank,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps } from '@jsonforms/react';
import { AntdLayoutRenderer } from '../util/layout';
import { useGroupState } from '../util/groupState';
import { useI18n, useTranslator } from '../util/translate';
import { useContainerValidation } from '../util/validationIndicator';
import { ContainerIndicator, DataDotIcon } from './ContainerIndicator';
import { ContainerValidationIndicator } from './ValidationIndicator';

export const groupTester: RankedTester = rankWith(1, uiTypeIs('Group'));

export const GroupLayoutRenderer = (props: LayoutProps) => {
  /*
    `useI18n`, not the raw translator from context.

    It used to call `translate?.(key, i18nDefaults[key])`, which supplies the
    **English** string as the default message - and the default message is
    exactly where the locale bundle is delivered (§6.5). So the indicator
    stayed English in every language whose catalog did not happen to define
    `group.dataIndicator`, which is the usual case: a form's catalog is
    written for its own labels.
  */
  const { token } = antTheme.useToken();
  const t = useI18n();
  const translate = useTranslator();
  const group = useGroupState(props.uischema, props.path, props.config);
  // Default false for a Group: no indicator exists today, so defaulting to
  // true would change every existing form's appearance.
  const validation = useContainerValidation(
    props.uischema,
    props.path,
    props.config,
    false,
  );
  const object = React.useContext(ObjectErrorContext);
  const objectOwned = object?.uischema === props.uischema;
  const objectErrors = objectOwned ? object.message : '';
  const objectDetail = React.useContext(ObjectDetailContext);
  const additional =
    objectDetail?.uischema === props.uischema ? objectDetail.additional : null;
  const layout = props.uischema as GroupLayout;
  const regions = layout as GroupLayout & {
    cover?: UISchemaElement;
    header?: UISchemaElement[];
    footer?: UISchemaElement[];
  };
  const resolveHeader = useDynamicTreeResolver(props.path);
  if (!props.visible) return null;
  const renderRegion = (element: UISchemaElement, key: string) => (
    <JsonFormsDispatch
      key={key}
      schema={props.schema}
      uischema={element}
      path={props.path}
      enabled={props.enabled}
      renderers={props.renderers}
      cells={props.cells}
    />
  );
  const cover = regions.cover ? (
    <div data-group-cover>{renderRegion(regions.cover, 'cover')}</div>
  ) : null;
  const headerContent = regions.header?.map((element, index) =>
    renderRegion(element, `header-${index}`),
  );
  const footer = regions.footer?.map((element, index) =>
    renderRegion(element, `footer-${index}`),
  );
  const headerLabel = regions.header
    ?.map(resolveHeader)
    .find((element) => element.type === 'Label') as
    | { text?: string; i18n?: string }
    | undefined;
  const headerTitle = headerLabel?.i18n
    ? translate(`${headerLabel.i18n}.text`, headerLabel.text || '')
    : headerLabel?.text;
  // One string for the tooltip and the accessible name, so the two cannot
  // drift apart.
  const indicatorLabel = t('group.dataIndicator');
  const indicator = group.hasData ? (
    <ContainerIndicator
      label={indicatorLabel}
      color={token.colorTextTertiary}
      marker={{ 'data-group-indicator': true }}
    >
      <DataDotIcon />
    </ContainerIndicator>
  ) : undefined;
  // Two different signals, deliberately side by side: the dot says data is
  // present, the error marker says something below needs fixing.
  const extra =
    (objectOwned ? Boolean(objectErrors) : validation.show) || indicator ? (
      // One flex row so the two markers share a centre line and a gap,
      // whichever of them is present.
      <span
        data-group-indicators
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: token.marginXS,
          // The row must not add leading of its own either, or the header
          // grows by the difference between its line box and the icons'.
          lineHeight: 0,
        }}
      >
        {objectOwned ? (
          objectErrors ? (
            <ValidationIcon
              local
              errorMessages={objectErrors}
              id={`${props.path}-object-errors`}
            />
          ) : null
        ) : validation.show ? (
          <ContainerValidationIndicator count={validation.count} />
        ) : null}
        {indicator}
      </span>
    ) : undefined;
  const content = (
    <>
      {layout.elements.length > 0 && (
        <AntdLayoutRenderer
          {...props}
          direction='column'
          elements={layout.elements}
        />
      )}
      {additional}
    </>
  );
  const style = { marginBottom: '10px', width: '100%' };

  if (!regions.cover && !regions.header?.length && !footer?.length) {
    if (group.collapsible) {
      return (
        <section
          role='group'
          aria-label={props.label || undefined}
          style={style}
        >
          <Collapse
            activeKey={group.collapsed ? [] : ['group']}
            onChange={(keys) => {
              if (keys.includes('group') === group.collapsed) group.toggle();
            }}
            destroyOnHidden={false}
            items={[
              {
                key: 'group',
                label: props.label || 'Group',
                extra,
                forceRender: true,
                children: content,
              },
            ]}
          />
        </section>
      );
    }
    return (
      <Card
        title={props.label || undefined}
        extra={extra}
        style={style}
        role='group'
        aria-label={props.label || undefined}
      >
        {content}
      </Card>
    );
  }

  const card = (
    <Card
      data-group-frame
      cover={cover}
      actions={
        footer?.length && !group.collapsible
          ? [
              <div
                key='footer'
                data-group-footer
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: token.marginXS,
                  paddingInline: token.padding,
                }}
              >
                {footer}
              </div>,
            ]
          : undefined
      }
      style={style}
      role='group'
      aria-label={headerTitle || props.label || undefined}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: token.marginXS,
          marginBottom: group.collapsed ? 0 : token.margin,
        }}
      >
        <div data-group-header style={{ minWidth: 0 }}>
          <Card.Meta
            title={headerContent?.[0] ?? props.label ?? undefined}
            description={
              headerContent?.length ? headerContent.slice(1) : undefined
            }
          />
        </div>
        {(group.collapsible || extra) && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0,
              gap: token.marginXS,
            }}
          >
            {extra}
            {group.collapsible && (
              <button
                type='button'
                aria-label={headerTitle || props.label || 'Group'}
                aria-expanded={!group.collapsed}
                aria-controls={group.contentId}
                onClick={group.toggle}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 0,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: token.paddingXS,
                }}
              >
                <svg
                  aria-hidden='true'
                  width='14'
                  height='14'
                  viewBox='0 0 14 14'
                >
                  <path
                    d='m5 3 4 4-4 4'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    transform={group.collapsed ? undefined : 'rotate(90 7 7)'}
                  />
                </svg>
              </button>
            )}
          </span>
        )}
      </div>
      {group.collapsible ? (
        <div
          id={group.contentId}
          data-group-body
          style={{ display: group.collapsed ? 'none' : undefined }}
        >
          {content}
          {footer?.length ? (
            <footer
              data-group-footer
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: token.marginXS,
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                paddingTop: token.padding,
                marginTop: token.margin,
              }}
            >
              {footer}
            </footer>
          ) : null}
        </div>
      ) : (
        content
      )}
    </Card>
  );

  return card;
};

export default withJsonFormsLayoutProps(GroupLayoutRenderer);
export const antdGroupTester: RankedTester = withIncreasedRank(1, groupTester);
