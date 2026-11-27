import { useCallback, useRef, useState } from 'react';
import { useI18n } from '../locale/translate';
import {
  confirmationRequired,
  resolveConfirmationPolicy,
  type ConfirmationRequest,
} from './confirmation';

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

/** Confirmation policy and pending action; UI packages provide only the dialog. */
export const useConfirmationState = () => {
  const t = useI18n();
  const [pending, setPending] = useState<ConfirmationRequest>();
  const pendingRef = useRef<ConfirmationRequest>();
  const request = useCallback((next: ConfirmationRequest) => {
    const prompts = confirmationRequired(
      resolveConfirmationPolicy({
        options: next.options,
        config: next.config,
        catalogId: next.catalogId,
        operation: next.operation,
      }),
      next.discarded,
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
  const confirm = useCallback(() => {
    const action = pendingRef.current;
    close();
    action?.perform();
  }, [close]);
  const title = pending ? t(TITLES[pending.operation]) : undefined;
  const message = pending ? t(MESSAGES[pending.operation]) : undefined;
  return { t, pending, request, close, confirm, title, message };
};
