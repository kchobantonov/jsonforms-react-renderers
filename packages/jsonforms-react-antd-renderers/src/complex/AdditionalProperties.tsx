import { renamePropertyKey } from '@chobantonov/jsonforms-react-renderer-common/objects/additionalProperties';
import {
  useAdditionalPropertyEntries,
  useAdditionalPropertyActions,
  type AdditionalPropertiesProps,
} from '@chobantonov/jsonforms-react-renderer-common/objects/useAdditionalPropertyEntries';
import { ValidationIcon } from './ValidationIcon';
import {
  useNameConstraintMessage,
  usePropertyNameErrors,
  useAdditionalPropertyErrors,
} from '@chobantonov/jsonforms-react-renderer-common/validation/errorSummary';
import { DeleteDialog } from './DeleteDialog';
import { PendingChangesProvider } from '@chobantonov/jsonforms-react-renderer-common/interaction/pendingChanges';
import { CollectionPager } from './CollectionPager';
import { DynamicPropertyProvider } from '@chobantonov/jsonforms-react-renderer-common/objects/dynamicProperties';

import type { JsonSchema } from '@jsonforms/core';
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
import React, { useState } from 'react';
import { useI18n } from '../util/translate';
import {
  AdditionalPropertyNameError,
  AdditionalPropertyNameResult,
  assignOwnProperty,
  needsIsolatedEditor,
  validateAdditionalPropertyName,
} from '../util/additionalPropertyName';
import { IsolatedPropertyEditor } from '@chobantonov/jsonforms-react-renderer-common/objects/IsolatedPropertyEditor';
import { literalPropertySchema } from '../util/literalPropertySchema';
import { AntdAdditionalPropertyActions } from './additionalProperties/AntdAdditionalPropertyActions';
import { AntdAdditionalPropertyRenameDialog } from './additionalProperties/AntdAdditionalPropertyRenameDialog';

export type { AdditionalPropertiesProps } from '@chobantonov/jsonforms-react-renderer-common/objects/useAdditionalPropertyEntries';

export const AdditionalProperties = (props: AdditionalPropertiesProps) => {
  const {
    embedded = false,
    cells,

    data,
    enabled,
    handleChange,
    label,
    path,
    readonly,
    renderers,
    rootSchema,
    schema,
  } = props;
  const context = useJsonForms();
  const [newPropertyName, setNewPropertyName] = useState('');
  const [renamingPropertyName, setRenamingPropertyName] = useState<
    string | null
  >(null);
  const t = useI18n();
  const [renameValue, setRenameValue] = useState('');
  const entries = useAdditionalPropertyEntries(props);
  const {
    objectSchema,
    appliedOptions,
    objectData,
    reservedPropertyNames,
    page,
    additionalPropertyItems,
    shouldShow,
  } = entries;
  const restrict = appliedOptions.restrict !== false;
  const allowEmptyPropertyNames =
    appliedOptions.allowEmptyPropertyNames === true;

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
    name: string,
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
      },
    );
    return result.error === undefined
      ? undefined
      : (constraintMessage(result.errors) ??
          nameMessage(result.error, result.name));
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
  const {
    addPropertyDisabled,
    removePropertyDisabled,
    deletion,
    addProperty,
    removeProperty,
  } = useAdditionalPropertyActions(props, entries, {
    restrict,
    propertyName,
    propertyNameError,
    setNewPropertyName,
  });
  const renameProperty = (propertyToRename: string) => {
    const nextName = renameValue;
    const renameError = validateName(nextName, propertyToRename);
    if (renameError || nextName === propertyToRename || !objectData) {
      return;
    }

    // Rebuilt in order, so renaming does not move the property to the end.
    const updatedData = renamePropertyKey(
      objectData,
      propertyToRename,
      nextName,
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
            gap='middle'
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
                const actions = enabled ? (
                  <AntdAdditionalPropertyActions
                    deleteDisabled={
                      removePropertyDisabled ||
                      Boolean(
                        restrict &&
                        objectSchema.required?.includes(item.propertyName),
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
                    {
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
                    }
                    <div
                      className='jsonforms-additional-property-control'
                      style={{ width: '100%' }}
                    >
                      {isolated ? (
                        <IsolatedPropertyEditor
                          cells={cells}
                          enabled={Boolean(enabled)}
                          onChange={(next) =>
                            handleChange(
                              path,
                              assignOwnProperty(
                                { ...objectData },
                                item.propertyName,
                                next,
                              ),
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
                            rootSchema,
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
                              item.propertyName,
                            )
                              ? objectData[item.propertyName]
                              : undefined
                          }
                        />
                      ) : (
                        <DynamicPropertyProvider path={item.path}>
                          <JsonFormsDispatch
                            schema={item.schema}
                            uischema={{ ...item.uischema, label: false } as any}
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
