import { hasInvalidCompositeEditorDraft } from '@chobantonov/jsonforms-react-renderer-common/cells/useCompositeDraft';
import { useCompositeCellPresentation } from '@chobantonov/jsonforms-react-renderer-common/cells/useCompositeCellPresentation';
import { resolveEditorDetail } from '@chobantonov/jsonforms-react-renderer-common/core/detailUiSchema';
import { CellSummary } from '@chobantonov/jsonforms-react-renderer-common/cells/CellSummary';
import { ErrorIndicator } from '../complex/ErrorIndicator';
import { DetailDialogContent } from '../complex/DetailDialogContent';
import React, { useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import {
  CellProps,
  JsonFormsCore,
  JsonFormsRendererRegistryEntry,
  JsonFormsCellRendererRegistryEntry,
  Resolve,
  coreReducer,
  UPDATE_DATA,
  update,
} from '@jsonforms/core';
import {
  JsonFormsContext,
  JsonFormsDispatch,
  useJsonForms,
} from '@jsonforms/react';
import { shouldConfirm } from '@chobantonov/jsonforms-react-renderer-common/interaction/confirmation';
import { DeleteDialog } from '../complex/DeleteDialog';
import { preventsEmpty } from '@chobantonov/jsonforms-react-renderer-common/cells/compositeActions';
import {
  useI18n,
  useI18nDefault,
  useTranslator,
} from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@jsonforms-react-shadcn-ui/dialog';

const copy = <T,>(value: T): T =>
  value === undefined ? value : JSON.parse(JSON.stringify(value));
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
type Props = CellProps & {
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
};

/** A compact summary with isolated editing; only Apply writes to the form. */
export const ShadcnCompositeCell = (props: Props) => {
  const parent = useJsonForms();
  const invalidEditorDraft = hasInvalidCompositeEditorDraft(
    parent.core?.additionalErrors,
    props.path,
  );
  const t = useTranslator();
  const d = useI18nDefault();
  const text = useI18n();
  const [pendingDelete, setPendingDelete] = useState<{
    value: unknown;
    path: string;
  }>();
  const [draft, setDraft] = useState<JsonFormsCore>();
  const draftRef = useRef<JsonFormsCore>();
  const [original, setOriginal] = useState<unknown>();
  const options = props.uischema.options ?? {};
  const { errors, summary } = useCompositeCellPresentation(props, t, d);
  const enabled =
    props.enabled &&
    !(parent as any).readonly &&
    !(props.schema as { readOnly?: boolean }).readOnly;
  const label =
    props.schema.title ??
    text(
      props.schema.type === 'array'
        ? 'composite.itemsLabel'
        : 'composite.detailsLabel',
    );
  const current = () => Resolve.data(parent.core?.data, props.path);
  const close = () => {
    draftRef.current = undefined;
    setDraft(undefined);
  };
  const dispatch = (action: any) => {
    if (!enabled || !draftRef.current || action.type !== UPDATE_DATA) return;
    if (
      props.path &&
      action.path !== props.path &&
      !action.path.startsWith(`${props.path}.`)
    )
      return;
    draftRef.current = coreReducer(draftRef.current, action);
    setDraft(draftRef.current);
  };
  const value = draft && Resolve.data(draft.data, props.path);
  const isArray = props.schema.type === 'array';
  const conflicted = !!draft && !equal(current(), original);
  const canClear =
    enabled &&
    !options.disableRemove &&
    value != null &&
    typeof value === 'object' &&
    Object.keys(value).length > 0 &&
    (options.restrict === false || !preventsEmpty(props.schema, isArray));
  if (props.visible === false) return null;
  return (
    <div className='group/composite flex min-w-0 items-center gap-1.5'>
      {(options.showTypeIndicator ??
        props.config?.showTypeIndicator ??
        false) === true &&
        (isArray || props.schema?.type === 'object') && (
          <span aria-hidden='true' className='shrink-0 text-muted-foreground'>
            {isArray ? '[]' : '{}'}
          </span>
        )}
      <span
        className={`min-w-0 flex-1 truncate${
          summary.generated && options.summary?.type !== 'Label'
            ? ' italic text-muted-foreground'
            : ''
        }`}
      >
        {options.summary?.type === 'Label' ? (
          <CellSummary
            schema={props.schema}
            path={props.path}
            uischema={options.summary}
          />
        ) : (
          summary.text
        )}
      </span>
      {errors && <ErrorIndicator errors={errors} path={props.path} />}
      {((!options.summaryOnly && options.summary?.type !== 'Label') ||
        options.detail) && (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-7 w-7 shrink-0 opacity-0 group-hover/composite:opacity-100 group-focus-within/composite:opacity-100 [@media(hover:none)]:opacity-100'
          title={text('composite.edit', { label })}
          aria-label={text('composite.edit', { label })}
          onClick={() => {
            if (!parent.core) return;
            setOriginal(copy(current()));
            draftRef.current = {
              ...parent.core,
              data: copy(parent.core?.data),
            };
            setDraft(draftRef.current);
          }}
        >
          <Pencil className='h-4 w-4' aria-hidden='true' />
        </Button>
      )}
      {enabled &&
        !options.summaryOnly &&
        (options.summary?.type !== 'Label' || !!options.detail) &&
        props.data !== undefined &&
        options.clearable !== false && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-7 w-7 shrink-0 opacity-0 group-hover/composite:opacity-100 group-focus-within/composite:opacity-100 [@media(hover:none)]:opacity-100'
            style={{ color: 'hsl(var(--destructive))' }}
            title={text('composite.remove', { label })}
            aria-label={text('composite.remove', { label })}
            onClick={() => {
              if (
                shouldConfirm(
                  {
                    catalogId: 'compositeCell',
                    operation: 'delete',
                    options,
                    config: props.config,
                  },
                  [props.data],
                )
              )
                setPendingDelete({ value: props.data, path: props.path });
              else props.handleChange(props.path, undefined);
            }}
          >
            <X className='h-4 w-4' aria-hidden='true' />
          </Button>
        )}
      <DeleteDialog
        open={!!pendingDelete}
        onCancel={() => setPendingDelete(undefined)}
        onConfirm={() => {
          if (
            pendingDelete &&
            enabled &&
            options.clearable !== false &&
            pendingDelete.path === props.path &&
            pendingDelete.value === props.data
          )
            props.handleChange(props.path, undefined);
          setPendingDelete(undefined);
        }}
      />
      <Dialog open={!!draft} onOpenChange={(open) => !open && close()}>
        <DetailDialogContent
          open={!!draft}
          options={options.dialog}
          aria-describedby={undefined}
          className='max-h-[85vh] overflow-auto sm:max-w-2xl'
        >
          <DialogHeader>
            <DialogTitle>
              {props.schema.title ?? text('composite.detailsTitle')}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <JsonFormsContext.Provider
              value={{ ...parent, core: draft, dispatch }}
            >
              <JsonFormsDispatch
                schema={props.schema}
                uischema={resolveEditorDetail(
                  options.detail,
                  parent.uischemas ?? [],
                  props.schema,
                  props.uischema.scope,
                  props.path,
                  props.rootSchema,
                  { type: 'Control', scope: '#', label: false } as any,
                )}
                path={props.path}
                enabled={enabled}
                renderers={props.renderers}
                cells={props.cells}
              />
            </JsonFormsContext.Provider>
          )}
          <DialogFooter>
            {options.showEmptyButton === true && (
              <Button
                type='button'
                variant='outline'
                disabled={!canClear}
                onClick={() =>
                  dispatch(update(props.path, () => (isArray ? [] : {})))
                }
              >
                {options.emptyLabel ?? text('composite.empty')}
              </Button>
            )}
            <Button type='button' variant='outline' onClick={close}>
              {options.cancelLabel ?? text('composite.cancel')}
            </Button>
            <Button
              type='button'
              disabled={!enabled || conflicted || invalidEditorDraft}
              title={conflicted ? text('composite.applyConflict') : undefined}
              onClick={() => {
                if (!enabled || conflicted || invalidEditorDraft) return;
                const next = copy(
                  Resolve.data(draftRef.current?.data, props.path),
                );
                if (!equal(next, original))
                  props.handleChange(props.path, next);
                close();
              }}
            >
              {options.okLabel ?? text('composite.apply')}
            </Button>
          </DialogFooter>
        </DetailDialogContent>
      </Dialog>
    </div>
  );
};
export { compositeCellTester as shadcnCompositeCellTester } from '@chobantonov/jsonforms-react-renderer-common/cells/compositeCellTester';
