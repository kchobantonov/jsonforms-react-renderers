import { Translate, evaluateWith } from './celEnvironment';
import { TemplateSegment, hasExpressions, splitTemplate } from './interpolate';

/**
 * Evaluating a split template with CEL.
 *
 * The only module that imports the evaluator, so it is the only thing a
 * dynamic import has to pull in. Nothing here decides *whether* to
 * interpolate - that is settled before the chunk is ever requested.
 */

/** The evaluator's own first line, which names the cause better than we could. */
const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message.split('\n')[0] : String(error);

/**
 * Whether a failure is the data simply not being there.
 *
 * The distinction this draws is the difference between a bug in the form and
 * a fact about the record being edited:
 *
 * - **An authoring error** is wrong however the form is filled in. A name the
 *   text does not declare, a function that does not exist, a type mismatch -
 *   these are reported, because someone has to fix the UI schema.
 * - **Absent data is normal.** A record without a middle name, an empty list,
 *   an optional object that has not been filled in yet: the expression is
 *   correct and the value is not there *at the moment*. Reporting it would
 *   put a developer-facing message on the page for every half-filled form,
 *   which trains people to ignore diagnostics.
 *
 * The evaluator separates the two cleanly and this is the whole basis for
 * telling them apart: reaching a key that is not present - at any depth, and
 * including an index past the end of a list - is always `No such key`, while
 * an identifier that is not in scope at all is `Unknown variable`.
 *
 * Note this is about keys *beneath* a namespace. A root that is not a
 * namespace at all is `Unknown variable` and stays an error.
 */
const isAbsentData = (error: unknown): boolean =>
  /^No such key:/.test(messageOf(error));

/**
 * Explains the one failure whose own message explains nothing.
 *
 * A JSON object may have a property called `constructor` - it is a legal key
 * and a schema may well declare one. The evaluator cannot read such an
 * object: its type check is defeated by the shadowed `constructor`, and it
 * rejects the **whole map** with `Unsupported type: object`, so every other
 * field of that object becomes unreadable too. Measured: `__proto__`,
 * `toString`, `valueOf` and `hasOwnProperty` as data keys are all fine; only
 * `constructor` does this.
 *
 * The search runs **only after a failure**, so the common path pays nothing,
 * and it is depth-limited because it exists to name a cause rather than to
 * audit the data.
 */
const CONSTRUCTOR_KEY_LIMIT = 4;

const findsConstructorKey = (value: unknown, depth = 0): boolean => {
  if (
    depth > CONSTRUCTOR_KEY_LIMIT ||
    value === null ||
    typeof value !== 'object'
  ) {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(value, 'constructor')) {
    return true;
  }
  return Object.values(value as Record<string, unknown>).some((child) =>
    findsConstructorKey(child, depth + 1)
  );
};

const explain = (error: unknown, scope: Record<string, unknown>): string => {
  const message = messageOf(error);
  if (/^Unsupported type: object/.test(message) && findsConstructorKey(scope)) {
    return `${message} - a value in scope has a property named "constructor", which this evaluator cannot read`;
  }
  return message;
};

export interface TemplateResult {
  text: string;
  /** One per expression that could not be rendered. Never thrown. */
  failures: string[];
}

/**
 * A CEL value as display text.
 *
 * CEL integers are int64 and arrive as `bigint`, which `String` handles;
 * values taken straight from the form's data keep their JavaScript types.
 *
 * An object or a list has **no** sensible one-line form, so it is refused
 * rather than rendered: `[object Object]` in the middle of a sentence is
 * worse than a diagnostic, because it looks like data and is not.
 */
const display = (value: unknown): { text: string; failure?: string } => {
  if (value === null || value === undefined) {
    /*
      Empty, and silent. By the time a value reaches the text its absence is
      a fact about the data rather than a mistake in the form - an optional
      field that has not been filled in renders as nothing, which is what a
      reader expects and what a half-filled form is full of.
    */
    return { text: '' };
  }
  switch (typeof value) {
    case 'string':
      return { text: value };
    case 'number':
    case 'bigint':
    case 'boolean':
      return { text: String(value) };
    default:
      return {
        text: '',
        failure: `resolved to a ${
          Array.isArray(value) ? 'list' : 'structure'
        }, which has no text form`,
      };
  }
};

/**
 * Renders the segments, substituting each expression's value.
 *
 * `escape` is applied to **substituted values only**, never to the literal
 * segments. That distinction is the whole security property when the result
 * is about to be parsed as Markdown: a value containing
 * `[click](javascript:alert(1))` has to render as those characters, while the
 * author's own `**bold**` in the surrounding literal must still work.
 * Escaping the finished string would break the second; escaping nothing would
 * break the first. It is also why the template is split into segments rather
 * than evaluated with a regex replace.
 *
 * An expression that throws does not take the label down: it contributes
 * empty text and a failure, and the caller decides what to show.
 */
export const renderTemplate = (
  segments: TemplateSegment[],
  scope: Record<string, unknown>,
  escape: (text: string) => string = (text) => text,
  locale?: string,
  translate?: Translate
): TemplateResult => {
  const failures: string[] = [];
  let text = '';
  for (const segment of segments) {
    if (segment.kind === 'literal') {
      text += segment.text;
      continue;
    }
    try {
      const { text: rendered, failure } = display(
        evaluateWith(segment.source, scope, locale, translate)
      );
      if (failure) {
        failures.push(`${segment.source.trim()} ${failure}`);
      }
      text += escape(rendered);
    } catch (error) {
      /*
        Absent data contributes empty text and nothing else; anything else is
        an authoring error, and the evaluator's own message names the cause
        better than this layer could. It is developer-facing text, reported
        beside the label rather than thrown.
      */
      if (!isAbsentData(error)) {
        failures.push(`${segment.source.trim()}: ${explain(error, scope)}`);
      }
    }
  }
  return { text, failures };
};

/**
 * Resolves the declared `textParams` against the namespaces.
 *
 * This is the **only** place the form's data is read. A parameter's value is
 * the right-hand side of a declaration in the UI schema, which is where
 * knowledge of the data model belongs; the text it feeds knows only the
 * parameter's name, which is what makes that text translatable.
 *
 * A value is treated as a template, so the same grammar applies one level
 * down: `"Atlas"` is a literal, `"{data.plan}"` resolves, and
 * `"Plan {data.plan}"` does both. A non-string value - a number, a boolean,
 * an object to navigate with `{user.name}` - passes through untouched.
 *
 * Parameters see the namespaces and **not each other**. Allowing one to
 * reference another would need an evaluation order and a cycle check, for a
 * capability that an extra parameter already covers.
 *
 * Values are not escaped here. Escaping belongs to the moment a value is
 * substituted into the text, because that is the string a parser will see.
 */
export const resolveTextParams = (
  raw: Record<string, unknown> | undefined,
  namespaceScope: Record<string, unknown>,
  locale?: string,
  translate?: Translate
): { params: Record<string, unknown>; failures: string[] } => {
  const params: Record<string, unknown> = {};
  const failures: string[] = [];
  for (const [name, value] of Object.entries(raw ?? {})) {
    if (typeof value !== 'string') {
      params[name] = value;
      continue;
    }
    const segments = splitTemplate(value);
    if (!hasExpressions(segments)) {
      /*
        A literal, but still run through the split so the grammar's brace
        escaping applies: `{{x}}` is the literal `{x}` here exactly as it is
        in the text.
      */
      params[name] = segments
        .map((segment) => (segment.kind === 'literal' ? segment.text : ''))
        .join('');
      continue;
    }
    /*
      A value that is exactly one expression keeps the expression's own type,
      so `{data.seats}` stays a number and a comparison against it in the text
      still works. Anything else is string concatenation.
    */
    if (segments.length === 1 && segments[0].kind === 'expression') {
      try {
        params[name] = evaluateWith(
          segments[0].source,
          namespaceScope,
          locale,
          translate
        );
      } catch (error) {
        if (!isAbsentData(error)) {
          failures.push(`${name}: ${explain(error, namespaceScope)}`);
        }
        /*
          Empty either way. Where it was an authoring error the cause has just
          been reported at the level it happened, and leaving the name
          unresolved would make the text report it again - one problem, one
          diagnostic. Where the data was simply absent there is nothing to
          report and nothing to show.
        */
        params[name] = '';
      }
      continue;
    }
    const rendered = renderTemplate(
      segments,
      namespaceScope,
      undefined,
      locale,
      translate
    );
    for (const failure of rendered.failures) {
      failures.push(`${name}: ${failure}`);
    }
    params[name] = rendered.text;
  }
  return { params, failures };
};
