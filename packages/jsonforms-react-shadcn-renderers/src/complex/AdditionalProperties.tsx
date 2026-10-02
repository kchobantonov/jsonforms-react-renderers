import {
  toObjectSchema,
  hasAdditionalProperties,
  toAdditionalPropertyItem,
} from '@chobantonov/jsonforms-react-renderer-common/additionalProperties';
import { ShadcnIsolatedPropertyEditor } from './IsolatedPropertyEditor';
import {
  needsIsolatedEditor,
  assignOwnProperty,
  validateAdditionalPropertyName,
} from '@chobantonov/jsonforms-react-renderer-common/additionalPropertyName';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import { ErrorIndicator } from './ErrorIndicator';
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
import {
  ControlElement,
  createDefaultValue,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonFormsUISchemaRegistryEntry,
  JsonSchema,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Card } from '@jsonforms-react-shadcn-ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@jsonforms-react-shadcn-ui/dialog';
import { Input } from '@jsonforms-react-shadcn-ui/input';

export type AdditionalPropertiesProps = {
  embedded?: boolean;
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
  const [newPropertyName, setNewPropertyName] = useState('');
  const [renamingPropertyName, setRenamingPropertyName] = useState<
    string | null
  >(null);
  const [renameValue, setRenameValue] = useState('');
  const objectSchema = toObjectSchema(schema);
  const additionalPropertiesTitle =
    typeof objectSchema.additionalProperties === 'object' &&
    typeof objectSchema.additionalProperties.title === 'string'
      ? objectSchema.additionalProperties.title
      : undefined;
  const appliedOptions = { ...(config ?? {}), ...(uischema.options ?? {}) };
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

  const t = useI18n();
  const constraintMessage = useNameConstraintMessage();
  const validatePropertyName = (
    name: string,
    value: any,
    nameSchema: JsonSchema,
    root: JsonSchema,
    currentName?: string
  ) => {
    const result = validateAdditionalPropertyName({
      name,
      data: value,
      schema: nameSchema,
      rootSchema: root,
      currentName,
      allowEmptyName: appliedOptions.allowEmptyPropertyNames === true,
    });
    return (
      constraintMessage(result.errors) ??
      (result.error
        ? t(
            result.error === 'already-defined'
              ? 'additionalProperties.nameTaken'
              : result.error === 'required'
              ? 'additionalProperties.nameRequired'
              : 'additionalProperties.nameInvalid',
            { name }
          )
        : undefined)
    );
  };
  const propertyName = newPropertyName;
  const propertyNameError = validatePropertyName(
    propertyName,
    data,
    schema,
    rootSchema
  );
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
    (appliedOptions.restrict && maxPropertiesReached) ||
    Boolean(propertyNameError);
  const removePropertyDisabled =
    !enabled || readonly || (appliedOptions.restrict && minPropertiesReached);

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
    const trimmed = renameValue;
    const renameError = validatePropertyName(
      trimmed,
      data,
      schema,
      rootSchema,
      propertyToRename
    );
    if (trimmed === propertyToRename) {
      setRenamingPropertyName(null);
      setRenameValue('');
      return;
    }
    if (renameError || !objectData) {
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

  const closeRenameDialog = () => {
    setRenamingPropertyName(null);
    setRenameValue('');
  };

  const renameError = renamingPropertyName
    ? validatePropertyName(
        renameValue,
        data,
        schema,
        rootSchema,
        renamingPropertyName
      )
    : undefined;
  const renameDisabled = !enabled || readonly || Boolean(renameError);

  const propertyErrors = useAdditionalPropertyErrors(path);
  const nameErrors = usePropertyNameErrors(path);
  if (!shouldShow) return null;

  return (
    <PendingChangesProvider changes={page.pending}>
      <>
        <DeleteDialog
          open={deletion.confirming}
          onCancel={deletion.cancel}
          onConfirm={deletion.confirm}
        />
        <Card
          className='jsonforms-additional-properties my-1 min-w-full'
          style={
            embedded
              ? { border: 0, boxShadow: 'none', padding: 0, margin: 0 }
              : undefined
          }
        >
          <div className={embedded ? 'py-2' : 'px-4 py-2'}>
            <div className='flex flex-col gap-2 md:flex-row md:gap-4'>
              {additionalPropertiesTitle ? (
                <div className='md:flex md:h-10 md:items-center md:pt-6'>
                  <span className='text-sm text-foreground'>
                    {additionalPropertiesTitle}
                    {propertyErrors && (
                      <ErrorIndicator local errors={propertyErrors} />
                    )}
                  </span>
                </div>
              ) : null}
              <div className='min-w-0 flex-1'>
                <label
                  className='mb-1 block text-sm font-medium text-foreground'
                  htmlFor='shadcn-additional-property-name'
                >
                  Property Name
                </label>
                <div className='relative pr-12'>
                  <Input
                    id='shadcn-additional-property-name'
                    className='shadcn-jsonforms-input'
                    aria-label={
                      label ? `Add property to ${label}` : 'Add property'
                    }
                    aria-invalid={
                      newPropertyName !== '' && Boolean(propertyNameError)
                    }
                    disabled={!enabled || readonly}
                    type='text'
                    value={newPropertyName}
                    onChange={(event) =>
                      setNewPropertyName(event.currentTarget.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        addProperty();
                      }
                    }}
                  />
                  <Button
                    className='absolute right-0 top-0 h-10 w-10 shrink-0'
                    disabled={addPropertyDisabled}
                    size='icon'
                    type='button'
                    aria-label='Add property'
                    title='Add property'
                    onClick={addProperty}
                  >
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>
                {newPropertyName !== '' && propertyNameError ? (
                  <div
                    className='jsonforms-additional-properties-error mt-1 text-sm text-destructive'
                    role='alert'
                  >
                    {propertyNameError}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div
            className={`jsonforms-additional-properties-list flex flex-col gap-2${
              embedded ? '' : ' px-4'
            }`}
          >
            {page.indices
              .map((index) => additionalPropertyItems[index])
              .map((item) => (
                <div
                  className='jsonforms-additional-property relative'
                  key={item.propertyName}
                >
                  <div className='flex min-h-6 items-center justify-between gap-2 mb-2'>
                    <span className='min-w-0 text-sm font-medium'>
                      {item.propertyName || '\u00a0'}
                    </span>
                    {enabled ? (
                      <div className='jsonforms-additional-property-actions flex shrink-0 items-center gap-0.5'>
                        <Button
                          className='h-6 w-6 text-muted-foreground [&_svg]:size-3'
                          variant='ghost'
                          size='icon'
                          disabled={readonly}
                          type='button'
                          aria-label={`Rename ${item.propertyName}`}
                          title={`Rename ${item.propertyName}`}
                          onClick={() => {
                            setRenamingPropertyName(item.propertyName);
                            setRenameValue(item.propertyName);
                          }}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          className='h-6 w-6 bg-destructive/10 text-destructive hover:bg-destructive/20 [&_svg]:size-3'
                          variant='destructive'
                          size='icon'
                          disabled={removePropertyDisabled}
                          type='button'
                          aria-label={`Delete ${item.propertyName}`}
                          title={`Delete ${item.propertyName}`}
                          onClick={() => removeProperty(item.propertyName)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {nameErrors.get(item.propertyName) && (
                    <div className='flex min-h-6 items-center gap-1 pr-16 text-sm font-medium text-destructive'>
                      <ErrorIndicator
                        local
                        errors={nameErrors.get(item.propertyName)!}
                      />
                    </div>
                  )}
                  <div className='jsonforms-additional-property-control min-w-0'>
                    {needsIsolatedEditor(item.propertyName) ? (
                      <>
                        <ShadcnIsolatedPropertyEditor
                          value={objectData?.[item.propertyName]}
                          schema={item.schema}
                          uischema={{
                            type: 'Control',
                            scope: '#',
                            label: false,
                          }}
                          enabled={Boolean(enabled)}
                          readonly={readonly}
                          renderers={renderers}
                          cells={cells}
                          onChange={(value) =>
                            handleChange(
                              path,
                              assignOwnProperty(
                                { ...objectData },
                                item.propertyName,
                                value
                              )
                            )
                          }
                        />
                      </>
                    ) : (
                      <JsonFormsDispatch
                        schema={item.schema}
                        uischema={{ ...item.uischema, label: false } as any}
                        path={item.path}
                        enabled={enabled}
                        renderers={renderers}
                        cells={cells}
                        readonly={readonly}
                      />
                    )}
                  </div>
                </div>
              ))}
          </div>
          <div className={embedded ? undefined : 'px-4 pb-4'}>
            <CollectionPager page={page} />
          </div>
        </Card>

        <Dialog
          open={renamingPropertyName !== null}
          onOpenChange={(dialogOpen) => {
            if (!dialogOpen) closeRenameDialog();
          }}
        >
          <DialogContent className='max-w-sm'>
            <DialogHeader>
              <DialogTitle>Rename property</DialogTitle>
              <DialogDescription>
                Change the property name without changing its value.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (renamingPropertyName) {
                  renameProperty(renamingPropertyName);
                }
              }}
            >
              <label
                className='mb-2 block text-sm font-medium'
                htmlFor='shadcn-rename-property'
              >
                Property Name
              </label>
              <Input
                id='shadcn-rename-property'
                autoFocus
                disabled={readonly}
                value={renameValue}
                aria-invalid={Boolean(renameError)}
                onChange={(event) => setRenameValue(event.currentTarget.value)}
              />
              {renameError ? (
                <p className='mt-2 text-sm text-destructive' role='alert'>
                  {renameError}
                </p>
              ) : null}
              <DialogFooter className='mt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={closeRenameDialog}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={renameDisabled}>
                  Rename
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    </PendingChangesProvider>
  );
};
