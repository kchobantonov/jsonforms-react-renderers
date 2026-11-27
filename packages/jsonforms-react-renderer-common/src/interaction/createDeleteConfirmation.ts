import type { ReactNode } from 'react';
import type {
  ConfirmationCatalogId,
  ConfirmationRequest,
} from './confirmation';

/** Bind a collection's catalog identity to its native confirmation hook. */
export function createDeleteConfirmation(
  useConfirmation: () => {
    request: (input: ConfirmationRequest) => void;
    dialog: ReactNode;
  },
  catalogId: ConfirmationCatalogId,
) {
  return function useDeleteConfirmation() {
    const confirmation = useConfirmation();
    return {
      request: (input: Omit<ConfirmationRequest, 'operation' | 'catalogId'>) =>
        confirmation.request({ ...input, operation: 'delete', catalogId }),
      dialog: confirmation.dialog,
    };
  };
}
