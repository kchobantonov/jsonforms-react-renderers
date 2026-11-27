import {
  useCompositeDraft,
  type CompositeDetailDialogProps,
} from '@chobantonov/jsonforms-react-renderer-common/cells/useCompositeDraft';
export type { CompositeDetailDialogOptions } from '@chobantonov/jsonforms-react-renderer-common/cells/useCompositeDraft';
import { DetailModal } from '../complex/DetailModal';
import React from 'react';
import { Button, Tooltip } from 'antd';
import { JsonFormsContext } from '@jsonforms/react';
import { CellModeProvider } from '../util/cellMode';
import { PendingChangesProvider } from '../util/pendingChanges';

/**
 * A detail dialog that edits an isolated copy of the form state, so nothing
 * reaches the form until Apply. Ported from the Svelte renderers'
 * `useDetailDialog`.
 *
 * The whole core is cloned rather than just the value at `path`, so `$ref`s
 * into the root schema and rules that read other parts of the data still
 * resolve while the dialog is open. Only writes are redirected: dispatch is
 * replaced with one that accepts UPDATE_DATA inside `path` and drops
 * everything else.
 */
export const CompositeDetailDialog = (props: CompositeDetailDialogProps) => {
  const { open, title, label, options, t, children } = props;
  const dialog = useCompositeDraft(props);

  const footer = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
      {options.showEmptyButton === true && (
        <Tooltip
          title={t(
            'composite.emptyTooltip',
            dialog.defaultMessage('composite.emptyTooltip'),
          )}
        >
          <span>
            <Button disabled={!dialog.canEmpty} onClick={dialog.clear}>
              {dialog.buttonLabel(options.emptyLabel, 'composite.empty')}
            </Button>
          </span>
        </Tooltip>
      )}
      <Tooltip
        title={t(
          'composite.cancelTooltip',
          dialog.defaultMessage('composite.cancelTooltip'),
        )}
      >
        <Button onClick={dialog.cancel}>
          {dialog.buttonLabel(options.cancelLabel, 'composite.cancel')}
        </Button>
      </Tooltip>
      <Tooltip
        title={
          dialog.conflicted
            ? t(
                'composite.applyConflict',
                dialog.defaultMessage('composite.applyConflict'),
              )
            : t(
                'composite.applyTooltip',
                dialog.defaultMessage('composite.applyTooltip'),
              )
        }
      >
        <span>
          <Button
            type='primary'
            disabled={!dialog.canApply}
            onClick={dialog.apply}
          >
            {dialog.buttonLabel(options.okLabel, 'composite.apply')}
          </Button>
        </span>
      </Tooltip>
    </div>
  );

  return (
    <DetailModal
      options={options.dialog}
      open={open}
      title={title}
      onCancel={dialog.cancel}
      footer={footer}
      destroyOnHidden
      width={640}
      aria-label={label}
    >
      <JsonFormsContext.Provider value={dialog.context as any}>
        <PendingChangesProvider changes={dialog.pending}>
          {/* the dialog is a normal form: labels, descriptions and inline
              messages all come back */}
          <CellModeProvider value={false}>{children}</CellModeProvider>
        </PendingChangesProvider>
      </JsonFormsContext.Provider>
    </DetailModal>
  );
};
