import React, { useMemo } from 'react';
import merge from 'lodash/merge';
import { Button, Steps } from 'antd';
import {
  and,
  Categorization,
  categorizationHasCategory,
  Category,
  deriveLabelForUISchemaElement,
  optionIs,
  RankedTester,
  rankWith,
  StatePropsOfLayout,
  uiTypeIs,
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import { CategoryHeader } from './CategoryHeader';
import { useCategorySelection } from '../util/categoryState';
import { useI18n } from '../util/translate';
import {
  AjvProps,
  AntdLayoutRenderer,
  AntdLayoutRendererProps,
  withAjvProps,
} from '../util/layout';

export const categorizationStepperTester: RankedTester = rankWith(
  2,
  and(
    uiTypeIs('Categorization'),
    categorizationHasCategory,
    optionIs('variant', 'stepper')
  )
);

export interface CategorizationStepperState {
  activeCategory: number;
}

export interface CategorizationStepperLayoutRendererProps
  extends StatePropsOfLayout,
    AjvProps,
    TranslateProps {
  data: any;
}

export const CategorizationStepperLayoutRenderer = (
  props: CategorizationStepperLayoutRendererProps
) => {
  // The `t` from props is core's Translator, which returns undefined for a
  // key with no fallback; useI18n always supplies the default.
  const label = useI18n();
  const {
    data,
    path,
    renderers,
    schema,
    uischema,
    visible,
    cells,
    config,
    ajv,
    t,
  } = props;
  const categorization = uischema as Categorization;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const buttonWrapperStyle = {
    textAlign: 'right' as const,
    width: '100%',
    margin: '1em auto',
  };
  const buttonNextStyle = {
    float: 'right' as const,
  };
  const buttonStyle = {
    marginRight: '1em',
  };
  // Section 8's navigation contract, shared with the tabs and accordion
  // presentations: visibility, `options.initial`, and what happens when the
  // current category is hidden.
  const {
    categories,
    active: activeCategory,
    select,
  } = useCategorySelection(categorization, data, ajv, config);
  const handleStep = (step: number) => {
    // "Previous/Next actions operate on visible categories and stop at the
    // first/last visible category."
    select(Math.min(Math.max(step, 0), categories.length - 1));
  };
  const childProps: AntdLayoutRendererProps = {
    // A Categorization whose categories are all hidden has "no active category
    // or stale active panel"; indexing blindly here threw instead.
    elements: categories[activeCategory]?.elements ?? [],
    schema,
    path,
    direction: 'column',
    visible,
    renderers,
    cells,
  };
  const tabLabels = useMemo(() => {
    return categories.map((e: Category) => deriveLabelForUISchemaElement(e, t));
  }, [categories, t]);

  if (!visible) {
    return null;
  }

  return (
    <>
      <Steps
        current={activeCategory < 0 ? 0 : activeCategory}
        items={categories.map((category: Category, idx: number) => ({
          key: tabLabels[idx],
          title: (
            <CategoryHeader
              category={category}
              label={tabLabels[idx]}
              path={path}
              config={config}
            />
          ),
        }))}
        onChange={handleStep}
        style={{ marginBottom: '10px' }}
      />
      <div>
        <AntdLayoutRenderer {...childProps} />
      </div>
      {appliedUiSchemaOptions.showNavButtons ? (
        <div style={buttonWrapperStyle}>
          <Button
            style={buttonNextStyle}
            color='primary'
            disabled={activeCategory >= categories.length - 1}
            onClick={() => handleStep(activeCategory + 1)}
          >
            {label('categorization.next')}
          </Button>
          <Button
            style={buttonStyle}
            color='default'
            disabled={activeCategory <= 0}
            onClick={() => handleStep(activeCategory - 1)}
          >
            {label('categorization.previous')}
          </Button>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default withAjvProps(
  withTranslateProps(
    withJsonFormsLayoutProps(CategorizationStepperLayoutRenderer)
  )
);
