import { PendingChange } from './pendingChanges';
import { useMemo, useState } from 'react';

export type PaginationOption =
  | boolean
  | { pageSize?: number; pageSizeOptions?: number[] };
export const resolvePagination = (
  local: PaginationOption | undefined,
  config: any,
  kind: 'array' | 'additionalProperties' | 'additionalItems',
  defaultEnabled = true,
) => {
  const option =
    local ?? config?.jsonformsExtended?.[kind]?.pagination ?? defaultEnabled;
  const settings = typeof option === 'object' ? option : {};
  const size =
    Number.isInteger(settings.pageSize) && settings.pageSize! > 0
      ? settings.pageSize!
      : 5;
  const choices = [
    ...new Set([
      ...(settings.pageSizeOptions ?? [5, 10, 25, 50]).filter(
        (n) => Number.isInteger(n) && n > 0,
      ),
      size,
    ]),
  ].sort((a, b) => a - b);
  return { enabled: option !== false, size, choices };
};

export const useCollectionPagination = (
  keys: readonly (string | number)[],
  local: PaginationOption | undefined,
  config: any,
  kind: 'array' | 'additionalProperties' | 'additionalItems',
  defaultEnabled = true,
) => {
  const pending = useMemo(() => new Set<PendingChange>(), []);
  const resolved = resolvePagination(local, config, kind, defaultEnabled);
  const [size, setSize] = useState(resolved.size);
  const [page, setPage] = useState(1);
  const keySnapshot = JSON.stringify(keys);
  const [previous, setPrevious] = useState({
    keySnapshot,
    size: resolved.size,
    enabled: resolved.enabled,
  });
  const pages = Math.max(1, Math.ceil(keys.length / size));
  if (
    previous.size !== resolved.size ||
    previous.enabled !== resolved.enabled
  ) {
    setPrevious({
      keySnapshot,
      size: resolved.size,
      enabled: resolved.enabled,
    });
    setSize(resolved.size);
    setPage(1);
  } else if (previous.keySnapshot !== keySnapshot) {
    const previousKeys = JSON.parse(previous.keySnapshot) as (
      | string
      | number
    )[];
    const added = keys.findIndex((key) => !previousKeys.includes(key));
    setPrevious({ ...previous, keySnapshot });
    setPage(
      keys.length > previousKeys.length && added >= 0
        ? Math.floor(added / size) + 1
        : Math.min(page, pages),
    );
  } else if (page > pages) {
    setPage(pages);
  }
  const current = Math.min(page, pages);
  const start = resolved.enabled ? (current - 1) * size : 0;
  return {
    pending,
    enabled: resolved.enabled,
    current,
    size,
    total: keys.length,
    pages,
    choices: resolved.choices,
    indices: keys
      .map((_, i) => i)
      .slice(start, resolved.enabled ? start + size : undefined),
    change: (nextPage: number, nextSize = size) => {
      pending.forEach((change) => change.flush());
      setPage(nextSize === size ? nextPage : Math.floor(start / nextSize) + 1);
      setSize(nextSize);
    },
  };
};
export type CollectionPage = ReturnType<typeof useCollectionPagination>;
