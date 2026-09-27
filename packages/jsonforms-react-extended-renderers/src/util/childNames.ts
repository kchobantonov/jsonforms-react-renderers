import type { ExtendedUISchemaElement } from '../core/uiSchema';

/**
 * Addressing a template's children.
 *
 * Section 13: "each named child is available as a partial that mounts its
 * delegated renderer. Unnamed children receive their decimal index as a
 * fallback name."
 *
 * The fallback is where it gets interesting, and the section does not say what
 * happens when the two collide. They can: a child explicitly named `"0"` wants
 * the same key as the first child's index fallback. The previous
 * implementation let whichever came last win the map, so the **other child was
 * never placed at all** - no partial, no dispatch, no error. A control simply
 * was not on the form, and nothing said why.
 *
 * The rule here: an explicit name always keeps its key, because the author
 * asked for it. An index fallback applies **only if no explicit name has
 * claimed that index**, and when one has, the unnamed child is reported as
 * unaddressable rather than silently dropped or quietly given some other
 * number no template would reference.
 */

export interface ResolvedChildNames {
  /**
   * One entry per child, in order. `undefined` means the child could not be
   * given an address and no template can place it.
   */
  names: (string | undefined)[];
  /** Name to child index, for looking a child up from a template. */
  byName: Record<string, number>;
  /** Stable-coded messages for names that could not be assigned. */
  diagnostics: string[];
}

export const resolveChildNames = (
  elements: readonly ExtendedUISchemaElement[] | undefined
): ResolvedChildNames => {
  const children = elements ?? [];
  const names: (string | undefined)[] = new Array(children.length).fill(
    undefined
  );
  const byName: Record<string, number> = {};
  const diagnostics: string[] = [];

  /*
    Explicit names first, so an index fallback can see every key that is
    already taken - including one belonging to a later child.
  */
  children.forEach((element, index) => {
    const explicit = element?.name;
    if (typeof explicit !== 'string' || explicit === '') {
      return;
    }
    if (byName[explicit] !== undefined) {
      diagnostics.push(
        `template.duplicateChildName: children ${
          byName[explicit]
        } and ${index} are both named ${JSON.stringify(
          explicit
        )}; the first one keeps the name.`
      );
      return;
    }
    byName[explicit] = index;
    names[index] = explicit;
  });

  children.forEach((_element, index) => {
    if (names[index] !== undefined) {
      return;
    }
    const fallback = String(index);
    if (byName[fallback] !== undefined) {
      diagnostics.push(
        `template.childNameCollision: child ${index} has no name and its index ${JSON.stringify(
          fallback
        )} is already the name of child ${
          byName[fallback]
        }, so it cannot be placed. Give it a name.`
      );
      return;
    }
    byName[fallback] = index;
    names[index] = fallback;
  });

  return { names, byName, diagnostics };
};

/**
 * Attributes a Ractive template will silently eat.
 *
 * Ractive's parser reads **any** attribute matching `name-in`, `name-out` or
 * `name-in-out` as a transition directive:
 *
 * ```js
 * // ractive.js
 * var transitionPattern = /^([a-zA-Z](?:(?!-in-out)[-a-zA-Z_0-9])*)-(in|out|in-out)$/;
 * ```
 *
 * So `<p data-out>` is parsed as the transition named `data` and never
 * reaches the DOM, while `data-greeting` beside it is untouched. It is
 * hard-coded in the parser, with no option to turn it off.
 *
 * This renderer registers **no transitions**, so every such directive is dead
 * code here - which makes warning about all of them precise rather than
 * guesswork. An author who wanted a transition learns this profile has none;
 * an author who wanted an attribute learns why it vanished.
 */
const RACTIVE_TRANSITION_ATTRIBUTE =
  /\s([a-zA-Z](?:(?!-in-out)[-a-zA-Z_0-9])*-(?:in|out|in-out))(?=[\s/>=])/g;

export const ractiveTransitionAttributes = (template: string): string[] => {
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  RACTIVE_TRANSITION_ATTRIBUTE.lastIndex = 0;
  while ((match = RACTIVE_TRANSITION_ATTRIBUTE.exec(template)) !== null) {
    found.add(match[1]);
  }
  return [...found];
};
