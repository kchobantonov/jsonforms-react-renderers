import { ErrorObject } from 'ajv';
import { UISchemaElement, getControlPath } from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import { useMemo } from 'react';
import { boundDataPaths } from './groupState';
import { JSONFORMS_EXTENDED_CONFIG_KEY } from './configNamespaces';

/**
 * The dotted data path an error should be attributed to.
 *
 * Delegates to core's `getControlPath`, so the indicator agrees with wherever
 * core puts the message. That matters most for `required`: ajv reports it on
 * the *containing object* (`/contact`, `params.missingProperty: 'phone'`), and
 * core relocates it to `contact.phone`. Matching on the raw `instancePath`
 * makes a required error invisible to every container bound below the object -
 * clearing a field would make its indicator vanish rather than update.
 *
 * `dependencies` and `additionalProperties` are relocated the same way, and
 * `getControlPath` also decodes JSON Pointer escapes.
 */
export const errorDataPath = (error: ErrorObject): string =>
  getControlPath(error);

const EMPTY: ErrorObject[] = [];

/**
 * Every ancestor path of every error, so a container can ask "is anything below
 * me failing?" in O(1).
 *
 * An error at `/emergencyContact/phone` contributes `''`, `emergencyContact`
 * and `emergencyContact.phone`. Building costs O(errors x depth) once, against
 * O(containers x errors) for the obvious per-container scan - see Adjustment 5.
 *
 * The segment-boundary rule the specification requires falls out of this:
 * `employees.10.name` never contributes `employees.1`, so a sibling item cannot
 * match. A `startsWith` test is where that bug would otherwise live.
 */
export const buildErrorIndex = (
  ...errorLists: (ErrorObject[] | undefined)[]
): Set<string> => {
  const index = new Set<string>();
  for (const errors of errorLists) {
    for (const error of errors ?? EMPTY) {
      index.add('');
      let prefix = '';
      for (const segment of errorDataPath(error).split('.')) {
        if (segment === '') continue;
        prefix = prefix ? `${prefix}.${segment}` : segment;
        index.add(prefix);
      }
    }
  }
  return index;
};

/**
 * One index per pair of error arrays, shared by every container.
 *
 * Core replaces these arrays on each validation, so their identity is a sound
 * cache key and stale entries are collected. A `useMemo` per container would
 * instead rebuild the index per container, which is worse than not having one.
 */
const indexCache = new WeakMap<
  ErrorObject[],
  WeakMap<ErrorObject[], Set<string>>
>();

export const sharedErrorIndex = (
  errors: ErrorObject[] | undefined,
  additionalErrors: ErrorObject[] | undefined
): Set<string> => {
  const primary = errors ?? EMPTY;
  const secondary = additionalErrors ?? EMPTY;
  let byAdditional = indexCache.get(primary);
  if (!byAdditional) {
    byAdditional = new WeakMap();
    indexCache.set(primary, byAdditional);
  }
  const cached = byAdditional.get(secondary);
  if (cached) {
    return cached;
  }
  const index = buildErrorIndex(primary, secondary);
  byAdditional.set(secondary, index);
  return index;
};

/**
 * Errors eligible to feed an indicator under the active validation mode.
 *
 * `ValidateAndHide` hides schema errors from ordinary presentation, and
 * `NoValidation` computes none. Host `additionalErrors` remain available in
 * every mode, so they are never filtered out here.
 */
export const displayableErrors = (core: {
  errors?: ErrorObject[];
  additionalErrors?: ErrorObject[];
  validationMode?: string;
}): [ErrorObject[] | undefined, ErrorObject[] | undefined] => [
  core.validationMode === 'ValidateAndShow' || core.validationMode === undefined
    ? core.errors
    : undefined,
  core.additionalErrors,
];

/**
 * Resolves a project-extension option: the element's flat `options.<name>`,
 * then `config.jsonformsExtended.<name>`, then the container-type default.
 * Only `undefined` falls through, so an explicit `false` is a real override.
 */
export const resolveIndicatorOption = (
  uischema: UISchemaElement | undefined,
  config: Record<string, unknown> | undefined,
  fallback: boolean,
  name = 'showValidationIndicator'
): boolean => {
  const local = uischema?.options?.[name];
  if (local !== undefined) {
    return local === true;
  }
  const namespaced = (
    config?.[JSONFORMS_EXTENDED_CONFIG_KEY] as
      | Record<string, unknown>
      | undefined
  )?.[name];
  return namespaced === undefined ? fallback : namespaced === true;
};

export interface ContainerValidation {
  /** Whether the indicator should be rendered at all. */
  show: boolean;
  /**
   * How many eligible errors sit at or below this container, or `undefined`
   * when `showValidationIndicatorCount` is off and the count was never
   * computed.
   *
   * This counts **validator errors, not controls**. Two Controls bound to the
   * same property share one error object, so an invalid value there counts
   * once - fixing either control fixes both. Counting per control would be
   * both wrong and more work.
   */
  count?: number;
}

const belowAny = (path: string, boundPaths: string[]): boolean =>
  boundPaths.some(
    (bound) => path === bound || path.startsWith(`${bound}.`) || bound === ''
  );

/**
 * Whether a scope-less container - a Group, a Category - has failing
 * descendants, and how many.
 *
 * Presence is an O(1) index lookup per bound path. The count needs the error
 * list, so it is computed only for containers that are actually showing an
 * indicator, which is few.
 */
export const useContainerValidation = (
  uischema: UISchemaElement,
  path: string,
  config: Record<string, unknown> | undefined,
  fallback: boolean
): ContainerValidation => {
  const { core } = useJsonForms();
  const enabled = resolveIndicatorOption(uischema, config, fallback);
  // Presence is O(1) per bound path; the count needs a pass over the errors.
  // Hosts that only want the marker can skip that pass entirely.
  const wantCount = resolveIndicatorOption(
    uischema,
    config,
    false,
    'showValidationIndicatorCount'
  );
  const [errors, additionalErrors] = core
    ? displayableErrors(core)
    : [undefined, undefined];

  return useMemo(() => {
    if (!enabled) {
      return { show: false, count: 0 };
    }
    const index = sharedErrorIndex(errors, additionalErrors);
    if (index.size === 0) {
      return { show: false, count: 0 };
    }
    const bound = boundDataPaths(uischema, path);
    if (!bound.some((candidate) => index.has(candidate))) {
      return { show: false, count: 0 };
    }
    if (!wantCount) {
      return { show: true, count: undefined };
    }
    const eligible = [...(errors ?? EMPTY), ...(additionalErrors ?? EMPTY)];
    const count = eligible.filter((error) =>
      belowAny(errorDataPath(error), bound)
    ).length;
    return { show: count > 0, count };
  }, [enabled, wantCount, errors, additionalErrors, uischema, path]);
};
