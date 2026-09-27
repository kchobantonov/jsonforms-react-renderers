import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import type { CssLength } from './cssLength';
import type { DataPath, Scope, SchemaAtPath } from './schemaTypes';

/**
 * Authoring a UI schema against the JSON Schema it is bound to.
 *
 * The elements produced are ordinary portable UI-model objects - `type:
 * 'Control'` with a `scope`, options under `options`. Nothing about the
 * runtime changes; the types exist to make a wrong `scope` or a
 * misapplied option a compile error instead of a control that silently
 * renders nothing.
 *
 * See `docs/typed-form-authoring.md` for what this does and does not catch.
 */

/** Options every control understands, whatever it is bound to. */
export interface CommonControlOptions {
  readonly?: boolean;
  focus?: boolean;
  hideRequiredAsterisk?: boolean;
  showUnfocusedDescription?: boolean;
  clearable?: boolean;
  placeholder?: string;
  /**
   * How this child participates in its parent layout.
   *
   * The names are the ones `itemSizing` actually reads - `minWidth` and
   * friends, **not** `min`/`max`. An earlier draft of this type had the
   * short forms, which are read by nothing: they would have type-approved a
   * dead option while rejecting the one that works.
   */
  layout?: {
    span?: number;
    weight?: number;
    width?: CssLength;
    minWidth?: CssLength;
    maxWidth?: CssLength;
    height?: CssLength;
    minHeight?: CssLength;
    maxHeight?: CssLength;
    /** Reserved by the specification; accepted and ignored. */
    start?: number;
    /** Reserved by the specification; accepted and ignored. */
    responsive?: unknown;
  };
}

/**
 * Options admissible for the schema a control is bound to.
 *
 * **A curated subset, on purpose.** It covers the options these renderers
 * read for each schema kind; it is not generated from the published JSON
 * Schemas and will lag them. Adding one is a line here.
 *
 * An option this map does not know is still reachable, because excess
 * property checking only applies to a *fresh object literal*: assign the
 * options to a variable first and TypeScript stops checking the extra keys.
 * That is the documented escape hatch, and it is the same rule that makes
 * a separately-built element unchecked - see the limits in the guide.
 */
export type OptionsFor<Sub> = CommonControlOptions &
  (Sub extends { type: 'number' | 'integer' }
    ? { slider?: boolean; step?: number; toggle?: never }
    : Sub extends { type: 'string' }
    ? {
        multi?: boolean;
        format?: string;
        mask?: string;
        returnMaskedValue?: boolean;
        language?: string;
        propagateErrors?: boolean;
        monaco?: Record<string, unknown>;
        slider?: never;
      }
    : Sub extends { type: 'array' }
    ? {
        table?: boolean;
        variant?: 'ag-grid';
        showSortButtons?: boolean;
        restrict?: boolean;
        detail?: unknown;
        cells?: Record<string, unknown>;
      }
    : Sub extends { type: 'boolean' }
    ? { toggle?: boolean; slider?: never }
    : Record<string, unknown>);

export type RuleEffect = 'HIDE' | 'SHOW' | 'ENABLE' | 'DISABLE';

/** A leaf condition: one scope, one schema to test the value against. */
export interface TypedLeafCondition<S> {
  scope: Scope<(DataPath<S> & string) | ''>;
  schema: Record<string, unknown>;
  failWhenUndefined?: boolean;
}

/** The composite forms core supports, so a rule is not limited to one test. */
export interface TypedComposedCondition<S> {
  type: 'AND' | 'OR';
  conditions: TypedCondition<S>[];
}

export type TypedCondition<S> =
  | TypedLeafCondition<S>
  | TypedComposedCondition<S>;

export interface TypedRule<S> {
  effect: RuleEffect;
  condition: TypedCondition<S>;
}

/** `label` is not only a string: core also accepts a descriptor. */
export type TypedLabelDescriptor = { text?: string; show?: boolean };

/** Every path a control may bind to, including `''` for the root. */
export type ControlPath<S> = (DataPath<S> & string) | '';

export interface TypedControl<S, P extends ControlPath<S> = ControlPath<S>> {
  type: 'Control';
  scope: Scope<P>;
  label?: string | boolean | TypedLabelDescriptor;
  /** Translation-key prefix for this element, per core's i18n precedence. */
  i18n?: string;
  options?: OptionsFor<SchemaAtPath<S, P>>;
  rule?: TypedRule<S>;
}

/** An unbound label element. */
export interface TypedLabelElement<S> {
  type: 'Label';
  text?: string;
  i18n?: string;
  options?: Record<string, unknown>;
  rule?: TypedRule<S>;
}

/** One tab or step of a `Categorization`. */
export interface TypedCategory<S> {
  type: 'Category';
  label?: string;
  i18n?: string;
  elements: TypedElement<S>[];
  options?: Record<string, unknown>;
  rule?: TypedRule<S>;
}

export interface TypedLayout<S> {
  type: 'VerticalLayout' | 'HorizontalLayout' | 'Group' | 'Categorization';
  label?: string;
  i18n?: string;
  elements: (TypedElement<S> | TypedCategory<S>)[];
  options?: {
    gap?: CssLength;
    wrap?: boolean;
    minItemWidth?: CssLength;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?:
      | 'start'
      | 'center'
      | 'end'
      | 'space-between'
      | 'space-around'
      | 'space-evenly';
    resizable?: boolean;
    /** Horizontal layouts only. */
    gridColumns?: number;
    collapsible?: boolean;
    collapsed?: boolean;
    showDataIndicator?: boolean;
    showValidationIndicator?: boolean;
  };
  rule?: TypedRule<S>;
}

/**
 * Anything this module does not model, passed through unchecked.
 *
 * The escape hatch, and deliberately a **named** one: the alternative is a
 * permissive member of the element union, which would silently accept a
 * mistyped `Control` as well. Written as `f.raw({ … })` it is greppable, and
 * the loss of checking is visible at the point where it happens rather than
 * inferred from an element that quietly matched something else.
 */
export interface RawElement {
  type: string;
  [key: string]: unknown;
}

export type TypedElement<S> =
  | TypedControl<S>
  | TypedLayout<S>
  | TypedLabelElement<S>
  | RawElement;

/**
 * `address.city` -> `#/properties/address/properties/city`.
 *
 * Takes a plain `string`: with `S` still generic TypeScript cannot see that
 * `P` is one, so the work happens here and the literal type is reapplied at
 * the boundary. The cast is the only thing tying this expression to
 * `Scope<P>`, which is why `typedAuthoring.test.ts` asserts that the two
 * agree on concrete paths.
 */
const toPointer = (path: string): string =>
  path === ''
    ? '#'
    : `#/properties/${path
        .split('.')
        /*
          RFC 6901 escaping, per segment, exactly as core's own `getPropPath`
          does it: `/` and `~` have meaning inside a pointer, so a property
          called `a/b` is addressed as `a~1b`. Core `decode`s them on the way
          back, so leaving them raw produces a pointer that silently resolves
          to nothing.
        */
        .map((segment) => segment.replace(/~/g, '~0').replace(/\//g, '~1'))
        .join('/properties/')}`;

/**
 * Binds the authoring helpers to one schema.
 *
 * ```ts
 * const schema = { … } as const;
 * const f = forSchema(schema);
 * f.control('address.city');  // '#/properties/address/properties/city'
 * ```
 *
 * The schema argument is used for **inference only** and is never read, so
 * the helpers cost nothing at runtime beyond the string join.
 */
export const forSchema = <S>(_schema: S) => ({
  /** The JSON Pointer for a path, as a literal type. `''` is the root. */
  scope: <P extends ControlPath<S>>(path: P): Scope<P> =>
    toPointer(path) as Scope<P>,

  /** A `Control` bound to a path, with options checked against its schema. */
  control: <P extends ControlPath<S>>(
    path: P,
    rest?: Omit<TypedControl<S, P>, 'type' | 'scope'>
  ): TypedControl<S, P> =>
    ({
      type: 'Control',
      scope: toPointer(path) as Scope<P>,
      ...rest,
    } as TypedControl<S, P>),

  /** Identity, for the inference: it fixes `S` for every nested element. */
  layout: (layout: TypedLayout<S>): TypedLayout<S> => layout,

  /** One tab or step of a `Categorization`. */
  category: (category: Omit<TypedCategory<S>, 'type'>): TypedCategory<S> => ({
    type: 'Category',
    ...category,
  }),

  /** An unbound label. */
  label: (label: Omit<TypedLabelElement<S>, 'type'>): TypedLabelElement<S> => ({
    type: 'Label',
    ...label,
  }),

  /** Identity, so a rule written on its own is still checked. */
  rule: (rule: TypedRule<S>): TypedRule<S> => rule,

  /**
   * Anything this module does not model - an extended element, an option it
   * does not carry, a layout from another family. Unchecked by design; see
   * `docs/typed-form-authoring.md`.
   */
  raw: <T extends RawElement>(element: T): T => element,
});

// ------------------------------------------------------------ the boundary

/**
 * A deeply readonly view of a type.
 *
 * `as const` freezes arrays into `readonly` tuples, and `JsonSchema`'s
 * `required` is a mutable `string[]`, so `… as const satisfies JsonSchema`
 * is rejected on any schema that has a `required` - which is most of them.
 * The constraint has to admit readonly to be usable at all.
 */
export type ReadonlyDeep<T> = T extends (infer E)[]
  ? readonly ReadonlyDeep<E>[]
  : T extends readonly (infer E)[]
  ? readonly ReadonlyDeep<E>[]
  : T extends object
  ? { readonly [K in keyof T]: ReadonlyDeep<T[K]> }
  : T;

/**
 * What to `satisfies` an authored schema against.
 *
 * ```ts
 * const schema = { … } as const satisfies AuthoredSchema;
 * ```
 *
 * Keeps the literal inference the rest of this module needs, and still
 * checks that what was written is a JSON Schema.
 */
export type AuthoredSchema = ReadonlyDeep<JsonSchema> & {
  /*
    JSON Schema is open: an unknown keyword is legal and ignored, which is
    also how this project's Ajv is configured (`strictSchema: false`). The
    index signature is what admits them - `$defs` above all, which
    `JsonSchema7` does not declare because draft-07 spells it `definitions`.
    Without it, `satisfies` rejects most real schemas.

    The cost is that a misspelled keyword is accepted here too, exactly as
    it would be at runtime.
  */
  readonly [keyword: string]: unknown;
};

/**
 * Hands an authored schema to `<JsonForms>`.
 *
 * The cast is through `unknown` because `as const` makes every array
 * readonly and `JsonSchema` wants mutable ones - the two do not overlap in
 * TypeScript's view, though the value is a perfectly good schema. It is
 * widening, so it happens **after** every check in this module has run, and
 * it is here rather than at each call site so there is one place to look.
 *
 * JSON Forms does not mutate the schema it is given.
 */
export const asJsonSchema = (schema: unknown): JsonSchema =>
  schema as JsonSchema;

/** The same, for a UI schema built by {@link forSchema}. */
export const asUiSchema = (uischema: unknown): UISchemaElement =>
  uischema as UISchemaElement;
