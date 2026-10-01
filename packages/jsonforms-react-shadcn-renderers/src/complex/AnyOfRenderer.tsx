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
  combinator = 'anyOf',
}: CombinatorRendererProps & { combinator?: 'anyOf' | 'oneOf' }) => {
  const [selectedIndex, setSelectedIndex] = useState(indexOfFittingSchema ?? 0);
  const [pendingIndex, setPendingIndex] = useState<number>();

  const renderInfos = createCombinatorRenderInfos(
    (schema as JsonSchema)[combinator],
    rootSchema,
    combinator,
    uischema,
    path,
    uischemas
  );

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
    const index = Number(value);
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
          <Select
            value={selectedIndex >= 0 ? String(selectedIndex) : ''}
            disabled={enabled === false}
            onValueChange={handleTabChange}
          >
            <SelectTrigger aria-label={label || schema.title || 'oneOf'}>
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
          {renderInfos[selectedIndex] && (
            <JsonFormsDispatch
              schema={renderInfos[selectedIndex].schema}
              uischema={renderInfos[selectedIndex].uischema}
              path={path}
              renderers={renderers}
              cells={cells}
              enabled={enabled}
            />
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
                <JsonFormsDispatch
                  schema={renderInfo.schema}
                  uischema={renderInfo.uischema}
                  path={path}
                  renderers={renderers}
                  cells={cells}
                />
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      )}
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
