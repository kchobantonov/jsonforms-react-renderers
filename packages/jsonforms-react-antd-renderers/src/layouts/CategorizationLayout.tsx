import React, { useMemo } from 'react';
import {
  and,
  Categorization,
  Category,
  deriveLabelForUISchemaElement,
  RankedTester,
  rankWith,
  StatePropsOfLayout,
  Tester,
  UISchemaElement,
  uiTypeIs,
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import { CategoryHeader } from './CategoryHeader';
import { useCategorySelection } from '../util/categoryState';
import {
  AjvProps,
  AntdLayoutRenderer,
  AntdLayoutRendererProps,
  withAjvProps,
} from '../util/layout';
import { Tabs } from 'antd';

export const isSingleLevelCategorization: Tester = and(
  uiTypeIs('Categorization'),
  (uischema: UISchemaElement): boolean => {
    const categorization = uischema as Categorization;

    return (
      categorization.elements &&
      categorization.elements.reduce(
        (acc, e) => acc && e.type === 'Category',
        true
      )
    );
  }
);

export const categorizationTester: RankedTester = rankWith(
  1,
  isSingleLevelCategorization
);
export interface CategorizationState {
  activeCategory: number;
}

export interface CategorizationLayoutRendererProps
  extends StatePropsOfLayout,
    AjvProps,
    TranslateProps {
  selected?: number;
  ownState?: boolean;
  data?: any;
  onChange?(selected: number, prevSelected: number): void;
}

export const CategorizationLayoutRenderer = (
  props: CategorizationLayoutRendererProps
) => {
  const {
    data,
    path,
    renderers,
    cells,
    schema,
    uischema,
    visible,
    enabled,
    selected,
    onChange,
    ajv,
    config,
    t,
  } = props;
  const categorization = uischema as Categorization;
  // Visibility, `options.initial` and the "selected category became hidden"
  // rule are the same for tabs, stepper and accordion, so section 8's
  // navigation contract is implemented once and shared.
  const { categories, active, select } = useCategorySelection(
    categorization,
    data,
    ajv,
    config,
    selected
  );

  /*
    Per category, not per selection. antd keeps a tab panel mounted once it has
    been visited, so a panel built from `categories[active]` goes on rendering
    whatever is selected now - and the panels left behind end up duplicating
    the selected category instead of holding their own.
  */
  const childProps = (category: Category): AntdLayoutRendererProps => ({
    elements: category.elements ?? [],
    schema,
    path,
    direction: 'column',
    enabled,
    visible,
    renderers,
    cells,
  });
  const onTabChange = (value: string) => {
    const category = parseInt(value);

    if (onChange) {
      onChange(category, active);
    }
    select(category);
  };

  const tabLabels = useMemo(() => {
    return categories.map((e: Category) => deriveLabelForUISchemaElement(e, t));
  }, [categories, t]);

  if (!visible) {
    return null;
  }

  return (
    <Tabs
      /*
        Controlled, not `defaultActiveKey`. An uncontrolled Tabs keeps its own
        index, so when the selected category was hidden by a rule the tab strip
        went on pointing at that slot and showed a different category's panel.
      */
      activeKey={String(active)}
      onChange={onTabChange}
      items={categories.map(
        (category: Category, idx: number) =>
          ({
            label: (
              <CategoryHeader
                category={category}
                label={tabLabels[idx]}
                path={path}
                config={config}
              />
            ),
            key: String(idx),
            children: <AntdLayoutRenderer {...childProps(category)} />,
          } as any)
      )}
    ></Tabs>
  );
};

export default withAjvProps(
  withTranslateProps(withJsonFormsLayoutProps(CategorizationLayoutRenderer))
);
