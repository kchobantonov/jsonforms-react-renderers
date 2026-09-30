import { JSONFORMS_EXTENDED_CONFIG_KEY } from './configNamespaces';

/**
 * The template grammar, and what an expression is allowed to see.
 *
 * Deliberately free of any CEL import. Splitting a template is pure string
 * work, and doing it here means two things: the grammar can be tested without
 * the evaluator, and a label whose text turns out to contain **no**
 * placeholders never downloads one.
 */

/** One piece of a split template. */
export type TemplateSegment =
  | { kind: 'literal'; text: string }
  | { kind: 'expression'; source: string };

/**
 * Splits a template into literals and expressions.
 *
 * The grammar is section 11.4's, unchanged, because a second convention in
 * the same document is the thing worth avoiding: a **single** `{` opens a
 * placeholder, `{{` emits a literal `{`, and `}}` emits a literal `}`.
 *
 * This is inverted from Mustache and friends, so `{{data.firstName}}` is
 * literal text rather than a binding. That trap is the reason
 * {@link looksLikeMustache} exists.
 *
 * The scan is quote-aware: a `}` inside a quoted string does not close the
 * placeholder, so `{data.m['}']}` is one expression rather than a truncated
 * one. Quotes are tracked only to find the closing brace - what is inside
 * them is the evaluator's business.
 *
 * An unterminated placeholder is returned as a literal, so the author sees
 * their source text rather than losing the rest of the line.
 */
export const splitTemplate = (text: string): TemplateSegment[] => {
  const segments: TemplateSegment[] = [];
  let literal = '';
  let i = 0;

  const flush = () => {
    if (literal) {
      segments.push({ kind: 'literal', text: literal });
      literal = '';
    }
  };

  while (i < text.length) {
    const char = text[i];
    if (char === '{' && text[i + 1] === '{') {
      literal += '{';
      i += 2;
      continue;
    }
    if (char === '}' && text[i + 1] === '}') {
      literal += '}';
      i += 2;
      continue;
    }
    if (char !== '{') {
      literal += char;
      i += 1;
      continue;
    }
    // A placeholder. Find its closing brace, ignoring quoted content.
    let j = i + 1;
    let quote: string | undefined;
    let closed = false;
    while (j < text.length) {
      const c = text[j];
      if (quote) {
        // A backslash escapes the next character inside a quoted string.
        if (c === '\\') {
          j += 2;
          continue;
        }
        if (c === quote) {
          quote = undefined;
        }
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === '}') {
        closed = true;
        break;
      }
      j += 1;
    }
    if (!closed) {
      // Unterminated: the rest is text, which is more use than nothing.
      literal += text.slice(i);
      break;
    }
    flush();
    segments.push({ kind: 'expression', source: text.slice(i + 1, j) });
    i = j + 1;
  }
  flush();
  return segments;
};

/** Whether a split template has anything to evaluate. */
export const hasExpressions = (segments: TemplateSegment[]): boolean =>
  segments.some((segment) => segment.kind === 'expression');

/**
 * Whether the text looks like it expected Mustache's convention.
 *
 * `{{data.firstName}}` splits into the literal `{data.firstName}` - correct
 * per the grammar, and almost certainly not what the author meant. Section
 * 11.4 asks an implementation to warn about exactly this shape.
 */
export const looksLikeMustache = (text: string): boolean =>
  /\{\{\s*[A-Za-z_$][\w$]*(\.[\w$]+|\[[^\]]*\])*\s*\}\}/.test(text);

// ------------------------------------------------------------- the scope

const namespaced = (config: unknown): Record<string, unknown> | undefined =>
  (config as Record<string, unknown> | undefined)?.[
    JSONFORMS_EXTENDED_CONFIG_KEY
  ] as Record<string, unknown> | undefined;

/**
 * Whether the host permits an expression to read the form's data.
 *
 * Section 12's gate, and it defaults **closed** like the others - unlike the
 * Markdown gate, which opens a parser rather than a reader. What this opens
 * is exactly what section 11 calls dynamic resolution: values out of the
 * form's data and the host's context, into the UI.
 */
export const dynamicValuesEnabled = (config: unknown): boolean =>
  (
    namespaced(config)?.['dynamicValues'] as Record<string, unknown> | undefined
  )?.['enabled'] === true;

/** The namespaces that only dynamic resolution may expose. */
export const DYNAMIC_NAMESPACES = ['data', 'item', 'config', 'context'];

export interface NamespaceScopeInput {
  data?: unknown;
  item?: unknown;
  locale?: string;
  config?: unknown;
  context?: unknown;
  dynamicAllowed: boolean;
}

/**
 * What a **`textParams` value** may reference.
 *
 * This is the only place the form's data is reachable. A parameter's value is
 * the right-hand side of a declaration the author wrote in the UI schema, and
 * the UI schema is where knowledge of the data model belongs.
 *
 * The four namespaces appear only when the gate is open, so a parameter that
 * reaches for `data` while it is shut fails with an unknown identifier rather
 * than quietly resolving.
 */
export const buildNamespaceScope = (
  input: NamespaceScopeInput
): Record<string, unknown> => {
  const scope: Record<string, unknown> = { locale: input.locale ?? 'en' };
  if (input.dynamicAllowed) {
    scope.data = input.data ?? {};
    Object.defineProperty(scope, 'item', { enumerable: true, get: () => input.item });
    scope.config = input.config ?? {};
    scope.context = input.context ?? {};
  }
  return scope;
};

/**
 * Names the text scope keeps for itself.
 *
 * `locale` lets a message choose a word by language without a parameter for
 * it. A `textParams` entry of the same name would silently do nothing, so it
 * is reported rather than dropped - see {@link reservedParamNames}.
 */
export const RESERVED_TEXT_NAMES = ['locale'];

/**
 * What the **text** may reference: the declared parameters, and nothing else.
 *
 * Deliberately **not** the namespaces. A translated string that reads
 * `{data.customerName}` couples the catalog to the schema: renaming a field
 * invalidates every translation of every language, and a translator is shown
 * a data path instead of a name for the thing. Restricting the text to
 * declared parameters is what makes `You are subscribed to {product}.` the
 * unit of translation.
 *
 * Expressions still work here, over those parameters. That is what keeps a
 * plural in the catalog where each language can write its own
 * (`{seats == 1 ? "seat" : "seats"}`) rather than in the UI schema where only
 * the authoring language can.
 */
export const buildTextScope = (
  params: Record<string, unknown>,
  locale: string | undefined
): Record<string, unknown> => ({
  ...params,
  // Assigned last: a reserved name is not shadowed by a parameter.
  locale: locale ?? 'en',
});

/** `textParams` entries that collide with a reserved name, so they can be reported. */
export const reservedParamNames = (
  textParams: Record<string, unknown> | undefined
): string[] =>
  Object.keys(textParams ?? {}).filter((name) =>
    RESERVED_TEXT_NAMES.includes(name)
  );

/** Whether an element asks for interpolation at all. */
export const wantsInterpolation = (
  options: Record<string, unknown> | undefined
): boolean => options?.['interpolate'] === true;
