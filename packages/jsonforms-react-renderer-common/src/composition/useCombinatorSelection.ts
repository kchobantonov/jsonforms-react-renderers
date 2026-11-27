import {
  createCombinatorRenderInfos,
  type CombinatorRendererProps,
  type JsonSchema,
  type JsonFormsCore,
} from '@jsonforms/core';
import { displayableErrors } from '../validation/validationIndicator';
import { useTranslator } from '../locale/translate';
import { missingDiscriminatorError } from './discriminatorBranch';

export function useCombinatorSelection(
  {
    schema,
    rootSchema,
    uischema,
    path,
    uischemas,
  }: Pick<
    CombinatorRendererProps,
    'schema' | 'rootSchema' | 'uischema' | 'path' | 'uischemas'
  >,
  combinator: 'anyOf' | 'oneOf',
  core?: JsonFormsCore,
) {
  const translate = useTranslator();
  const [primaryErrors, additionalErrors] = displayableErrors(core ?? {});
  const missingKind = missingDiscriminatorError(schema, rootSchema, path, [
    ...(primaryErrors ?? []),
    ...(additionalErrors ?? []),
  ]);
  const selectionError = missingKind
    ? translate('oneOf.chooseKind', 'Choose a kind.')
    : '';

  const renderInfos = createCombinatorRenderInfos(
    (schema as JsonSchema)[combinator],
    rootSchema,
    combinator,
    uischema,
    path,
    uischemas,
  ).map((info) => {
    const prefix = (info.schema as JsonSchema & { i18n?: string }).i18n;
    return typeof prefix === 'string'
      ? {
          ...info,
          label: translate(`${prefix}.label`, info.label) ?? info.label,
        }
      : info;
  });

  return { translate, selectionError, renderInfos };
}
