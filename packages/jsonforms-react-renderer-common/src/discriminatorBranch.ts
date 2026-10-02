import { JsonSchema, resolveSchema } from '@jsonforms/core';
import isEqual from 'lodash/isEqual';

/** Infer only an unambiguous, explicit discriminator. Do not expand children or
 * treat this editing hint as schema validation. */
export const discriminatorBranch = (
  schema: JsonSchema,
  rootSchema: JsonSchema,
  keyword: 'oneOf' | 'anyOf',
  data: unknown
): number | undefined => {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    return undefined;
  const branches = schema[keyword];
  if (!branches?.length) return undefined;
  try {
    const resolved = branches.map((branch) =>
      branch.$ref ? resolveSchema(rootSchema, branch.$ref, rootSchema) : branch
    );
    const first = resolved[0];
    for (const key of Object.keys(first?.properties ?? {})) {
      const values = resolved.map((branch) => branch?.properties?.[key]);
      if (
        !resolved.every((branch) => branch?.required?.includes(key)) ||
        !values.every(
          (value) =>
            value && Object.prototype.hasOwnProperty.call(value, 'const')
        )
      )
        continue;
      const constants = values.map((value) => value.const);
      if (
        constants.some((value, i) =>
          constants.slice(0, i).some((other) => isEqual(value, other))
        )
      )
        continue;
      const index = constants.findIndex((value) =>
        isEqual(value, (data as Record<string, unknown>)[key])
      );
      if (index !== -1) return index;
    }
  } catch {
    // Unresolved references remain the host's responsibility.
  }
  return undefined;
};

/** A missing discriminator belongs on the branch selector, not a hidden field. */
export const missingDiscriminatorError = (
  schema: JsonSchema,
  rootSchema: JsonSchema,
  path: string,
  errors: import('ajv').ErrorObject[]
): boolean => {
  try {
    const branches = schema.oneOf?.map((branch) =>
      branch.$ref ? resolveSchema(rootSchema, branch.$ref, rootSchema) : branch
    );
    if (!branches?.length) return false;
    const keys = Object.keys(branches[0].properties ?? {}).filter((key) =>
      branches.every(
        (branch) =>
          branch.required?.includes(key) &&
          Object.prototype.hasOwnProperty.call(
            branch.properties?.[key] ?? {},
            'const'
          )
      )
    );
    const pointer = path
      ? '/' +
        path
          .split('.')
          .map((part) => part.replace(/~/g, '~0').replace(/\//g, '~1'))
          .join('/')
      : '';
    return errors.some(
      (error) =>
        error.keyword === 'required' &&
        error.instancePath === pointer &&
        keys.includes(error.params.missingProperty)
    );
  } catch {
    return false;
  }
};
