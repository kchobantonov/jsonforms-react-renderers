/**
 * Reading a JSON Schema at the **type** level.
 *
 * Everything here operates on the schema as a TypeScript type, so it only
 * works on a schema whose literal types survive - `as const`, or
 * `as const satisfies …`. A schema declared as a plain object widens
 * `type: 'integer'` to `type: string`, and the two of these that read the
 * `type` keyword quietly stop discriminating. Property **names** survive
 * either way, because they are keys rather than values, so {@link DataPath}
 * keeps working where {@link DataOf} does not. That asymmetry is worth
 * knowing: paths keep being checked while the data type silently becomes
 * `unknown`.
 */

type Primitives = {
  string: string;
  number: number;
  integer: number;
  boolean: boolean;
  null: null;
};

type RequiredKeyOf<S> = S extends { required: readonly (infer R)[] }
  ? R & string
  : never;

type PropsOf<S> = S extends { properties: infer P } ? P : never;

/** `required` names stay non-optional; everything else is optional. */
type ObjectData<S> = {
  [K in keyof PropsOf<S> as K extends RequiredKeyOf<S> ? K : never]: DataOf<
    PropsOf<S>[K]
  >;
} & {
  [K in keyof PropsOf<S> as K extends RequiredKeyOf<S> ? never : K]?: DataOf<
    PropsOf<S>[K]
  >;
};

/**
 * The data a schema describes.
 *
 * `const` and `enum` come first, so a constant narrows to its value rather
 * than to its type - which is what makes a discriminated union of branches
 * usable from TypeScript.
 */
export type DataOf<S> = S extends { const: infer C }
  ? C
  : S extends { enum: readonly (infer E)[] }
  ? E
  : S extends { type: 'array'; items: infer I }
  ? DataOf<I>[]
  : S extends { properties: unknown }
  ? ObjectData<S>
  : S extends { type: infer T }
  ? T extends keyof Primitives
    ? Primitives[T]
    : unknown
  : unknown;

/** Bounded recursion, so a schema that points at itself cannot hang `tsc`. */
type Decrement = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Every addressable path in a schema, dotted.
 *
 * **Arrays are terminal.** A control inside an array's `detail` is scoped
 * relative to the item, not through the parent, so `orders.reference` is not
 * a scope this form could use - `orders` is, and the detail's own uischema
 * addresses `reference` from there. Offering the through-path would be
 * offering a pointer that resolves to nothing.
 *
 * `$ref` is not followed. A property whose schema is `{ $ref: … }` has no
 * `properties` of its own at the type level, so it is terminal too.
 */
export type DataPath<S, D extends number = 6> = D extends 0
  ? never
  : S extends { type: 'array' }
  ? never
  : S extends { properties: infer P }
  ? {
      [K in keyof P & string]: K extends `${string}.${string}`
        ? /* not addressable - see UnaddressableName */ never
        :
            | K
            | (P[K] extends { properties: unknown }
                ? `${K}.${DataPath<P[K], Decrement[D]> & string}`
                : never);
    }[keyof P & string]
  : never;

/**
 * A property whose name contains a dot is **not addressable**, and is left
 * out of {@link DataPath} rather than mis-addressed.
 *
 * JSON Forms addresses data with dotted paths and the grammar has no escape,
 * so a property literally called `first.name` has no scope: it splits into
 * two segments and produces `#/properties/first/properties/name`, which
 * points at a property that does not exist. Core has the same limitation -
 * its own `getPropPath` splits on `.` too - so this is not something these
 * helpers could route around.
 *
 * Adjustment 14 states the runtime half: such names are legal, are not
 * refused, and are edited through a control that uses no path at all. What
 * this type can do is refuse to hand out a pointer that would be wrong.
 *
 * `/` and `~` are a different matter. They are legal in a pointer once
 * escaped, so they stay addressable and the escaping is done for you.
 */
export type UnaddressableName<S> = S extends { properties: infer P }
  ? {
      [K in keyof P & string]: K extends `${string}.${string}` ? K : never;
    }[keyof P & string]
  : never;

type PointerBody<P extends string> = P extends `${infer H}.${infer R}`
  ? `properties/${H}/${PointerBody<R>}`
  : `properties/${P}`;

/**
 * `address.city` -> `#/properties/address/properties/city`, and `''` -> `#`.
 *
 * The empty path is the root scope, which an object control binds to.
 */
export type Scope<P extends string> = P extends ''
  ? '#'
  : `#/${PointerBody<P>}`;

/** The sub-schema a dotted path lands on. */
export type SchemaAtPath<
  S,
  P extends string
> = P extends `${infer H}.${infer R}`
  ? S extends { properties: infer Props }
    ? H extends keyof Props
      ? SchemaAtPath<Props[H], R>
      : never
    : never
  : S extends { properties: infer Props }
  ? P extends keyof Props
    ? Props[P]
    : never
  : never;
