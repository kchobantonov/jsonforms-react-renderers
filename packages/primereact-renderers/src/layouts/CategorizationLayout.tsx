/*
  The MIT License

  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import React, { useState, useMemo } from 'react';
import {
  and,
  Categorization,
  Category,
  deriveLabelForUISchemaElement,
  isVisible,
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
import {
  AjvProps,
  PrimeLayoutRenderer,
  PrimeLayoutRendererProps,
  withAjvProps,
} from '../util/layout';
import { TabView, TabPanel, TabViewTabChangeEvent } from 'primereact/tabview';

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
    t,
  } = props;
  const categorization = uischema as Categorization;
  const [previousCategorization, setPreviousCategorization] =
    useState<Categorization>(uischema as Categorization);
  const [activeCategory, setActiveCategory] = useState<number>(selected ?? 0);
  const categories = useMemo(
    () =>
      categorization.elements.filter((category: Category) =>
        isVisible(category, data, undefined, ajv)
      ),
    [categorization, data, ajv]
  );

  if (categorization !== previousCategorization) {
    setActiveCategory(0);
    setPreviousCategorization(categorization);
  }

  const safeCategory =
    activeCategory >= categorization.elements.length ? 0 : activeCategory;
  const childProps: PrimeLayoutRendererProps = {
    elements: categories[safeCategory] ? categories[safeCategory].elements : [],
    schema,
    path,
    direction: 'column',
    enabled,
    visible,
    renderers,
    cells,
  };
  const onTabChange = (e: TabViewTabChangeEvent) => {
    const category = e.index;

    if (onChange) {
      onChange(category, safeCategory);
    }
    setActiveCategory(category);
  };

  const tabLabels = useMemo(() => {
    return categories.map((e: Category) => deriveLabelForUISchemaElement(e, t));
  }, [categories, t]);

  if (!visible) {
    return null;
  }

  return (
    <TabView activeIndex={safeCategory} onTabChange={onTabChange} scrollable>
      {categories.map((_, idx: number) => (
        <TabPanel header={tabLabels[idx]} key={`${path}-${idx}`}>
          <PrimeLayoutRenderer {...childProps} />
        </TabPanel>
      ))}
    </TabView>
  );
};

export default withAjvProps(
  withTranslateProps(withJsonFormsLayoutProps(CategorizationLayoutRenderer))
);
