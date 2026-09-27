import type { Layout, UISchemaElement } from '@jsonforms/core';

/**
 * What this project's UI model adds to core's element types.
 *
 * Section 2 lists the core types a TypeScript implementation may import, and
 * then declares one of its own:
 *
 * ```ts
 * export type NamedUISchemaElement = UISchemaElement & { name: string };
 * ```
 *
 * with "`name` is used where an element must be referenced, for example
 * Categorization initial selection". Core does not declare `name` on
 * `UISchemaElement` and this project does not control core, so the addition
 * lives here - once, rather than as a cast at each of the half-dozen places
 * that read it.
 *
 * **`name` is general, not a feature of any one element.** It is read by the
 * `Template` registry lookup, `Slot` resolution, a Ractive partial, a
 * `Button`'s action name and `Categorization.options.initial`. Any element in
 * this set may carry one.
 */

/**
 * An element that **has** a name, as section 2 declares it.
 *
 * Use it where a name is required for the element to mean anything - a
 * `Template` invocation, a `Slot`, a registry entry looked up by name. `name`
 * is required here on purpose: the type is the guarantee.
 */
export type NamedUISchemaElement = UISchemaElement & { name: string };

/**
 * Any element of this project's UI model: core's, plus an optional name.
 *
 * This is the type to read an arbitrary element through. It says what is true
 * of every element here - that it *may* carry a name - without claiming one
 * is present.
 */
export type ExtendedUISchemaElement = UISchemaElement & { name?: string };

/** A layout whose children may be named. */
export type ExtendedLayout = Omit<Layout, 'elements'> & {
  elements: ExtendedUISchemaElement[];
};

/** Whether an element carries a usable name. */
export const isNamedUISchemaElement = (
  uischema: UISchemaElement | undefined
): uischema is NamedUISchemaElement =>
  typeof (uischema as ExtendedUISchemaElement | undefined)?.name === 'string' &&
  (uischema as NamedUISchemaElement).name !== '';
