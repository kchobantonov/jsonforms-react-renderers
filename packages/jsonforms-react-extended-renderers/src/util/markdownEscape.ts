/**
 * Escaping a substituted value so it cannot introduce Markdown.
 *
 * A module of its own, with no dependencies, because of **where** it is
 * needed. The interpolation path has to escape values before handing them to
 * the parser, but a label that interpolates without asking for Markdown must
 * not download a parser. Leaving this in `markdown.tsx` - which imports
 * markdown-it - would have put the parser in the interpolation chunk, which
 * is exactly the coupling the lazy split exists to avoid.
 */

/**
 * Escapes every character that could start a Markdown construct.
 *
 * Section 9: "Markdown substitutions are escaped before parsing." The order
 * is interpolate -> escape -> parse, and swapping the last two makes the
 * escaping pointless - by then the link already exists.
 *
 * Applied to **substituted values only**, never to the whole template: the
 * author's own `**bold**` in the surrounding text has to keep working, and
 * escaping the finished string would kill it.
 *
 * `<` and `>` are deliberately absent. Raw HTML is not a Markdown construct
 * here - the parser runs with `html: false`, and the result is rendered as
 * React text nodes, which React escapes. Adding them would put visible
 * backslashes in front of ordinary punctuation for no gain.
 */
export const escapeMarkdown = (text: string): string =>
  text.replace(/[\\`*_{}[\]()#+\-.!>|~]/g, (match) => `\\${match}`);
