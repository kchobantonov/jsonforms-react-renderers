import { JsonSchema, JsonSchema7, Resolve } from '@jsonforms/core';

/**
 * Naming a dynamic property, with no React in it.
 *
 * What a property may be called is decidable from the schema and the current
 * data, so it is settled here and tested without rendering anything.
 */

export type AdditionalPropertyNameError =
  | 'required'
  | 'already-defined'
  | 'invalid';

/**
 * The name exactly as supplied, and why it was refused if it was.
 *
 * A flat shape with an optional `error` rather than the discriminated union the
 * Svelte module uses: this package compiles with `strict` off, and without
 * `strictNullChecks` TypeScript does not narrow a union on a boolean literal
 * discriminant, so `if (result.valid)` would not give the caller access to
 * `result.error`. `error === undefined` means accepted.
 */
export interface AdditionalPropertyNameResult {
  name: string;
  error?: AdditionalPropertyNameError;
}

export interface ValidateAdditionalPropertyNameOptions {
  name: string;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  data?: unknown;
  /** The name being renamed, which may of course keep its own name. */
  currentName?: string;
  /** Names that are taken for another reason, e.g. declared properties. */
  disallowedNames?: readonly string[];
  allowEmptyName?: boolean;
  /** Only used to evaluate the property-name schema; optional. */
  validate?: (schema: JsonSchema, value: unknown) => boolean;
}

/**
 * Whether a property with this name can be reached by a JSON Forms data path.
 *
 * A dot is the separator and an empty segment composes away to the parent's own
 * path, so neither name can address the property it belongs to. Such a property
 * is still perfectly legal data and must stay editable - through an isolated
 * editor rooted at its value, per section 18's literal-key contract.
 */
export const needsIsolatedEditor = (name: string): boolean =>
  name === '' || name.includes('.');

/**
 * Sets an own property, even when the name is one the prototype also carries.
 *
 * `data['__proto__'] = value` replaces the object's prototype instead of
 * creating a property, and `'toString' in data` is true of every object. Now
 * that names are only restricted by the path grammar, both are reachable.
 */
export const assignOwnProperty = <T extends Record<string, unknown>>(
  target: T,
  name: string,
  value: unknown
): T => {
  Object.defineProperty(target, name, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
  return target;
};

/**
 * The schema a dynamic property's *name* has to satisfy.
 *
 * Built as a real schema rather than a regular expression so the whole of
 * `propertyNames` applies - `minLength`, `enum`, `format`, `allOf`, `not` and
 * anything else - instead of only its `pattern`. A joined alternation of
 * patterns, which is what this used to do, silently dropped every other
 * keyword.
 */
export const createAdditionalPropertyNameSchema = (
  schema: JsonSchema,
  rootSchema: JsonSchema
): JsonSchema7 => {
  const constraints: JsonSchema7[] = [];
  const propertyNames = (
    schema as JsonSchema7 & { propertyNames?: JsonSchema7 | boolean }
  ).propertyNames;

  if (propertyNames === false) {
    // JSON Forms' JsonSchema7 type cannot express a boolean schema, so the
    // equivalent always-failing schema stands in for it.
    constraints.push({ not: {} });
  } else if (typeof propertyNames === 'object' && propertyNames !== null) {
    const resolved =
      typeof propertyNames.$ref === 'string'
        ? (Resolve.schema(rootSchema, propertyNames.$ref, rootSchema) as
            | JsonSchema7
            | undefined) ?? propertyNames
        : propertyNames;
    constraints.push(resolved);
  }

  if (schema.additionalProperties === false) {
    // With no `additionalProperties`, a new name is only admissible if some
    // `patternProperties` entry claims it - and none at all means nothing is.
    const patterns = Object.keys(schema.patternProperties ?? {});
    constraints.push(
      patterns.length > 0
        ? { anyOf: patterns.map((pattern) => ({ pattern })) }
        : { not: {} }
    );
  }

  return {
    type: 'string',
    ...(constraints.length > 0 ? { allOf: constraints } : {}),
  };
};

/**
 * The reduced check used when no validator is available.
 *
 * It evaluates only the `pattern` constraints - what a regular expression can
 * express - and accepts anything else, so `minLength`, `enum` and the rest are
 * simply not checked. That is a real reduction, and it is preferred to skipping
 * name validation altogether when a caller renders this outside a form: a
 * pattern is by far the most common way to constrain a key, and silently
 * accepting every name would be the worse failure.
 */
const matchesPatternConstraints = (nameSchema: JsonSchema7, name: string) => {
  const constraints = (nameSchema.allOf ?? []) as JsonSchema7[];
  for (const constraint of constraints) {
    if (constraint.not !== undefined) {
      return false;
    }
    if (typeof constraint.pattern === 'string') {
      if (!new RegExp(constraint.pattern).test(name)) {
        return false;
      }
    }
    const alternatives = (constraint.anyOf ?? []) as JsonSchema7[];
    if (
      alternatives.length > 0 &&
      !alternatives.some(
        (alternative) =>
          typeof alternative.pattern === 'string' &&
          new RegExp(alternative.pattern).test(name)
      )
    ) {
      return false;
    }
  }
  return true;
};

export const validateAdditionalPropertyName = ({
  name,
  schema,
  rootSchema,
  data,
  currentName,
  disallowedNames = [],
  allowEmptyName = false,
  validate,
}: ValidateAdditionalPropertyNameOptions): AdditionalPropertyNameResult => {
  /*
    The name is kept **exactly** as typed. Section 18: "preserve every accepted
    name exactly; trimming is only a blankness check". So `trim()` decides
    whether the name counts as empty and is used for nothing else - `"  a  "`
    is a different key from `"a"`, and with empty names permitted `"   "` is a
    key in its own right.
  */
  if (!allowEmptyName && name.trim().length === 0) {
    return { name, error: 'required' };
  }

  // Renaming a property to what it is already called is not a collision.
  if (name === currentName) {
    return { name };
  }

  const taken = [...Object.keys(schema.properties ?? {}), ...disallowedNames];
  const isTaken =
    taken.includes(name) ||
    (typeof data === 'object' &&
      data !== null &&
      !Array.isArray(data) &&
      Object.prototype.hasOwnProperty.call(data, name));

  if (isTaken) {
    return { name, error: 'already-defined' };
  }

  const nameSchema = createAdditionalPropertyNameSchema(schema, rootSchema);
  let permitted = true;
  try {
    permitted = validate
      ? validate(nameSchema, name)
      : matchesPatternConstraints(nameSchema, name);
  } catch {
    // A malformed `propertyNames`, or a pattern that is not a valid regular
    // expression, cannot be evaluated here. The form's own validator reports it
    // against the data; refusing every name because this preview could not run
    // would be worse than letting it through.
    permitted = true;
  }
  if (!permitted) {
    return { name, error: 'invalid' };
  }

  return { name };
};
