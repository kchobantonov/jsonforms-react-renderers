import { useRef, useState } from 'react';
import { ConfirmationCatalogId, shouldConfirm } from './confirmation';

/** Invalidates pending deletion if the collection or its binding changes. */
export const useCollectionDelete = <K extends string | number>(settings: {
  data: unknown;
  identity: unknown;
  catalogId: ConfirmationCatalogId;
  options?: Record<string, any>;
  config?: any;
  canRemove: (key: K) => boolean;
  value: (key: K) => unknown;
  remove: (key: K) => void;
}) => {
  const current = useRef(settings);
  current.current = settings;
  const pending = useRef<{ key: K; data: unknown; identity: unknown }>();
  const [confirming, setConfirming] = useState(false);
  const cancel = () => { pending.current = undefined; setConfirming(false); };
  const confirm = () => {
    const target = pending.current;
    cancel();
    const now = current.current;
    if (target && target.data === now.data && target.identity === now.identity && now.canRemove(target.key)) {
      now.remove(target.key);
    }
  };
  const request = (key: K) => {
    const now = current.current;
    if (!now.canRemove(key)) return;
    if (!shouldConfirm({ operation: 'delete', catalogId: now.catalogId, options: now.options, config: now.config }, [now.value(key)])) {
      now.remove(key);
      return;
    }
    pending.current = { key, data: now.data, identity: now.identity };
    setConfirming(true);
  };
  return { confirming, request, confirm, cancel };
};
