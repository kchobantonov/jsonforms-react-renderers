import {
  and,
  ControlProps,
  DispatchPropsOfMultiEnumControl,
  hasType,
  isDescriptionHidden,
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
import { Flex, Form } from 'antd';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';
import React from 'react';
import { AntdCheckbox } from '../antd-controls/AntdCheckbox';
import { useFocus } from '../util';

export const EnumArrayRenderer = ({
  config,
  id,
  schema,
  visible,
  errors,
  description,
  label,
  required,
  path,
  options,
  data,
  addItem,
  removeItem,
  uischema,
  rootSchema,
  enabled,
}: ControlProps & OwnPropsOfEnum & DispatchPropsOfMultiEnumControl) => {
  const [focused, onFocus, onBlur] = useFocus();
  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  if (!visible) {
    return null;
  }

  return (
    <Form.Item
      required={required}
      hasFeedback={!isValid}
      validateStatus={isValid ? 'success' : 'error'}
      label={label}
      help={!isValid ? errors : showDescription ? description : null}
    >
      <Flex gap={2} vertical={appliedUiSchemaOptions.vertical}>
        {options.map((option: any, index: number) => {
          const optionPath = Paths.compose(path, `${index}`);
          const checkboxValue = data?.includes(option.value) ? true : false;
          return (
            <AntdCheckbox
              id={id + '-input-' + option.value}
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
              rootSchema={rootSchema}
              uischema={uischema}
              enabled={enabled}
              inputProps={{
                onFocus,
                onBlur,
              }}
            />
          );
        })}
      </Flex>
    </Form.Item>
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
