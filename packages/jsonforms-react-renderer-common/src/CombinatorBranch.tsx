import type { ErrorObject } from 'ajv';
import isEqual from 'lodash/isEqual';
import React, { useMemo } from 'react';
import { JsonSchema, Resolve } from '@jsonforms/core';
import { JsonFormsContext, useJsonForms } from '@jsonforms/react';

/** Validate the visible editing branch even when another alternative validates.
 * These errors are local presentation state; document validation is unchanged.
 */
export const CombinatorBranch = ({
  schema,
  path,
  children,
  options,
}: {
  options?: { validateActiveBranch?: boolean };
  schema: JsonSchema;
  path: string;
  children: React.ReactNode;
}) => {
  const context = useJsonForms();
  const enabled =
    (options?.validateActiveBranch ??
      context.config?.validateActiveBranch ??
      true) &&
    context.core?.validationMode !== 'NoValidation' &&
    context.core?.validationMode !== 'ValidateAndHide';
  const ajv = context.core?.ajv;
  const validate = useMemo(() => {
    if (!enabled) return undefined;
    try {
      return ajv?.compile(schema);
    } catch {
      return undefined;
    }
  }, [ajv, schema, enabled]);
  const data = Resolve.data(context.core?.data, path);
  const localErrors = useMemo(() => {
    if (
      !validate ||
      context.core?.validationMode === 'NoValidation' ||
      context.core?.validationMode === 'ValidateAndHide'
    )
      return [];
    validate(data);
    const prefix = path
      ? '/' +
        path
          .split('.')
          .map((part) => part.replace(/~/g, '~0').replace(/\//g, '~1'))
          .join('/')
      : '';
    return (validate.errors ?? []).map((error) => ({
      ...error,
      instancePath: prefix + error.instancePath,
    }));
  }, [validate, data, path, context.core?.validationMode]);
  const value = useMemo(
    () => ({
      ...context,
      core: context.core
        ? {
            ...context.core,
            errors: mergeBranchErrors(context.core.errors ?? [], localErrors),
          }
        : context.core,
    }),
    [context, localErrors]
  );
  if (!enabled) return <>{children}</>;
  return (
    <JsonFormsContext.Provider value={value}>
      {children}
    </JsonFormsContext.Provider>
  );
};

/** Schema locations differ between document and independently compiled branches.
 * Deduplicate equivalent feedback, retaining distinct constraints and targets. */
export const mergeBranchErrors = (
  documentErrors: ErrorObject[],
  branchErrors: ErrorObject[]
): ErrorObject[] => {
  const buckets = new Map<string, ErrorObject[]>();
  return [...documentErrors, ...branchErrors].filter((error) => {
    const key = JSON.stringify([
      error.instancePath,
      error.keyword,
      error.message,
    ]);
    const bucket = buckets.get(key) ?? [];
    if (bucket.some((previous) => isEqual(previous.params, error.params)))
      return false;
    bucket.push(error);
    buckets.set(key, bucket);
    return true;
  });
};
