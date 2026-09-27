import {
  ArrayLayoutProps,
  ArrayTranslations,
  optionIs,
  RankedTester,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
  Resolve,
} from '@jsonforms/core';
import {
  withArrayTranslationProps,
  withJsonFormsArrayLayoutProps,
  withTranslateProps,
  useJsonForms,
} from '@jsonforms/react';
import React, { useCallback, useState } from 'react';
import { shouldConfirm } from '../util/confirmation';
import { DeleteDialog } from './DeleteDialog';
import { TableControl } from './TableControl';

export const ArrayControlRenderer = (
  props: ArrayLayoutProps & { translations: ArrayTranslations }
) => {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(undefined);
  const [rowData, setRowData] = useState(undefined);
  const { removeItems, visible, translations } = props;

  /*
    This table used to confirm unconditionally, which the gap review noted
    "matches by accident" - it happened to agree with the `always` fallback but
    could not be configured, so `confirmation: { delete: "never" }` did nothing.
    The prompt is now the policy's decision, and the dialog below is only opened
    when the policy asks for one.
  */
  const ctx = useJsonForms();
  const confirmDelete = useCallback(
    (p: string, rowIndex: number) => {
      const parent = p.substring(0, p.lastIndexOf('.'));
      /*
        `p` is the *row's* path, and `props.data` on an array control is the
        item **count**, not the array - so the row has to be read from the
        form's own data. Taking it from `props.data` yielded `undefined`, and a
        policy told nothing was being discarded does not prompt: the table
        silently lost the confirmation it used to have.
      */
      const discarded = [Resolve.data(ctx.core?.data, p)];
      if (
        shouldConfirm(
          {
            options: props.uischema?.options,
            config: props.config,
            catalogId: 'arrayTable',
            operation: 'delete',
          },
          discarded
        )
      ) {
        setOpen(true);
        setPath(p);
        setRowData(rowIndex);
        return;
      }
      removeItems(parent, [rowIndex])();
    },
    [ctx.core?.data, props.config, props.uischema, removeItems]
  );
  const openDeleteDialog = confirmDelete;
  const deleteCancel = useCallback(() => setOpen(false), [setOpen]);
  const deleteConfirm = useCallback(() => {
    const p = path.substring(0, path.lastIndexOf('.'));
    removeItems(p, [rowData])();
    setOpen(false);
  }, [setOpen, path, rowData]);

  if (!visible) {
    return null;
  }

  return (
    <>
      <TableControl
        {...props}
        openDeleteDialog={openDeleteDialog}
        translations={translations}
      />
      <DeleteDialog
        open={open}
        onCancel={deleteCancel}
        onConfirm={deleteConfirm}
        acceptText={translations.deleteDialogAccept}
        declineText={translations.deleteDialogDecline}
        title={translations.deleteDialogTitle}
        message={translations.deleteDialogMessage}
      />
    </>
  );
};

const supportedArray = or(isObjectArrayControl, isPrimitiveArrayControl);
const defaultTableTester = rankWith(3, supportedArray);
/**
 * Nested objects/arrays make isObjectArrayWithNesting true, so the detail
 * renderer (rank 4) normally wins. `table: true` (or `format: 'table'`) opts a
 * composite array back into the table, where the `cells` option decides how
 * each composite column is summarised.
 */
const forcedTableTester = rankWith(
  5,
  or(optionIs('table', true), optionIs('format', 'table'))
);

export const arrayControlTester: RankedTester = (uischema, schema, context) =>
  supportedArray(uischema, schema, context)
    ? Math.max(
        defaultTableTester(uischema, schema, context),
        forcedTableTester(uischema, schema, context)
      )
    : -1;

export default withJsonFormsArrayLayoutProps(
  withTranslateProps(withArrayTranslationProps(ArrayControlRenderer))
);
