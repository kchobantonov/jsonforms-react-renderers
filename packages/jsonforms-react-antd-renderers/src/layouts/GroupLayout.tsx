import { ObjectDetailContext } from '../complex/ObjectDetailContext';
import { ValidationIcon } from '../complex/ValidationIcon';
import { ObjectErrorContext } from '@chobantonov/jsonforms-react-renderer-common/errorSummary';
import React from 'react';
import { Card, Collapse, theme as antTheme } from 'antd';
import {
  GroupLayout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
  withIncreasedRank,
} from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { AntdLayoutRenderer } from '../util/layout';
import { useGroupState } from '../util/groupState';
import { useI18n } from '../util/translate';
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
  const group = useGroupState(props.uischema, props.path, props.config);
  // Default false for a Group: no indicator exists today, so defaulting to
  // true would change every existing form's appearance.
  const validation = useContainerValidation(
    props.uischema,
    props.path,
    props.config,
    false
  );
  const object = React.useContext(ObjectErrorContext);
  const objectOwned = object?.uischema === props.uischema;
  const objectErrors = objectOwned ? object.message : '';
  const objectDetail = React.useContext(ObjectDetailContext);
  const additional = objectDetail?.uischema === props.uischema ? objectDetail.additional : null;
  const layout = props.uischema as GroupLayout;
  if (!props.visible) return null;
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
        {objectOwned ? (objectErrors ? <ValidationIcon local errorMessages={objectErrors} id={`${props.path}-object-errors`} /> : null) : validation.show ? (
          <ContainerValidationIndicator count={validation.count} />
        ) : null}
        {indicator}
      </span>
    ) : undefined;
  const content = (
    <>
    {layout.elements.length > 0 && <AntdLayoutRenderer
      {...props}
      direction='column'
      elements={layout.elements}
    />}
    {additional}
    </>
  );
  const style = { marginBottom: '10px', width: '100%' };

  if (group.collapsible) {
    return (
      <Collapse
        style={style}
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
    );
  }

  return (
    <Card title={props.label || undefined} extra={extra} style={style}>
      {content}
    </Card>
  );
};

export default withJsonFormsLayoutProps(GroupLayoutRenderer);
export const antdGroupTester: RankedTester = withIncreasedRank(1, groupTester);
