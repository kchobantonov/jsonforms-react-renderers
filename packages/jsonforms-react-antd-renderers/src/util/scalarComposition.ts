import { JsonSchema, Resolve } from '@jsonforms/core';

/**
 * Composition that describes **one** editor.
 *
 * Section 18's project presentation contract: "when composition describes one
 * unambiguous scalar editor, render it once and preserve the outer Control's
 * label, description, i18n, options, and data path. Annotation-only branches
 * do not create separate inputs."
 *
 * `{ "type": "integer", "anyOf": [{ "maximum": 10 }, { "minimum": 20 }] }`
 * is one integer input, not two tabs. The branches say what a valid integer
 * is; they do not describe two different things to edit.
 *
 * This decides only **presentation**. The validator still sees the whole
 * schema, so the alternative-match and exclusive-match errors it raises
 * appear beside that single input as usual.
 */

const PRIMITIVE_TYPES = ['string', 'number', 'integer', 'boolean'];

/**
 * Keywords that constrain a scalar without describing another editor.
 *
 * `enum` and `const` are deliberately absent: they turn a value into a finite
 * choice, which has its own renderers and its own conventions. The
 * specification is explicit that those "take precedence where applicable" and
 * that arbitrary branches must not be turned into enum values.
 */
const VALIDATION_KEYWORDS = new Set([
  'maximum',
  'minimum',
  'exclusiveMaximum',
  'exclusiveMinimum',
  'multipleOf',
  'maxLength',
  'minLength',
  'pattern',
  'format',
  'contentEncoding',
  'contentMediaType',
]);

const ANNOTATION_KEYWORDS = new Set([
  'title',
  'description',
  'default',
  'examples',
  'readOnly',
  'writeOnly',
  'deprecated',
  '$comment',
]);

const COMBINATORS = ['oneOf', 'anyOf', 'allOf'] as const;
export type Combinator = (typeof COMBINATORS)[number];

const resolveBranch = (
  branch: JsonSchema,
  rootSchema: JsonSchema | undefined
): JsonSchema | undefined => {
  const ref = (branch as { $ref?: string }).$ref;
  if (ref === undefined) {
    return branch;
  }
  if (rootSchema === undefined) {
    return undefined;
  }
  try {
    return Resolve.schema(rootSchema, ref, rootSchema);
  } catch {
    return undefined;
  }
};

/**
 * Whether a branch only narrows a scalar, rather than describing a structure.
 *
 * Anything this does not recognise makes the composition ambiguous, which is
 * the safe answer: the branch presentation is kept and nothing is lost.
 */
const isScalarNarrowing = (branch: JsonSchema | undefined): boolean => {
  if (branch === undefined || typeof branch !== 'object') {
    return false;
  }
  return Object.keys(branch).every(
    (key) =>
      key === 'type' ||
      VALIDATION_KEYWORDS.has(key) ||
      ANNOTATION_KEYWORDS.has(key)
  );
};

const typeOf = (schema: JsonSchema | undefined): string | undefined => {
  const type = (schema as { type?: unknown } | undefined)?.type;
  return typeof type === 'string' ? type : undefined;
};

/**
 * The one primitive type a composition describes, or `undefined` when it
 * describes more than one thing to edit.
 *
 * Returning `undefined` is always safe: it leaves the branch presentation and
 * the full validation exactly as they were.
 */
export const scalarCompositionType = (
  schema: JsonSchema | undefined,
  rootSchema?: JsonSchema
): string | undefined => {
  if (schema === undefined || typeof schema !== 'object') {
    return undefined;
  }
  const present = COMBINATORS.filter((keyword) =>
    Array.isArray((schema as Record<string, unknown>)[keyword])
  );
  // Two combinators at once is not one unambiguous editor.
  if (present.length !== 1) {
    return undefined;
  }
  const record = schema as Record<string, unknown>;
  // A finite choice has its own renderers; leave them to it.
  if (record.enum !== undefined || record.const !== undefined) {
    return undefined;
  }
  const branches = record[present[0]] as JsonSchema[];
  if (branches.length === 0) {
    return undefined;
  }

  const types = new Set<string>();
  const outerType = typeOf(schema);
  if (outerType !== undefined) {
    types.add(outerType);
  }
  for (const raw of branches) {
    const branch = resolveBranch(raw, rootSchema);
    if (!isScalarNarrowing(branch)) {
      return undefined;
    }
    const branchType = typeOf(branch);
    if (branchType !== undefined) {
      types.add(branchType);
    }
  }

  if (types.size !== 1) {
    return undefined;
  }
  const [only] = Array.from(types);
  return PRIMITIVE_TYPES.includes(only) ? only : undefined;
};

/**
 * The schema to hand the single editor.
 *
 * `allOf` means intersection, so its branches' constraints all apply and
 * folding them in keeps the input honest - this is how the draft-07
 * meta-schema's `nonNegativeIntegerDefault0` becomes one integer input with
 * minimum 0.
 *
 * `oneOf` and `anyOf` are alternatives, and their bounds are dropped: "Do not
 * copy both branches' bounds onto the input: minimum 20 and maximum 10 would
 * prevent valid entries. Even choosing just one branch's bound would exclude
 * values that the other branch permits." Those constraints are left to
 * full-schema validation, which still reports them.
 */
export const scalarCompositionSchema = (
  schema: JsonSchema,
  rootSchema?: JsonSchema
): JsonSchema => {
  const record = schema as Record<string, unknown>;
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!(COMBINATORS as readonly string[]).includes(key)) {
      rest[key] = value;
    }
  }
  if (!Array.isArray(record.allOf)) {
    return rest as JsonSchema;
  }
  const merged: Record<string, unknown> = { ...rest };
  for (const raw of record.allOf as JsonSchema[]) {
    const branch = resolveBranch(raw, rootSchema);
    for (const [key, value] of Object.entries(branch ?? {})) {
      // The outer schema wins: its own constraints and annotations are the
      // ones the author wrote against this property.
      if (merged[key] === undefined) {
        merged[key] = value;
      }
    }
  }
  return merged as JsonSchema;
};
