import isEqual from 'lodash/isEqual';
import type { JsonSchema } from '@jsonforms/core';

/**
 * What a `oneOf` branch change keeps, and what it throws away.
 *
 * Section 18: "initialize from the selected branch's generated defaults and
 * preserve existing values of properties declared in the **enclosing
 * schema's own properties**. Those preserved values take precedence over
 * generated defaults."
 *
 * The emphasis is the whole rule. A property is preserved because the
 * enclosing schema declares it - not because the branch being left and the
 * branch being entered happen to use the same name. The specification is
 * explicit about that second case: "do not infer preservation merely because
 * two branches contain the same property name."
 */

/** The names the enclosing schema declares itself, outside any branch. */
export const enclosingPropertyNames = (
  schema: JsonSchema | undefined
): string[] =>
  Object.keys((schema as { properties?: object })?.properties ?? {});

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The part of the current value a branch change would discard.
 *
 * This is what the confirmation policy has to weigh, not the whole value:
 * section 14 says to "evaluate the data actually discarded, excluding
 * enclosing properties preserved during a branch change". Without that, a
 * `complex` policy prompts about `{name: "Alex"}` even though `name` survives
 * the switch untouched and nothing is lost.
 */
export const discardedByBranchChange = (
  data: unknown,
  schema: JsonSchema | undefined,
  excludeDiscriminator = false
): unknown => {
  if (!isPlainObject(data)) {
    return data;
  }
  const preserved = new Set(enclosingPropertyNames(schema));
  const discarded: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const branches = schema?.oneOf as JsonSchema[] | undefined;
    // Only distinct, fixed primitive values identify a branch. An arbitrary
    // default or an invalid imported value is still user data.
    const fixed = branches?.map((branch) => branch.properties?.[key]);
    const discriminator =
      excludeDiscriminator &&
      fixed &&
      fixed.length > 1 &&
      fixed.every(
        (property) =>
          property &&
          Object.prototype.hasOwnProperty.call(property, 'const') &&
          (property.const === null || typeof property.const !== 'object')
      ) &&
      new Set(fixed.map((property) => JSON.stringify(property!.const))).size ===
        fixed.length &&
      fixed.some((property) => isEqual(property!.const, value));
    if (!preserved.has(key) && !discriminator) {
      discarded[key] = value;
    }
  }
  return discarded;
};

/**
 * The value to commit when a branch change is performed.
 *
 * `defaults` is the branch's generated initial value. Preservation only
 * applies where it means something - both sides have to be objects for there
 * to be named properties to carry across - so a combinator of scalars simply
 * takes the generated default.
 */
export const branchChangeData = (
  data: unknown,
  defaults: unknown,
  schema: JsonSchema | undefined
): unknown => {
  const names = enclosingPropertyNames(schema);
  if (names.length === 0 || !isPlainObject(data)) {
    return defaults;
  }
  const preserved: Record<string, unknown> = {};
  for (const name of names) {
    // Only values that actually exist are preserved; an absent enclosing
    // property must not be materialised as `undefined` by the switch.
    if (Object.prototype.hasOwnProperty.call(data, name)) {
      preserved[name] = data[name];
    }
  }
  if (Object.keys(preserved).length === 0) {
    return defaults;
  }
  if (!isPlainObject(defaults)) {
    /*
      Clearing the selection, or a branch whose default is not an object. The
      enclosing properties are not part of any branch, so they survive - losing
      them here would be the same data loss the rule exists to prevent.
    */
    return defaults === undefined ? preserved : defaults;
  }
  // Preserved values take precedence over the generated defaults.
  return { ...defaults, ...preserved };
};
