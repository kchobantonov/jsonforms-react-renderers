import { Category, UISchemaElement } from '@jsonforms/core';
import { theme as antTheme } from 'antd';
import React from 'react';
import { useGroupState } from '../util/groupState';
import { useI18n } from '../util/translate';
import { useContainerValidation } from '../util/validationIndicator';
import { ContainerIndicator, DataDotIcon } from './ContainerIndicator';
import { ContainerValidationIndicator } from './ValidationIndicator';

export interface CategoryHeaderProps {
  category: Category;
  label: string;
  path: string;
  config?: Record<string, unknown>;
}

export type CategoryIndicatorsProps = Omit<CategoryHeaderProps, 'label'>;

/**
 * The container markers for a Category: an error marker, and the dot that says
 * the section holds data.
 *
 * A Category has no data scope - the same reason it needs an explicit `i18n`
 * prefix - so both are aggregated from the Controls bound below it, through
 * the one traversal shared with the Group's indicators.
 *
 * Rendered on its own rather than baked into the label, because where they
 * belong depends on the shape of the header rather than on the presentation:
 * see {@link CategoryHeader}. Returns `null` when there is nothing to show, so
 * a caller can hand it straight to an `extra` slot.
 *
 * Both default to off: no indicator existed on categories before, and
 * defaulting to on would change every existing form.
 */
export const CategoryIndicators = ({
  category,
  path,
  config,
}: CategoryIndicatorsProps) => {
  const { token } = antTheme.useToken();
  // See GroupLayout: the default message is where the locale bundle arrives.
  const t = useI18n();
  const validation = useContainerValidation(
    category as UISchemaElement,
    path,
    config,
    false
  );
  const group = useGroupState(category as UISchemaElement, path, config);

  if (!validation.show && !group.hasData) {
    return null;
  }

  const indicatorLabel = t('group.dataIndicator');

  return (
    <span
      data-category-indicators
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: token.marginXS,
        // No leading of its own, or a header grows by the difference between
        // its line box and the icons'.
        lineHeight: 0,
      }}
    >
      {validation.show ? (
        <ContainerValidationIndicator count={validation.count} />
      ) : null}
      {group.hasData ? (
        <ContainerIndicator
          label={indicatorLabel}
          color={token.colorTextTertiary}
          marker={{ 'data-category-data-indicator': true }}
        >
          <DataDotIcon />
        </ContainerIndicator>
      ) : null}
    </span>
  );
};

/**
 * A category's **tab or step** label, with the indicators after it.
 *
 * A tab and a step label are just text: they are sized to their content and
 * have no trailing edge, so the markers can only follow the words.
 *
 * An accordion header is a different shape - a full-width bar, like a Group's -
 * and there the markers go at the end of the bar instead, through antd's
 * `extra` slot, so that two collapsible sections in one form do not put their
 * status in two different places. That is why this component is not used by
 * the accordion; it renders {@link CategoryIndicators} directly.
 */
export const CategoryHeader = ({
  category,
  label,
  path,
  config,
}: CategoryHeaderProps) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
    {label}
    <CategoryIndicators category={category} path={path} config={config} />
  </span>
);
