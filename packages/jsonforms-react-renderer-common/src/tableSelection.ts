import { useEffect, useState } from 'react';
import { Resolve } from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import { shouldConfirm } from './confirmation';

/** Selection is separate from the row displayed in the detail pane. */
export const useTableSelection = (props: any) => {
  const ctx = useJsonForms();
  const rows = Resolve.data(ctx.core?.data, props.path) as
    | unknown[]
    | undefined;
  const schema = Resolve.schema(
    ctx.core?.schema,
    props.uischema.scope,
    ctx.core?.schema
  );
  const options = { ...props.config, ...props.uischema.options };
  const [selected, setSelected] = useState<number[]>([]);
  const [pending, setPending] = useState<{
    indices: number[];
    rows: unknown[];
  }>();
  useEffect(() => {
    setSelected([]);
    setPending(undefined);
  }, [rows]);
  const allowed = (indices: number[]) =>
    props.enabled &&
    !props.readonly &&
    !options.disableRemove &&
    !props.disableRemove &&
    indices.length > 0 &&
    Array.isArray(rows) &&
    indices.every((index) => index >= 0 && index < rows.length) &&
    !(
      options.restrict &&
      schema?.minItems !== undefined &&
      rows.length - indices.length < schema.minItems
    );
  const remove = (indices: number[]) => {
    if (!allowed(indices)) return;
    props.removeItems(
      props.path,
      [...indices].sort((a, b) => b - a)
    )();
    setSelected([]);
  };
  return {
    selected,
    setSelected,
    selectable: !!props.enabled && !props.readonly && !options.disableRemove,
    canDelete: !!allowed(selected),
    confirming: !!pending,
    cancel: () => setPending(undefined),
    confirm: () => {
      if (pending?.rows === rows) remove(pending.indices);
      setPending(undefined);
    },
    request: () => {
      if (!allowed(selected)) return;
      if (
        shouldConfirm(
          {
            options: props.uischema.options,
            config: props.config,
            catalogId: 'arrayTable',
            operation: 'delete',
          },
          selected.map((index) => rows![index])
        )
      ) {
        setPending({ indices: [...selected], rows: rows! });
      } else remove(selected);
    },
  };
};
