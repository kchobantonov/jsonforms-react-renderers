import type { CellProps, Translator } from '@jsonforms/core';
import { useDynamicTreeResolver } from '../dynamic/DynamicUiProvider';
import {
  usePathErrorMessages,
  labelDetailErrorPaths,
} from '../validation/errorSummary';
import { compositeSummaryPresentation } from './compositeSummary';

/** Resolves the same authored detail, summary and error paths for both cell sets. */
export const useCompositeCellPresentation = (
  props: CellProps,
  translate: Translator,
  i18nDefault: Parameters<typeof compositeSummaryPresentation>[4],
) => {
  const resolveTree = useDynamicTreeResolver(props.path);
  const authoredDetail = props.uischema.options?.detail;
  const errorOptions =
    authoredDetail &&
    typeof authoredDetail === 'object' &&
    typeof authoredDetail.type === 'string'
      ? { ...props.uischema.options, detail: resolveTree(authoredDetail) }
      : props.uischema.options;
  const errors = usePathErrorMessages(
    props.path,
    labelDetailErrorPaths(props.path, errorOptions),
  );
  const options = props.uischema.options ?? {};
  const summary = compositeSummaryPresentation(
    props.data,
    options.summary?.type === 'Control' ? (options.summary as any) : undefined,
    props.schema?.title,
    translate,
    i18nDefault,
    props.schema,
  );
  return { errors, summary };
};
