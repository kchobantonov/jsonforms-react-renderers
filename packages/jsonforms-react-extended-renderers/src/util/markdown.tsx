import MarkdownIt from 'markdown-it';
import React from 'react';
import { isAllowedUrl, UrlPolicy } from './urlPolicy';

/*
  Re-exported so this module stays the one place a caller looks for Markdown
  concerns, while the function itself carries no dependency - see
  `markdownEscape.ts` for why that separation matters to the bundle.
*/
export { escapeMarkdown } from './markdownEscape';

/**
 * The Markdown profiles of specification section 10, rendered to React.
 *
 * ## Why a token stream rather than HTML
 *
 * Section 10 requires that Markdown output be sanitized **after** parsing.
 * `md.render()` returns an HTML string, which would have to be injected with
 * `dangerouslySetInnerHTML` and therefore sanitized first by some other
 * library. `md.parse()` returns a token stream instead, and walking that into
 * React elements means **no HTML string is ever produced**: there is nothing
 * unsanitized to sanitize, no sanitizer in the dependency chain to be
 * misconfigured, and the set of elements that can reach the page is the
 * allowlist below rather than whatever the sanitizer was talked into.
 *
 * ## Why rules are disabled rather than output filtered
 *
 * Basic excludes headings, images, tables, blockquotes and fenced code.
 * Disabling the **rule** means `# Title` renders as the literal text
 * `# Title`, which is what a profile that excludes headings should do.
 * Filtering the output instead would consume the `#` and silently promote the
 * text to a paragraph, leaving an author to wonder where their heading went.
 *
 * Disabling a rule is not the same as escaping the text, and one case shows
 * it: with `fence` off, a ``` block is claimed by the inline backtick rule
 * and comes out as inline code. Nothing is lost - the code is still the
 * content - but the construct degrades to its nearest supported neighbour
 * rather than to literal backticks.
 *
 * `html: false` means the parser never emits a raw-HTML token at all, so the
 * excluded raw HTML is excluded by construction rather than by a later pass.
 */

export type MarkdownProfile = 'basic' | 'extended';

/**
 * Rules off in **both** profiles.
 *
 * `image` and `html_inline` are section 10's independently-gated constructs,
 * and neither gate is open: images are not implemented here, and raw HTML has
 * no rule to disable beyond `html: false` - these two names are belt and
 * braces should a future option turn `html` on for some other reason.
 *
 * `hr` is in neither profile's list. Basic enumerates what it supports and a
 * thematic break is not in it; extended is defined as basic *plus headings,
 * blockquotes, tables and fenced code*, which does not add one either.
 */
const ALWAYS_OFF = ['image', 'html_inline', 'html_block', 'hr'];

/** What extended adds back, and therefore exactly what basic withholds. */
const EXTENDED_ONLY = [
  'heading',
  'lheading',
  'blockquote',
  'table',
  'fence',
  'code',
];

/**
 * The elements that may reach the page.
 *
 * Every tag markdown-it produces for the rules left enabled, and nothing
 * else. A token carrying any other tag is dropped rather than rendered, so
 * this list - not the rule configuration - is the last word on what can be
 * drawn. `reference` and `autolink` stay enabled because both produce
 * ordinary links, which the profile supports and which the URL policy
 * governs like any other.
 */
const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'em',
  's',
  'code',
  'pre',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]);

const parsers = new Map<MarkdownProfile, MarkdownIt>();

/**
 * `linkify` is off: turning a bare URL into a link is in neither profile, and
 * it would route text the author never marked up through the URL policy.
 *
 * `breaks` is off because a single newline is not a line break in Markdown;
 * the profile's "line breaks" are the two-space and backslash forms, which
 * `hardbreak` carries.
 */
export const markdownParser = (
  profile: MarkdownProfile = 'basic'
): MarkdownIt => {
  const existing = parsers.get(profile);
  if (existing) {
    return existing;
  }
  const md = new MarkdownIt({
    html: false,
    linkify: false,
    breaks: false,
    typographer: false,
  });
  md.disable(
    profile === 'extended' ? ALWAYS_OFF : [...ALWAYS_OFF, ...EXTENDED_ONLY],
    /* ignoreInvalid: a rule renamed upstream must not throw at render time. */
    true
  );
  /*
    markdown-it carries its own scheme check, which refuses `javascript:`,
    `vbscript:`, `file:` and `data:` by turning the link back into plain text
    before a `link_open` token exists. Two reasons to take it over rather than
    leave it in front of the URL policy:

    - Section 10 makes the URL policy the authority on link targets. With two
      checks in series the effective policy is their intersection, so a host
      that widens `allowedSchemes` silently gets nothing for the schemes
      markdown-it happens to dislike.
    - A link refused before parsing raises no diagnostic. The author is told
      nothing, and the text keeps the raw `[go](...)` brackets.

    Handing every href to `isAllowedUrl` makes one check authoritative and
    every refusal reportable. It is not a loosening: the default policy allows
    https, http and mailto only, which is narrower than what markdown-it
    blocks.
  */
  md.validateLink = () => true;
  parsers.set(profile, md);
  return md;
};

export interface MarkdownContext {
  profile?: MarkdownProfile;
  urlPolicy?: UrlPolicy;
  /** Called for a link the policy refuses, so the caller can diagnose it. */
  onRefusedUrl?: (href: string) => void;
}

interface Frame {
  /**
   * `null` for a **transparent** frame: one that holds its children's place
   * in the walk but draws nothing of its own.
   *
   * markdown-it wraps every list item's content in a paragraph and sets
   * `hidden` on the wrapper when the list is tight, which is how `- one` ends
   * up as `<li>one</li>` rather than `<li><p>one</p></li>`. The flag has to be
   * honoured: rendering a hidden token puts a block element inside every list
   * item and spaces the list out. It is also why a frame is pushed at all for
   * such a token - the matching close must still find something to pop.
   */
  tag: string | null;
  props: Record<string, unknown>;
  children: React.ReactNode[];
}

/**
 * Walks a token stream into React nodes.
 *
 * markdown-it emits a flat list whose `nesting` is +1, 0 or -1, so the walk
 * keeps an explicit stack rather than recursing: an opening token pushes a
 * frame, a closing token pops it and appends the finished element to its
 * parent. Keying off `nesting` and `tag` rather than off each token `type`
 * is what lets the two profiles share one walk - an `h2` needs no case of
 * its own, it needs only to be in {@link ALLOWED_TAGS}.
 */
const walk = (
  tokens: MarkdownIt.Token[],
  context: MarkdownContext,
  counter: { next: number }
): React.ReactNode[] => {
  const root: React.ReactNode[] = [];
  const stack: Frame[] = [];
  const push = (node: React.ReactNode) =>
    (stack.length ? stack[stack.length - 1].children : root).push(node);
  const close = () => {
    const frame = stack.pop();
    if (!frame) {
      return;
    }
    if (frame.tag === null) {
      for (const child of frame.children) {
        push(child);
      }
      return;
    }
    push(
      React.createElement(
        frame.tag,
        { key: `md-${counter.next++}`, ...frame.props },
        frame.children.length ? frame.children : undefined
      )
    );
  };

  for (const token of tokens) {
    if (token.type === 'inline') {
      for (const node of walk(token.children ?? [], context, counter)) {
        push(node);
      }
      continue;
    }
    if (token.nesting === 1) {
      if (token.type === 'link_open') {
        const href = token.attrGet('href') ?? '';
        if (isAllowedUrl(href, context.urlPolicy)) {
          stack.push({
            tag: 'a',
            props: { href, target: '_blank', rel: 'noopener noreferrer' },
            children: [],
          });
        } else {
          context.onRefusedUrl?.(href);
          /*
            A refused destination keeps its text and loses its link, which is
            what the Link renderer does under the same policy. A `span` leaves
            the sentence intact without offering anywhere to click.
          */
          stack.push({
            tag: 'span',
            props: { 'data-markdown-url-refused': true },
            children: [],
          });
        }
        continue;
      }
      /*
        An unknown tag still pushes a frame, so its matching close pops this
        one and the nesting stays balanced; `span` is the inert stand-in.
      */
      stack.push({
        tag: token.hidden
          ? null
          : ALLOWED_TAGS.has(token.tag)
          ? token.tag
          : 'span',
        props: {},
        children: [],
      });
      continue;
    }
    if (token.nesting === -1) {
      close();
      continue;
    }
    switch (token.type) {
      case 'text':
        if (token.content) {
          push(token.content);
        }
        break;
      case 'softbreak':
        push(' ');
        break;
      case 'hardbreak':
        push(<br key={`md-${counter.next++}`} />);
        break;
      case 'code_inline':
        push(<code key={`md-${counter.next++}`}>{token.content}</code>);
        break;
      case 'fence':
      case 'code_block':
        /*
          No language class: the info string is author-supplied text, and a
          highlighter is not in the profile. The code is content either way.
        */
        push(
          <pre key={`md-${counter.next++}`}>
            <code>{token.content}</code>
          </pre>
        );
        break;
      default:
        /*
          A disabled rule emits no tokens, so anything arriving here is a
          construct this profile does not draw. Dropping it is right: the text
          it carried is already in the stream as its own token.
        */
        break;
    }
  }
  /* An unbalanced stream (never seen from markdown-it) still yields its content. */
  while (stack.length) {
    close();
  }
  return root;
};

/** Parses and renders, in the requested profile. */
export const renderMarkdown = (
  markdown: string,
  context: MarkdownContext = {}
): React.ReactNode[] =>
  walk(markdownParser(context.profile).parse(markdown, {}), context, {
    next: 0,
  });
