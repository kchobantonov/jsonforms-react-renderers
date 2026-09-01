import {
  composePaths,
  ControlElement,
  createControlElement,
  createDefaultValue,
  Generate,
  GroupLayout,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonFormsUISchemaRegistryEntry,
  JsonSchema,
  JsonSchema7,
  resolveSchema,
  UISchemaElement,
} from '@jsonforms/core';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  Row,
  Tooltip,
  Typography,
} from 'antd';
import React, { useMemo, useState } from 'react';
import { AntdAdditionalPropertyActions } from './additionalProperties/AntdAdditionalPropertyActions';
import { AntdAdditionalPropertyRenameDialog } from './additionalProperties/AntdAdditionalPropertyRenameDialog';

const ANY_TYPE: JsonSchema7['type'] = [
  'array',
  'boolean',
  'integer',
  'null',
  'number',
  'object',
  'string',
];

type AdditionalPropertyItem = {
  propertyName: string;
  path: string;
  schema: JsonSchema;
  uischema: UISchemaElement;
};

export type AdditionalPropertiesProps = {
  cells?: JsonFormsCellRendererRegistryEntry[];
  config?: any;
  data: any;
  enabled: boolean;
  handleChange(path: string, value: any): void;
  label: string;
  path: string;
  readonly?: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  rootSchema: JsonSchema;
  schema: JsonSchema;
  uischema: ControlElement;
  uischemas?: JsonFormsUISchemaRegistryEntry[];
};

const toObjectSchema = (schema: JsonSchema): JsonSchema7 =>
  typeof schema === 'object' ? (schema as JsonSchema7) : {};

const hasAdditionalProperties = (schema: JsonSchema): boolean => {
  const objectSchema = toObjectSchema(schema);
  return (
    Boolean(
      objectSchema.patternProperties &&
        Object.keys(objectSchema.patternProperties).length > 0
    ) ||
    typeof objectSchema.additionalProperties === 'object' ||
    objectSchema.additionalProperties === true
  );
};

const getMatchingAdditionalPropertySchema = (
  propName: string,
  parentSchema: JsonSchema,
  rootSchema: JsonSchema,
  allowIfMissing: boolean
): JsonSchema => {
  const objectSchema = toObjectSchema(parentSchema);
  let propSchema: JsonSchema | undefined;

  if (objectSchema.patternProperties) {
    const matchingSchemas = Object.entries(objectSchema.patternProperties)
      .filter(([pattern]) => new RegExp(pattern).test(propName))
      .map(([, candidate]) => candidate);
    if (matchingSchemas.length === 1) propSchema = matchingSchemas[0];
    if (matchingSchemas.length > 1) propSchema = { allOf: matchingSchemas };
  }

  if (
    !propSchema &&
    (typeof objectSchema.additionalProperties === 'object' ||
      objectSchema.additionalProperties === true)
  ) {
    propSchema =
      objectSchema.additionalProperties === true
        ? { type: ANY_TYPE }
        : objectSchema.additionalProperties;
  }

  if (!propSchema && allowIfMissing) {
    propSchema = { type: ANY_TYPE };
  }

  if (typeof propSchema === 'object' && typeof propSchema.$ref === 'string') {
    propSchema = resolveSchema(rootSchema, propSchema.$ref, rootSchema);
  }

  propSchema = propSchema ?? { type: ANY_TYPE };

  if (typeof propSchema === 'object' && propSchema.type === undefined) {
    propSchema = {
      ...propSchema,
      type: ANY_TYPE,
    };
  }

  return propSchema;
};

const toAdditionalPropertyItem = (
  propName: string,
  parentPath: string,
  parentSchema: JsonSchema,
  rootSchema: JsonSchema,
  allowIfMissing: boolean
): AdditionalPropertyItem => {
  let propSchema = getMatchingAdditionalPropertySchema(
    propName,
    parentSchema,
    rootSchema,
    allowIfMissing
  );
  let propUiSchema: UISchemaElement = createControlElement('#');

  if (typeof propSchema === 'object' && propSchema.type === 'array') {
    propUiSchema = Generate.uiSchema(
      propSchema,
      'Group',
      undefined,
      rootSchema
    );
    (propUiSchema as GroupLayout).label = propSchema.title ?? propName;
  }

  if (typeof propSchema === 'object') {
    propSchema = {
      ...propSchema,
      title: propName,
    };

    if (propSchema.type === 'object') {
      propSchema.additionalProperties =
        propSchema.additionalProperties !== false
          ? propSchema.additionalProperties ?? true
          : false;
    } else if (propSchema.type === 'array') {
      propSchema.items = propSchema.items ?? {};
    }
  }

  return {
    propertyName: propName,
    path: composePaths(parentPath, propName),
    schema: propSchema,
    uischema: propUiSchema,
  };
};

const getPropertyNamePattern = (
  schema: JsonSchema,
  rootSchema: JsonSchema
): string | undefined => {
  const objectSchema = toObjectSchema(schema);
  let propertyNames = objectSchema.propertyNames as JsonSchema7 | undefined;
  if (
    typeof propertyNames === 'object' &&
    typeof propertyNames.$ref === 'string'
  ) {
    propertyNames =
      (resolveSchema(rootSchema, propertyNames.$ref, rootSchema) as
        | JsonSchema7
        | undefined) ?? propertyNames;
  }

  if (typeof propertyNames === 'object' && propertyNames.pattern) {
    return propertyNames.pattern;
  }

  if (
    objectSchema.additionalProperties === false &&
    objectSchema.patternProperties
  ) {
    const patterns = Object.keys(objectSchema.patternProperties);
    return patterns.length > 0 ? patterns.join('|') : undefined;
  }

  return undefined;
};

const validatePropertyName = (
  propertyName: string,
  data: any,
  schema: JsonSchema,
  rootSchema: JsonSchema,
  currentPropertyName?: string
): string | undefined => {
  if (!propertyName) {
    return undefined;
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    Object.prototype.hasOwnProperty.call(data, propertyName) &&
    propertyName !== currentPropertyName
  ) {
    return `Property '${propertyName}' already defined`;
  }

  if (
    propertyName.includes('[') ||
    propertyName.includes(']') ||
    propertyName.includes('.')
  ) {
    return `Property name '${propertyName}' is invalid`;
  }

  const pattern = getPropertyNamePattern(schema, rootSchema);
  if (pattern && !new RegExp(pattern).test(propertyName)) {
    return `Property name must match pattern: ${pattern}`;
  }

  return undefined;
};

export const AdditionalProperties = ({
  cells,
  config,
  data,
  enabled,
  handleChange,
  label,
  path,
  readonly,
  renderers,
  rootSchema,
  schema,
  uischema,
}: AdditionalPropertiesProps) => {
  const context = useJsonForms();
  const [newPropertyName, setNewPropertyName] = useState('');
  const [renamingPropertyName, setRenamingPropertyName] = useState<
    string | null
  >(null);
  const [renameValue, setRenameValue] = useState('');
  const objectSchema = toObjectSchema(schema);
  const appliedOptions = { ...(config ?? {}), ...(uischema.options ?? {}) };
  const restrict = appliedOptions.restrict !== false;
  const objectData =
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? data
      : undefined;
  const allowIfMissing =
    appliedOptions.allowAdditionalPropertiesIfMissing === true &&
    objectSchema.additionalProperties === undefined;
  const reservedPropertyNames = Object.keys(objectSchema.properties ?? {});
  const additionalKeys = Object.keys(objectData ?? {}).filter(
    (key) => !reservedPropertyNames.includes(key)
  );
  const additionalPropertyItems = useMemo(
    () =>
      additionalKeys.map((propertyName) =>
        toAdditionalPropertyItem(
          propertyName,
          path,
          schema,
          rootSchema,
          allowIfMissing
        )
      ),
    [additionalKeys.join('\u0000'), allowIfMissing, path, rootSchema, schema]
  );
  const shouldShow =
    hasAdditionalProperties(schema) ||
    allowIfMissing ||
    additionalKeys.length > 0;

  if (!shouldShow) {
    return null;
  }

  const propertyName = newPropertyName.trim();
  const validateName = (name: string, currentName?: string) => {
    const basicError = validatePropertyName(
      name,
      data,
      schema,
      rootSchema,
      currentName
    );
    if (basicError) return basicError;
    let propertyNames = objectSchema.propertyNames as JsonSchema7 | undefined;
    if (propertyNames?.$ref) {
      propertyNames =
        (resolveSchema(rootSchema, propertyNames.$ref, rootSchema) as
          | JsonSchema7
          | undefined) ?? propertyNames;
    }
    const ajv = context.core?.ajv;
    if (propertyNames && ajv && !ajv.validate(propertyNames, name)) {
      return ajv.errorsText(ajv.errors) || 'The property name is invalid.';
    }
    return undefined;
  };
  const propertyNameError = validateName(propertyName);
  const maxPropertiesReached =
    objectSchema.maxProperties !== undefined &&
    objectData &&
    Object.keys(objectData).length >= objectSchema.maxProperties;
  const minPropertiesReached =
    objectSchema.minProperties !== undefined &&
    objectData &&
    Object.keys(objectData).length <= objectSchema.minProperties;
  const addPropertyDisabled =
    !enabled ||
    readonly ||
    (restrict && maxPropertiesReached) ||
    Boolean(propertyNameError) ||
    !propertyName;
  const removePropertyDisabled =
    !enabled || readonly || (restrict && minPropertiesReached);

  const addProperty = () => {
    if (addPropertyDisabled) {
      return;
    }

    const additionalProperty = toAdditionalPropertyItem(
      propertyName,
      path,
      schema,
      rootSchema,
      allowIfMissing
    );
    const updatedData = objectData ? { ...objectData } : {};

    updatedData[propertyName] = createDefaultValue(
      additionalProperty.schema,
      rootSchema
    );
    handleChange(path, updatedData);
    setNewPropertyName('');
  };

  const removeProperty = (propertyToRemove: string) => {
    if (removePropertyDisabled || !objectData) {
      return;
    }

    const updatedData = { ...objectData };
    delete updatedData[propertyToRemove];
    handleChange(path, updatedData);
  };

  const renameProperty = (propertyToRename: string) => {
    const trimmed = renameValue.trim();
    const renameError = validateName(trimmed, propertyToRename);
    if (
      renameError ||
      !trimmed ||
      trimmed === propertyToRename ||
      !objectData
    ) {
      return;
    }

    const updatedData = Object.fromEntries(
      Object.entries(objectData).map(([key, value]) => [
        key === propertyToRename ? trimmed : key,
        value,
      ])
    );
    handleChange(path, updatedData);
    setRenamingPropertyName(null);
    setRenameValue('');
  };

  const renameError = renamingPropertyName
    ? validateName(renameValue.trim(), renamingPropertyName)
    : undefined;
  const closeRename = () => {
    setRenamingPropertyName(null);
    setRenameValue('');
  };

  return (
    <Card className='jsonforms-additional-properties' size='small'>
      <Flex vertical gap='middle'>
        <Row align='bottom' gutter={[12, 8]}>
          <Col md={5} xs={24}>
            <Typography.Text>Additional Properties</Typography.Text>
          </Col>
          <Col md={18} xs={20}>
            <Form.Item
              label='Property Name'
              validateStatus={
                newPropertyName && propertyNameError ? 'error' : undefined
              }
              style={{ marginBottom: 0 }}
            >
              <Input
                aria-label={label ? `Add property to ${label}` : 'Add property'}
                disabled={!enabled || readonly}
                placeholder='Property name'
                value={newPropertyName}
                onChange={(event) =>
                  setNewPropertyName(event.currentTarget.value)
                }
                onPressEnter={addProperty}
              />
            </Form.Item>
          </Col>
          <Col md={1} xs={4}>
            <Tooltip title='Add property'>
              <Button
                aria-label='Add property'
                disabled={addPropertyDisabled}
                icon={<PlusOutlined />}
                onClick={addProperty}
                shape='circle'
                size='small'
              />
            </Tooltip>
          </Col>
        </Row>
        {newPropertyName && propertyNameError ? (
          <Typography.Text
            className='jsonforms-additional-properties-error'
            type='danger'
          >
            {propertyNameError}
          </Typography.Text>
        ) : null}
        <Flex
          className='jsonforms-additional-properties-list'
          vertical
          gap='middle'
        >
          {additionalPropertyItems.map((item) => {
            return (
              <Flex
                align='start'
                className='jsonforms-additional-property'
                key={item.propertyName}
                vertical
              >
                <Flex
                  align='center'
                  justify='space-between'
                  style={{ width: '100%' }}
                >
                  <Typography.Text strong>{item.propertyName}</Typography.Text>
                  {enabled ? (
                    <AntdAdditionalPropertyActions
                      deleteDisabled={
                        removePropertyDisabled ||
                        Boolean(
                          restrict &&
                            objectSchema.required?.includes(item.propertyName)
                        )
                      }
                      name={item.propertyName}
                      onDelete={() => removeProperty(item.propertyName)}
                      onRename={() => {
                        setRenamingPropertyName(item.propertyName);
                        setRenameValue(item.propertyName);
                      }}
                      readonly={readonly}
                    />
                  ) : null}
                </Flex>
                <div
                  className='jsonforms-additional-property-control'
                  style={{ width: '100%' }}
                >
                  <JsonFormsDispatch
                    schema={item.schema}
                    uischema={item.uischema}
                    path={item.path}
                    enabled={enabled}
                    renderers={renderers}
                    cells={cells}
                    readonly={readonly}
                  />
                </div>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
      <AntdAdditionalPropertyRenameDialog
        disabled={
          !enabled ||
          Boolean(readonly) ||
          Boolean(renameError) ||
          !renameValue.trim() ||
          renameValue.trim() === renamingPropertyName
        }
        error={renameError}
        oldName={renamingPropertyName}
        onCancel={closeRename}
        onChange={setRenameValue}
        onRename={() => {
          if (renamingPropertyName) renameProperty(renamingPropertyName);
        }}
        value={renameValue}
      />
    </Card>
  );
};
