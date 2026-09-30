import { ContainerValidationIndicator } from './ValidationIndicator';
import {
  Categorization,
  Category,
  LayoutProps,
  and,
  categorizationHasCategory,
  deriveLabelForUISchemaElement,
  optionIs,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  categoryKey,
  useCategorySelection,
} from '@chobantonov/jsonforms-react-renderer-common/categoryState';
import { useGroupState } from '@chobantonov/jsonforms-react-renderer-common/groupState';
import { useContainerValidation } from '@chobantonov/jsonforms-react-renderer-common/validationIndicator';
import {
  useI18n,
  useTranslator,
} from '@chobantonov/jsonforms-react-renderer-common/translate';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@jsonforms-react-shadcn-ui/tabs';

const Indicators = ({
  category,
  path,
  config,
}: {
  category: Category;
  path: string;
  config: any;
}) => {
  const group = useGroupState(category, path, config);
  const validation = useContainerValidation(category, path, config, false);
  const t = useI18n();
  return (
    <span className='inline-flex items-center gap-1'>
      {validation.show && (
        <ContainerValidationIndicator count={validation.count} />
      )}
      {group.hasData && (
        <span
          role='img'
          aria-label={t('group.dataIndicator')}
          title={t('group.dataIndicator')}
          data-category-data-indicator
        >
          ●
        </span>
      )}
    </span>
  );
};

/** All presentations share identity, visibility and initial-selection rules. */
export const ShadcnCategorizationLayout = (props: LayoutProps) => {
  const ctx = useJsonForms();
  const t = useTranslator();
  const text = useI18n();
  const baseId = useId();
  const categorization = props.uischema as Categorization;
  const variant = categorization.options?.variant;
  const options = { ...props.config, ...categorization.options };
  const { categories, active, select, close } = useCategorySelection(
    categorization,
    ctx.core?.data,
    ctx.core?.ajv,
    props.config,
    undefined,
    variant === 'accordion'
  );
  if (!props.visible || categories.length === 0) return null;
  const key = (category: Category, index: number) =>
    categoryKey(category, index);
  const label = (category: Category) =>
    deriveLabelForUISchemaElement(category, t);
  const panel = (category: Category) => (
    <JsonFormsDispatch
      schema={props.schema}
      uischema={{ ...category, type: 'VerticalLayout' }}
      path={props.path}
      enabled={props.enabled}
      renderers={props.renderers}
      cells={props.cells}
    />
  );
  const indicators = (category: Category) => (
    <Indicators category={category} path={props.path} config={props.config} />
  );

  if (variant === 'accordion')
    return (
      <div className='shadcn-jsonforms-categorization space-y-1'>
        {categories.map((category, index) => {
          const categoryId = `${baseId}-${encodeURIComponent(
            key(category, index)
          )}`;
          const expanded = index === active;
          return (
            <div key={key(category, index)} className='border-b'>
              <h3>
                <Button
                  type='button'
                  variant='ghost'
                  className='h-auto w-full justify-between py-4 text-left'
                  id={`${categoryId}-header`}
                  aria-expanded={expanded}
                  aria-controls={`${categoryId}-panel`}
                  onClick={() => (expanded ? close() : select(index))}
                >
                  <span>{label(category)}</span>
                  <span className='ml-auto flex items-center gap-2'>
                    {indicators(category)}
                    <ChevronDown
                      aria-hidden='true'
                      className={expanded ? 'h-4 w-4 rotate-180' : 'h-4 w-4'}
                    />
                  </span>
                </Button>
              </h3>
              <div
                id={`${categoryId}-panel`}
                role='region'
                aria-labelledby={`${categoryId}-header`}
                hidden={!expanded}
                className='pb-4'
              >
                {panel(category)}
              </div>
            </div>
          );
        })}
      </div>
    );

  if (variant === 'stepper')
    return (
      <div className='shadcn-jsonforms-categorization space-y-4'>
        <ol
          className={
            options.vertical ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'
          }
        >
          {categories.map((category, index) => (
            <li key={key(category, index)}>
              <Button
                type='button'
                variant={index === active ? 'default' : 'outline'}
                aria-current={index === active ? 'step' : undefined}
                aria-controls={`${baseId}-step-${index}`}
                id={`${baseId}-step-heading-${index}`}
                onClick={() => select(index)}
              >
                <span aria-hidden='true'>{index + 1}.</span>
                {label(category)}
                {indicators(category)}
              </Button>
            </li>
          ))}
        </ol>
        {categories.map((category, index) => (
          <div
            key={key(category, index)}
            id={`${baseId}-step-${index}`}
            role='region'
            aria-labelledby={`${baseId}-step-heading-${index}`}
            hidden={index !== active}
          >
            {panel(category)}
          </div>
        ))}
        {options.showNavButtons && (
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              disabled={active <= 0}
              onClick={() => select(active - 1)}
            >
              {text('categorization.previous')}
            </Button>
            <Button
              type='button'
              disabled={active < 0 || active >= categories.length - 1}
              onClick={() => select(active + 1)}
            >
              {text('categorization.next')}
            </Button>
          </div>
        )}
      </div>
    );

  return (
    <Tabs
      className='shadcn-jsonforms-categorization'
      value={String(active)}
      onValueChange={(value) => select(Number(value))}
    >
      <TabsList>
        {categories.map((category, index) => (
          <TabsTrigger key={key(category, index)} value={String(index)}>
            {label(category)}
            {indicators(category)}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((category, index) => (
        <TabsContent
          key={key(category, index)}
          value={String(index)}
          forceMount
          hidden={index !== active}
        >
          {panel(category)}
        </TabsContent>
      ))}
    </Tabs>
  );
};
export const categorizationTester = rankWith(1, uiTypeIs('Categorization'));
export const categorizationAccordionTester = rankWith(
  3,
  and(
    uiTypeIs('Categorization'),
    categorizationHasCategory,
    optionIs('variant', 'accordion')
  )
);
export const categorizationStepperTester = rankWith(
  2,
  and(
    uiTypeIs('Categorization'),
    categorizationHasCategory,
    optionIs('variant', 'stepper')
  )
);
