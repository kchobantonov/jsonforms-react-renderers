import { renamePropertyKey } from '@chobantonov/jsonforms-react-renderer-common/objects/additionalProperties';
import {
  useAdditionalPropertyEntries,
  useAdditionalPropertyActions,
  type AdditionalPropertiesProps,
} from '@chobantonov/jsonforms-react-renderer-common/objects/useAdditionalPropertyEntries';

import { IsolatedPropertyEditor } from '@chobantonov/jsonforms-react-renderer-common/objects/IsolatedPropertyEditor';
import {
  needsIsolatedEditor,
  assignOwnProperty,
  validateAdditionalPropertyName,
} from '@chobantonov/jsonforms-react-renderer-common/objects/additionalPropertyName';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import { ErrorIndicator } from './ErrorIndicator';
import {
  useNameConstraintMessage,
  usePropertyNameErrors,
  useAdditionalPropertyErrors,
} from '@chobantonov/jsonforms-react-renderer-common/validation/errorSummary';
import { DeleteDialog } from './DeleteDialog';
import { PendingChangesProvider } from '@chobantonov/jsonforms-react-renderer-common/interaction/pendingChanges';
import { CollectionPager } from './CollectionPager';
import type { JsonSchema } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
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
  const [newPropertyName, setNewPropertyName] = useState('');
  const [renamingPropertyName, setRenamingPropertyName] = useState<
    string | null
  >(null);
  const [renameValue, setRenameValue] = useState('');
  const entries = useAdditionalPropertyEntries(props);
  const {
    objectSchema,
    appliedOptions,
    objectData,
    page,
    additionalPropertyItems,
    shouldShow,
  } = entries;
  const additionalPropertiesTitle =
    typeof objectSchema.additionalProperties === 'object' &&
    typeof objectSchema.additionalProperties.title === 'string'
      ? objectSchema.additionalProperties.title
      : undefined;

  const t = useI18n();
  const constraintMessage = useNameConstraintMessage();
  const validatePropertyName = (
    name: string,
    value: any,
    nameSchema: JsonSchema,
    root: JsonSchema,
    currentName?: string,
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
            { name },
          )
        : undefined)
    );
  };
  const propertyName = newPropertyName;
  const propertyNameError = validatePropertyName(
    propertyName,
    data,
    schema,
    rootSchema,
  );
  const {
    addPropertyDisabled,
    removePropertyDisabled,
    deletion,
    addProperty,
    removeProperty,
  } = useAdditionalPropertyActions(props, entries, {
    restrict: Boolean(appliedOptions.restrict),
    propertyName,
    propertyNameError,
    setNewPropertyName,
  });
  const renameProperty = (propertyToRename: string) => {
    const trimmed = renameValue;
    const renameError = validatePropertyName(
      trimmed,
      data,
      schema,
      rootSchema,
      propertyToRename,
    );
    if (trimmed === propertyToRename) {
      setRenamingPropertyName(null);
      setRenameValue('');
      return;
    }
    if (renameError || !objectData) {
      return;
    }

    const updatedData = renamePropertyKey(
      objectData,
      propertyToRename,
      trimmed,
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
        renamingPropertyName,
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
                    <span
                      data-property-name-label={item.propertyName}
                      className={`inline-flex min-w-0 items-center gap-1 text-sm font-medium ${
                        nameErrors.has(item.propertyName)
                          ? 'text-destructive'
                          : ''
                      }`}
                    >
                      <span className='min-w-0 break-all'>
                        {item.propertyName || '\u00a0'}
                      </span>
                      {nameErrors.get(item.propertyName) && (
                        <ErrorIndicator
                          local
                          errors={nameErrors.get(item.propertyName)!}
                        />
                      )}
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
                  <div className='jsonforms-additional-property-control min-w-0'>
                    {needsIsolatedEditor(item.propertyName) ? (
                      <>
                        <IsolatedPropertyEditor
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
                                value,
                              ),
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
              <DialogTitle>{t('additionalProperties.renameTitle')}</DialogTitle>
              <DialogDescription>
                {t('additionalProperties.renameDialogDescription')}
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
                {t('additionalProperties.renamePropertyNameLabel')}
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
                  {t('combinator.cancel')}
                </Button>
                <Button type='submit' disabled={renameDisabled}>
                  {t('additionalProperties.renameConfirm')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    </PendingChangesProvider>
  );
};
