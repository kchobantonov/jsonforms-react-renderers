import React, { useCallback, useRef, useState } from 'react';
import { Modal } from 'antd';
import { useI18n } from './translate';
import {
  ConfirmationCatalogId,
  ConfirmationOperation,
  resolveConfirmationPolicy,
  confirmationRequired,
} from './confirmation';

export interface ConfirmRequest {
  operation: ConfirmationOperation;
  catalogId: ConfirmationCatalogId;
  /** The values this action would discard. Empty means nothing is lost. */
  discarded: unknown[];
  options?: Record<string, unknown>;
  config?: unknown;
  /**
   * Performed on confirmation, or immediately when the policy does not prompt.
   *
   * Section 14: "confirmation performs the operation once, after rechecking
   * mutation guards and its target", so this closure re-reads what it needs
   * rather than capturing a decision made before the dialog opened.
   */
  perform: () => void;
}

const TITLES = {
  delete: 'confirm.delete.title',
  typeChange: 'confirm.typeChange.title',
  branchChange: 'confirm.branchChange.title',
} as const;

const MESSAGES = {
  delete: 'confirm.delete.message',
  typeChange: 'confirm.typeChange.message',
  branchChange: 'confirm.branchChange.message',
} as const;

/**
 * Routes a destructive action through the shared confirmation policy.
 *
 * Every covered operation in the renderer set goes through this, so the policy
 * is resolved in one place and the dialog reads the same wherever it appears.
 * A renderer that prompted on its own before now asks here instead - which is
 * what makes `confirmation: { delete: "never" }` able to switch it off, and
 * what stopped array tables confirming by accident rather than by policy.
 *
 * Returns `request`, which performs the action immediately when the policy does
 * not prompt, and the dialog element to render.
 */
export const useConfirmation = () => {
  const t = useI18n();
  const [pending, setPending] = useState<ConfirmRequest | undefined>();
  /*
    The action is held in a ref as well as in state, so confirming runs the
    closure that was captured with the request rather than whatever the latest
    render produced. "Do not apply a stale confirmation to an unrelated
    replacement item."
  */
  const pendingRef = useRef<ConfirmRequest | undefined>();

  const request = useCallback((next: ConfirmRequest) => {
    const prompts = confirmationRequired(
      resolveConfirmationPolicy({
        options: next.options,
        config: next.config,
        catalogId: next.catalogId,
        operation: next.operation,
      }),
      next.discarded
    );
    if (!prompts) {
      next.perform();
      return;
    }
    pendingRef.current = next;
    setPending(next);
  }, []);

  const close = useCallback(() => {
    pendingRef.current = undefined;
    setPending(undefined);
  }, []);

  const dialog = pending ? (
    <Modal
      open
      title={t(TITLES[pending.operation])}
      okText={t('confirm.accept')}
      cancelText={t('confirm.decline')}
      okButtonProps={{ danger: pending.operation === 'delete' }}
      onOk={() => {
        const action = pendingRef.current;
        close();
        // Re-read through the captured closure: the guards it checks are the
        // current ones, not the ones that were true when the dialog opened.
        action?.perform();
      }}
      /*
        "Cancellation leaves committed data, selection, and expansion
        unchanged" - so dismissing does nothing at all beyond closing.
      */
      onCancel={close}
      data-confirm={pending.operation}
    >
      <p>{t(MESSAGES[pending.operation])}</p>
    </Modal>
  ) : null;

  return { request, dialog };
};
