import React from 'react';
import { type ControlElement, UPDATE_DATA } from '@jsonforms/core';
import { JsonFormsContext, JsonFormsDispatch } from '@jsonforms/react';
import { useTupleField, type TupleFieldBehaviorProps } from './useTupleField';
import { compositeSummary } from '../cells/compositeSummary';
import type { CompositeDetailDialogProps } from '../cells/useCompositeDraft';

export interface TupleFieldProps extends TupleFieldBehaviorProps {
  options: Record<string, any>;
}

interface TupleFieldPresentation {
  CompositeDetailDialog: React.ComponentType<CompositeDetailDialogProps>;
  gap: number;
  legendStyle: React.CSSProperties;
  renderEditButton: (
    label: string,
    disabled: boolean,
    open: () => void,
  ) => React.ReactNode;
  renderError: (message: string, draft: boolean) => React.ReactNode;
}

export function TupleField(props: TupleFieldProps & TupleFieldPresentation) {
  const {
    schema,
    index,
    uischema,
    enabled,
    options,
    CompositeDetailDialog,
    gap,
    legendStyle,
    renderEditButton,
    renderError,
  } = props;
  const {
    t,
    translator,
    i18nDefault,
    open,
    setOpen,
    message,
    path,
    value,
    renderSchema,
    complex,
    ownsLabel,
    label,
    intercept,
    scoped,
    detail,
  } = useTupleField(props);
  const dialogOptions = {
    ...options,
    ...uischema.options,
  };

  const body = () => {
    if (schema === false) {
      return renderError(t('tuple.forbidden'), false);
    }
    if (complex) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap,
          }}
        >
          <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
            {compositeSummary(
              value,
              uischema.options?.summary as ControlElement | undefined,
              renderSchema.title,
              translator,
              i18nDefault,
            )}
          </span>
          {renderEditButton(t('composite.edit', { label }), !enabled, () =>
            setOpen(true),
          )}
          <CompositeDetailDialog
            open={open}
            title={renderSchema.title ?? label}
            label={label}
            path={path}
            schema={renderSchema}
            enabled={enabled}
            options={dialogOptions}
            t={translator}
            onClose={() => setOpen(false)}
            onApply={(applied) =>
              intercept({
                type: UPDATE_DATA,
                path,
                updater: () => applied,
              })
            }
          >
            <JsonFormsDispatch
              schema={renderSchema}
              uischema={detail}
              path={path}
              enabled={enabled}
            />
          </CompositeDetailDialog>
        </div>
      );
    }
    return (
      <JsonFormsDispatch
        schema={renderSchema}
        // The label is drawn by the fieldset legend when this position owns it,
        // so the delegated control must not draw it again.
        uischema={
          ownsLabel
            ? ({ ...uischema, label: false } as ControlElement)
            : uischema
        }
        path={path}
        enabled={enabled}
      />
    );
  };

  return (
    <JsonFormsContext.Provider value={scoped}>
      <fieldset
        data-tuple-field={index}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0, flex: '1 1 0' }}
      >
        {ownsLabel && (
          <legend
            style={{
              display: 'block',
              width: '100%',
              ...legendStyle,
            }}
          >
            {label}
          </legend>
        )}
        {body()}
        {message && renderError(message, true)}
      </fieldset>
    </JsonFormsContext.Provider>
  );
}
