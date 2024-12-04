import {
  and,
  ControlProps,
  DispatchPropsOfMultiEnumControl,
  hasType,
  JsonSchema,
  OwnPropsOfEnum,
  Paths,
  RankedTester,
  rankWith,
  resolveSchema,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
} from '@jsonforms/core';

import { withJsonFormsMultiEnumProps } from '@jsonforms/react';
import isEmpty from 'lodash/isEmpty';
import React from 'react';
import { InputControl } from '../controls';
import { PrimeCheckbox } from '../prime-controls/PrimeCheckbox';

export const EnumArrayRenderer = (
  props: ControlProps & OwnPropsOfEnum & DispatchPropsOfMultiEnumControl
) => {
  const {
    id,
    schema,
    visible,
    errors,
    path,
    options,
    data,
    addItem,
    removeItem,
    uischema,
    rootSchema,
    enabled,
  } = props;

  if (!visible) {
    return null;
  }

  return (
    <InputControl
      {...props}
      input={options.map((option: any, index: number) => {
        const optionPath = Paths.compose(path, `${index}`);
        const checkboxValue = data?.includes(option.value)
          ? option.value
          : undefined;
        return (
          <PrimeCheckbox
            id={id + '-label-' + option.value}
            key={option.value}
            label={option.label}
            isValid={isEmpty(errors)}
            path={optionPath}
            handleChange={(_childPath, newValue) =>
              newValue
                ? addItem(path, option.value)
                : removeItem(path, option.value)
            }
            data={checkboxValue}
            errors={errors}
            schema={schema}
            visible={visible}
            uischema={uischema}
            rootSchema={rootSchema}
            enabled={enabled}
          />
        );
      })}
    ></InputControl>
  );
};

const hasOneOfItems = (schema: JsonSchema): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema: JsonSchema): boolean =>
  schema.type === 'string' && schema.enum !== undefined;

export const enumArrayRendererTester: RankedTester = rankWith(
  5,
  and(
    uiTypeIs('Control'),
    and(
      schemaMatches(
        (schema) =>
          hasType(schema, 'array') &&
          !Array.isArray(schema.items) &&
          schema.uniqueItems === true
      ),
      schemaSubPathMatches('items', (schema, rootSchema) => {
        const resolvedSchema = schema.$ref
          ? resolveSchema(rootSchema, schema.$ref, rootSchema)
          : schema;
        return hasOneOfItems(resolvedSchema) || hasEnumItems(resolvedSchema);
      })
    )
  )
);

export default withJsonFormsMultiEnumProps(EnumArrayRenderer);
