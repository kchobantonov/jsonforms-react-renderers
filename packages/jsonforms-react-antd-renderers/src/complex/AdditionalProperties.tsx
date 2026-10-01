import { ValidationIcon } from './ValidationIcon';
import {
  useNameConstraintMessage,
  usePropertyNameErrors,
  useAdditionalPropertyErrors,
} from '@chobantonov/jsonforms-react-renderer-common/errorSummary';
import { useCollectionDelete } from '@chobantonov/jsonforms-react-renderer-common/useCollectionDelete';
import { DeleteDialog } from './DeleteDialog';
import { PendingChangesProvider } from '@chobantonov/jsonforms-react-renderer-common/pendingChanges';
import { useCollectionPagination } from '@chobantonov/jsonforms-react-renderer-common/collectionPagination';
import { CollectionPager } from './CollectionPager';
import { DynamicPropertyProvider } from '@chobantonov/jsonforms-react-renderer-common/dynamicProperties';
import {
  toObjectSchema,
  hasAdditionalProperties,
  toAdditionalPropertyItem,
} from '@chobantonov/jsonforms-react-renderer-common/additionalProperties';
import {
  ControlElement,
  createDefaultValue,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonFormsUISchemaRegistryEntry,
  JsonSchema,
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
import { useI18n } from '../util/translate';
import {
  AdditionalPropertyNameError,
  AdditionalPropertyNameResult,
  assignOwnProperty,
  needsIsolatedEditor,
  validateAdditionalPropertyName,
} from '../util/additionalPropertyName';
import { AntdIsolatedPropertyEditor } from './additionalProperties/AntdIsolatedPropertyEditor';
import { literalPropertySchema } from '../util/literalPropertySchema';
import { AntdAdditionalPropertyActions } from './additionalProperties/AntdAdditionalPropertyActions';
import { AntdAdditionalPropertyRenameDialog } from './additionalProperties/AntdAdditionalPropertyRenameDialog';

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
  embedded?: boolean;
};

export const AdditionalProperties = ({
  embedded = false,
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
  const t = useI18n();
  const [renameValue, setRenameValue] = useState('');
  const objectSchema = toObjectSchema(schema);
  const appliedOptions = { ...(config ?? {}), ...(uischema.options ?? {}) };
  const restrict = appliedOptions.restrict !== false;
  /*
    Section 18: defaults to false, available in global config and
    `uischema.options`, and "an explicitly supplied UI-schema option overrides
    global config, including `false` overriding `true`" - which the element-over
    -config spread above already gives, because only `undefined` falls through.
  */
  const allowEmptyPropertyNames =
    appliedOptions.allowEmptyPropertyNames === true;
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
  const page = useCollectionPagination(
    additionalKeys,
    uischema.options?.additionalProperties?.pagination,
    config,
    'additionalProperties'
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

  // Exactly as typed. Trimming here would store `"a"` for `"  a  "`, and with
  // empty names permitted it would erase a whitespace-only key entirely.
  const propertyName = newPropertyName;
  /*
    One message per reason, all through the translator.

    Only the schema refuses a name now. A dot or an empty name is accepted and
    routed to an isolated editor rather than rejected, because a property that
    no data path can address is still perfectly legal data - see Adjustment 14.
  */
  const nameMessage = (
    error: AdditionalPropertyNameError,
    name: string
  ): string => {
    switch (error) {
      case 'required':
        return t('additionalProperties.nameRequired');
      case 'already-defined':
        return t('additionalProperties.nameTaken', { name });
      default:
        return t('additionalProperties.nameInvalid', { name });
    }
  };
  const constraintMessage = useNameConstraintMessage();
  const ajv = context.core?.ajv;
  const validateName = (name: string, currentName?: string) => {
    const result: AdditionalPropertyNameResult = validateAdditionalPropertyName(
      {
        name,
        schema,
        rootSchema,
        data,
        currentName,
        disallowedNames: reservedPropertyNames,
        allowEmptyName: allowEmptyPropertyNames,
        validate: ajv
          ? (nameSchema, value) => ajv.validate(nameSchema, value)
          : undefined,
      }
    );
    return result.error === undefined
      ? undefined
      : constraintMessage(result.errors) ??
          nameMessage(result.error, result.name);
  };
  const propertyNameError = validateName(propertyName);
  /*
    Section 18's draft rule: an exactly empty name input "must not show inline
    name-validation errors on initial load or after it is cleared or reset,
    including an empty-name collision when `allowEmptyPropertyNames` is
    enabled". Suppressing the message must not suppress the judgement, so Add
    still consults `propertyNameError` below.
  */
  const showPropertyNameError =
    newPropertyName !== '' && Boolean(propertyNameError);
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
    Boolean(propertyNameError);
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

    assignOwnProperty(
      updatedData,
      propertyName,
      createDefaultValue(additionalProperty.schema, rootSchema)
    );
    handleChange(path, updatedData);
    setNewPropertyName('');
  };

  const deletion = useCollectionDelete<string>({
    data: objectData,
    identity: path,
    catalogId: 'additionalProperties',
    options: uischema.options,
    config,
    canRemove: (key) =>
      !removePropertyDisabled &&
      !appliedOptions.disableRemove &&
      !!objectData &&
      Object.prototype.hasOwnProperty.call(objectData, key) &&
      !reservedPropertyNames.includes(key) &&
      !(
        appliedOptions.restrict !== false &&
        objectSchema.required?.includes(key)
      ),
    value: (key) => objectData?.[key],
    remove: (key) => {
      const updatedData = { ...objectData };
      delete updatedData[key];
      handleChange(path, updatedData);
    },
  });
  const removeProperty = deletion.request;

  const renameProperty = (propertyToRename: string) => {
    const nextName = renameValue;
    const renameError = validateName(nextName, propertyToRename);
    if (renameError || nextName === propertyToRename || !objectData) {
      return;
    }

    // Rebuilt in order, so renaming does not move the property to the end.
    const updatedData = Object.entries(objectData).reduce(
      (result, [key, value]) =>
        assignOwnProperty(
          result,
          key === propertyToRename ? nextName : key,
          value
        ),
      {} as Record<string, unknown>
    );
    handleChange(path, updatedData);
    setRenamingPropertyName(null);
    setRenameValue('');
  };

  const renameError =
    renamingPropertyName === null
      ? undefined
      : validateName(renameValue, renamingPropertyName);
  const closeRename = () => {
    setRenamingPropertyName(null);
    setRenameValue('');
  };

  const propertyErrors = useAdditionalPropertyErrors(path);
  const nameErrors = usePropertyNameErrors(path);
  if (!shouldShow) return null;

  return (
    <PendingChangesProvider changes={page.pending}>
      <Card
        className='jsonforms-additional-properties'
        size='small'
        variant={embedded ? 'borderless' : 'outlined'}
        styles={embedded ? { body: { padding: 0 } } : undefined}
      >
        <DeleteDialog
          open={deletion.confirming}
          onCancel={deletion.cancel}
          onConfirm={deletion.confirm}
        />
        <Flex vertical gap='middle'>
          <Row align='bottom' gutter={[12, 8]}>
            <Col md={5} xs={24}>
              <Typography.Text>
                {t('additionalProperties.title')}
                {propertyErrors && (
                  <ValidationIcon
                    local
                    errorMessages={propertyErrors}
                    id={`${path}-additional-property-errors`}
                  />
                )}
              </Typography.Text>
            </Col>
            <Col md={18} xs={20}>
              <Form.Item
                label={t('additionalProperties.namePlaceholder')}
                validateStatus={showPropertyNameError ? 'error' : undefined}
                style={{ marginBottom: 0 }}
              >
                <Input
                  aria-label={
                    label
                      ? t('additionalProperties.addTo', { label })
                      : t('additionalProperties.add')
                  }
                  disabled={!enabled || readonly}
                  placeholder={t('additionalProperties.namePlaceholder')}
                  value={newPropertyName}
                  onChange={(event) =>
                    setNewPropertyName(event.currentTarget.value)
                  }
                  onPressEnter={addProperty}
                />
              </Form.Item>
            </Col>
            <Col md={1} xs={4}>
              <Tooltip title={t('additionalProperties.add')}>
                <Button
                  aria-label={t('additionalProperties.add')}
                  disabled={addPropertyDisabled}
                  icon={<PlusOutlined />}
                  onClick={addProperty}
                  shape='circle'
                  size='small'
                />
              </Tooltip>
            </Col>
          </Row>
          {showPropertyNameError ? (
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
            gap={0}
          >
            {page.indices
              .map((index) => additionalPropertyItems[index])
              .map((item) => {
                /*
              A name a data path cannot address - empty, or containing a dot -
              is edited in a form of its own. The row keeps the heading and the
              actions in that case, because the isolated editor draws no label.
            */
                const isolated = needsIsolatedEditor(item.propertyName);
                const rendersOwnHeading =
                  !isolated &&
                  !nameErrors.has(item.propertyName) &&
                  !(
                    typeof item.schema === 'object' &&
                    item.schema.type === 'object'
                  );
                const actions = enabled ? (
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
                ) : null;
                return (
                  <Flex
                    align='start'
                    className='jsonforms-additional-property'
                    key={item.propertyName}
                    style={{ position: 'relative', width: '100%' }}
                    vertical
                  >
                    {rendersOwnHeading ? (
                      actions || nameErrors.get(item.propertyName) ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'nowrap',
                            gap: 4,
                            insetInlineEnd: 0,
                            position: 'absolute',
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          {nameErrors.get(item.propertyName) && (
                            <ValidationIcon
                              local
                              errorMessages={nameErrors.get(item.propertyName)!}
                              id={`${item.path}-name-errors`}
                            />
                          )}
                          {actions}
                        </div>
                      ) : null
                    ) : (
                      <Flex
                        align='center'
                        justify='space-between'
                        style={{ width: '100%' }}
                      >
                        {/*
                      Section 18: an empty name "has a visually blank label. Do
                      not display the literal text `""` as a substitute name."
                      The non-breaking space keeps the row its normal height so
                      Rename and Delete stay above the value input rather than
                      dropping into a row of their own.
                    */}
                        <Flex align='center' gap={4}>
                          <Typography.Text
                            type={
                              nameErrors.has(item.propertyName)
                                ? 'danger'
                                : undefined
                            }
                            strong
                            data-property-name={item.propertyName}
                          >
                            {item.propertyName === ''
                              ? '\u00a0'
                              : item.propertyName}
                          </Typography.Text>
                          {nameErrors.get(item.propertyName) && (
                            <ValidationIcon
                              local
                              errorMessages={nameErrors.get(item.propertyName)!}
                              id={`${item.path}-name-errors`}
                            />
                          )}
                        </Flex>
                        {actions}
                      </Flex>
                    )}
                    <div
                      className='jsonforms-additional-property-control'
                      style={{ width: '100%' }}
                    >
                      {isolated ? (
                        <AntdIsolatedPropertyEditor
                          cells={cells}
                          enabled={Boolean(enabled)}
                          onChange={(next) =>
                            handleChange(
                              path,
                              assignOwnProperty(
                                { ...(objectData ?? {}) },
                                item.propertyName,
                                next
                              )
                            )
                          }
                          readonly={readonly}
                          renderers={renderers}
                          /*
                        Rebundled, so a local `$ref` inside this property's
                        schema still resolves once the value is its own
                        document. See `literalPropertySchema`.
                      */
                          schema={literalPropertySchema(
                            item.schema as JsonSchema,
                            rootSchema
                          )}
                          uischema={{
                            type: 'Control',
                            scope: '#',
                            label: false,
                          }}
                          value={
                            objectData &&
                            Object.prototype.hasOwnProperty.call(
                              objectData,
                              item.propertyName
                            )
                              ? objectData[item.propertyName]
                              : undefined
                          }
                        />
                      ) : (
                        <DynamicPropertyProvider path={item.path}>
                          <JsonFormsDispatch
                            schema={item.schema}
                            uischema={
                              nameErrors.has(item.propertyName)
                                ? ({ ...item.uischema, label: false } as any)
                                : item.uischema
                            }
                            path={item.path}
                            enabled={enabled}
                            renderers={renderers}
                            cells={cells}
                            readonly={readonly}
                          />
                        </DynamicPropertyProvider>
                      )}
                    </div>
                  </Flex>
                );
              })}
          </Flex>
          <CollectionPager page={page} />
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
    </PendingChangesProvider>
  );
};
