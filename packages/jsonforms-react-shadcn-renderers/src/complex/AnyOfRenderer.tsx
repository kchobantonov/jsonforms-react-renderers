import { X } from 'lucide-react';
import { missingDiscriminatorError } from '@chobantonov/jsonforms-react-renderer-common/discriminatorBranch';
import { displayableErrors } from '@chobantonov/jsonforms-react-renderer-common/validationIndicator';
import { useJsonForms } from '@jsonforms/react';
import { isArrayElementPath } from '@chobantonov/jsonforms-react-renderer-common/mixed';
import { clearedBranchValue } from '@chobantonov/jsonforms-react-renderer-common/combinators';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { useId, useEffect } from 'react';
import { useTranslator } from '@chobantonov/jsonforms-react-renderer-common/translate';
import {
  branchChangeData,
  discardedByBranchChange,
} from '@chobantonov/jsonforms-react-renderer-common/combinators';
import { useConfirmation } from './mixed/useConfirmation';
import { discriminatorBranch } from '@chobantonov/jsonforms-react-renderer-common/discriminatorBranch';
import { CombinatorBranch } from '@chobantonov/jsonforms-react-renderer-common/CombinatorBranch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@jsonforms-react-shadcn-ui/select';
import {
  CombinatorRendererProps,
  createCombinatorRenderInfos,
  createDefaultValue,
  isAnyOfControl,
  JsonSchema,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsAnyOfProps } from '@jsonforms/react';
import React, { useCallback, useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@jsonforms-react-shadcn-ui/tabs';
import { CombinatorProperties } from './CombinatorProperties';
import { CombinatorSwitchDialog } from './CombinatorSwitchDialog';

const isEmptyData = (data: unknown) =>
  data === undefined ||
  data === null ||
  data === '' ||
  (Array.isArray(data) && data.length === 0) ||
  (typeof data === 'object' &&
    !Array.isArray(data) &&
    Object.keys(data as Record<string, unknown>).length === 0);

export const ShadcnAnyOfRenderer = ({
  handleChange,
  schema,
  rootSchema,
  indexOfFittingSchema,
  visible,
  path,
  renderers,
  cells,
  uischema,
  uischemas,
  data,
  enabled,
  label,
  config,
  combinator = 'anyOf',
}: CombinatorRendererProps & { combinator?: 'anyOf' | 'oneOf' }) => {
  const formContext = useJsonForms();
  indexOfFittingSchema =
    discriminatorBranch(schema, rootSchema, combinator, data) ??
    indexOfFittingSchema;
  const selectorId = useId();
  const [selectedIndex, setSelectedIndex] = useState(
    indexOfFittingSchema ??
      (combinator === 'oneOf' && isEmptyData(data) ? -1 : 0)
  );
  const confirmation = useConfirmation();
  const [pendingIndex, setPendingIndex] = useState<number>();
  useEffect(() => {
    if (
      combinator === 'oneOf' &&
      (data === undefined ||
        (data !== null &&
          typeof data === 'object' &&
          !Array.isArray(data) &&
          Object.keys(data).length === 0 &&
          (indexOfFittingSchema == null || indexOfFittingSchema < 0)))
    ) {
      setSelectedIndex(-1);
      setPendingIndex(undefined);
    }
  }, [data, indexOfFittingSchema, combinator]);

  const translate = useTranslator();
  const [primaryErrors, additionalErrors] = displayableErrors(
    formContext.core ?? {}
  );
  const missingKind = missingDiscriminatorError(schema, rootSchema, path, [
    ...(primaryErrors ?? []),
    ...(additionalErrors ?? []),
  ]);
  const selectionError = missingKind
    ? translate('oneOf.chooseKind', 'Choose a kind.')
    : '';

  const renderInfos = createCombinatorRenderInfos(
    (schema as JsonSchema)[combinator],
    rootSchema,
    combinator,
    uischema,
    path,
    uischemas
  ).map((info) => {
    const prefix = (info.schema as JsonSchema & { i18n?: string }).i18n;
    return typeof prefix === 'string'
      ? {
          ...info,
          label: translate(`${prefix}.label`, info.label) ?? info.label,
        }
      : info;
  });

  const selectSchema = useCallback(
    (index: number, resetData: boolean) => {
      if (resetData) {
        handleChange(
          path,
          createDefaultValue(renderInfos[index].schema, rootSchema)
        );
      }
      setSelectedIndex(index);
    },
    [handleChange, path, renderInfos, rootSchema]
  );

  const handleTabChange = (value: string) => {
    const index = value === '' ? -1 : Number(value);
    if (enabled === false || index === selectedIndex) return;
    if (combinator === 'oneOf') {
      confirmation.request({
        catalogId: 'oneOf',
        operation: 'branchChange',
        config,
        options: uischema.options,
        discarded: [discardedByBranchChange(data, schema)],
        perform: () => {
          handleChange(
            path,
            branchChangeData(
              data,
              index < 0
                ? clearedBranchValue(
                    isArrayElementPath(formContext.core?.data, path),
                    renderInfos.map((info) => info.schema)
                  )
                : createDefaultValue(renderInfos[index].schema, rootSchema),
              schema
            )
          );
          setSelectedIndex(index);
        },
      });
      return;
    }
    const nextDefault = createDefaultValue(
      renderInfos[index].schema,
      rootSchema
    );

    if (isEmptyData(data) || typeof data === typeof nextDefault) {
      selectSchema(index, false);
      return;
    }

    setPendingIndex(index);
  };

  if (!visible) {
    return null;
  }

  if (renderInfos.length === 1) {
    const branch = renderInfos[0];
    return (
      <>
        <CombinatorProperties
          schema={schema}
          combinatorKeyword={combinator}
          path={path}
          rootSchema={rootSchema}
        />
        <CombinatorBranch
          options={uischema.options}
          schema={branch.schema}
          path={path}
        >
          <JsonFormsDispatch
            schema={branch.schema}
            uischema={branch.uischema}
            path={path}
            renderers={renderers}
            cells={cells}
            enabled={enabled}
          />
        </CombinatorBranch>
      </>
    );
  }

  return (
    <div className='shadcn-jsonforms-combinator'>
      <CombinatorProperties
        schema={schema}
        combinatorKeyword={combinator}
        path={path}
        rootSchema={rootSchema}
      />
      {combinator === 'oneOf' ? (
        <>
          {label && (
            <label
              htmlFor={selectorId}
              className='mb-2 block text-sm font-medium'
            >
              {label}
            </label>
          )}
          <div className='relative w-full'>
            <Select
              value={selectedIndex >= 0 ? String(selectedIndex) : ''}
              disabled={enabled === false}
              onValueChange={handleTabChange}
            >
              <SelectTrigger
                className={selectedIndex >= 0 ? 'w-full pe-16' : 'w-full'}
                id={selectorId}
                aria-invalid={Boolean(selectionError)}
                aria-describedby={
                  selectionError ? selectorId + '-error' : undefined
                }
                aria-label={label || schema.title || 'oneOf'}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {renderInfos.map((info, index) => (
                  <SelectItem key={index} value={String(index)}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedIndex >= 0 && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute end-8 top-1/2 size-7 -translate-y-1/2'
                aria-label={translate('oneOf.clear', 'Clear selection')}
                title={translate('oneOf.clear', 'Clear selection')}
                disabled={enabled === false}
                onClick={() => handleTabChange('')}
              >
                <X className='size-4' aria-hidden='true' />
              </Button>
            )}
          </div>
          {selectionError && (
            <p
              id={selectorId + '-error'}
              role='alert'
              className='text-sm text-destructive'
            >
              {selectionError}
            </p>
          )}
          {renderInfos[selectedIndex] && (
            <CombinatorBranch
              options={uischema.options}
              schema={renderInfos[selectedIndex].schema}
              path={path}
            >
              <JsonFormsDispatch
                schema={renderInfos[selectedIndex].schema}
                uischema={renderInfos[selectedIndex].uischema}
                path={path}
                renderers={renderers}
                cells={cells}
                enabled={enabled}
              />
            </CombinatorBranch>
          )}
        </>
      ) : (
        <Tabs value={String(selectedIndex)} onValueChange={handleTabChange}>
          <TabsList>
            {renderInfos.map((renderInfo, index) => (
              <TabsTrigger key={index} value={String(index)}>
                {renderInfo.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {renderInfos.map((renderInfo, index) => (
            <TabsContent key={index} value={String(index)}>
              {selectedIndex === index ? (
                <CombinatorBranch
                  options={uischema.options}
                  schema={renderInfo.schema}
                  path={path}
                >
                  <JsonFormsDispatch
                    schema={renderInfo.schema}
                    uischema={renderInfo.uischema}
                    path={path}
                    renderers={renderers}
                    cells={cells}
                  />
                </CombinatorBranch>
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      )}
      {confirmation.dialog}
      <CombinatorSwitchDialog
        open={pendingIndex !== undefined}
        onCancel={() => setPendingIndex(undefined)}
        onConfirm={() => {
          if (pendingIndex !== undefined) {
            selectSchema(pendingIndex, true);
          }
          setPendingIndex(undefined);
        }}
      />
    </div>
  );
};

export const anyOfControlTester: RankedTester = rankWith(3, isAnyOfControl);

export const ShadcnAnyOfControl = withJsonFormsAnyOfProps(ShadcnAnyOfRenderer);
