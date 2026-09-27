import {
  UrlPolicy,
  defaultUrlPolicy,
  isAllowedImageUrl,
  isAllowedUrl,
} from './urlPolicy';

/**
 * The URL policy, applied to whatever a **template** produced.
 *
 * Section 12 makes the policy a MUST for "every URL-bearing value", and the
 * `Link` and `ImageView` renderers have always honoured it. A template did
 * not: `<a href={data.url}>` put the value straight into the anchor, so a
 * `javascript:` URL arriving in form data became a working script the moment
 * somebody clicked it. Text interpolation was never the hole - React escapes
 * it - which is exactly why this one survived.
 *
 * The check belongs **below the engine**, not in it: there are three engines
 * and no reason for each to learn the policy separately.
 *
 * **A refused URL drops the attribute, not the element.** An `<a>` without an
 * `href` is text that cannot navigate; an `<img>` without a `src` shows its
 * `alt`. Removing the element instead would make a hostile value indistinguishable
 * from a missing one, and section 19 asks for honest rendering of bad data.
 */

/** Stable code, so a host can grep for it. */
export const URL_REFUSED_DIAGNOSTIC = 'template.urlRefused';

/**
 * How a URL-bearing attribute is judged.
 *
 * `image` additionally allows `data:image/...` when the host has opted in with
 * `allowImageDataUrls`; `link` never does. The split matters: an inline image
 * is a reasonable asset, and a `data:` document handed to an anchor is a
 * navigation to attacker-controlled HTML on this origin.
 */
type UrlKind = 'link' | 'image';

/**
 * Attributes that carry a URL, by their **React prop** spelling.
 *
 * `srcSet` and `ping` hold *lists*; see {@link splitUrlList}. Deliberately
 * absent: `data`, which is a URL only on `<object>` and an ordinary prop name
 * everywhere else - it is handled per element below.
 */
const URL_PROPS: Record<string, UrlKind> = {
  href: 'link',
  src: 'link',
  srcSet: 'image',
  poster: 'image',
  background: 'image',
  action: 'link',
  formAction: 'link',
  cite: 'link',
  ping: 'link',
  manifest: 'link',
  profile: 'link',
  longDesc: 'link',
  codeBase: 'link',
  classID: 'link',
  xlinkHref: 'link',
};

/** The same set, spelled as DOM attributes, for an engine that owns its DOM. */
const URL_ATTRS: Record<string, UrlKind> = {
  href: 'link',
  src: 'link',
  srcset: 'image',
  poster: 'image',
  background: 'image',
  action: 'link',
  formaction: 'link',
  cite: 'link',
  ping: 'link',
  manifest: 'link',
  profile: 'link',
  longdesc: 'link',
  codebase: 'link',
  classid: 'link',
  'xlink:href': 'link',
};

/** Elements whose `src` loads an image, so `allowImageDataUrls` applies. */
const IMAGE_SRC_ELEMENTS = new Set(['img', 'image', 'source', 'input']);

/**
 * `src` is the one attribute whose kind depends on the element.
 *
 * On `<img>` it loads an image, so `allowImageDataUrls` may permit a
 * `data:image/...`. On `<iframe>`, `<embed>` or `<script>` the same attribute
 * loads a *document*, where that opt-in must not apply - which is why the
 * table cannot settle this on the attribute name alone.
 */
const kindFor = (type: unknown, name: string, declared: UrlKind): UrlKind => {
  if (name !== 'src') {
    return declared;
  }
  const tag = typeof type === 'string' ? type.toLowerCase() : '';
  return IMAGE_SRC_ELEMENTS.has(tag) ? 'image' : 'link';
};

const allowed = (value: unknown, kind: UrlKind, policy: UrlPolicy): boolean =>
  kind === 'image'
    ? isAllowedImageUrl(value, policy)
    : isAllowedUrl(value, policy);

/**
 * The candidate URLs inside a list-valued attribute.
 *
 * `srcSet` is comma-separated with an optional descriptor (`x.png 2x`), and
 * `ping` is space-separated. A list is refused **as a whole** when any
 * candidate is: keeping the survivors would silently change which image loads.
 */
const splitUrlList = (name: string, value: string): string[] =>
  name === 'ping'
    ? value.split(/\s+/).filter(Boolean)
    : value
        .split(',')
        .map((candidate) => candidate.trim().split(/\s+/)[0])
        .filter(Boolean);

const isList = (name: string) =>
  name === 'srcSet' || name === 'srcset' || name === 'ping';

const report = (
  onRefused: ((message: string) => void) | undefined,
  name: string,
  value: unknown
) => {
  const message = `${URL_REFUSED_DIAGNOSTIC}: ${name}=${JSON.stringify(
    String(value)
  )} is not permitted by the URL policy; the attribute was dropped.`;
  if (onRefused) {
    onRefused(message);
    return;
  }
  // eslint-disable-next-line no-console
  console.warn(message);
};

/**
 * Whether a prop's value is worth judging as a URL.
 *
 * On an **intrinsic** element (`type` is a string like `'a'`) React writes
 * whatever it is given into the attribute, stringifying it on the way, so
 * anything non-null is inspected - including an object with a hostile
 * `toString`.
 *
 * On a **custom component** only strings are. A component is free to define
 * `src` as something structured, and dropping a legitimate object prop because
 * it is not a URL would break working templates to prevent nothing: the
 * component, not this pragma, decides what reaches the DOM - and when it does,
 * it goes through its own element, which passes back through here.
 */
const inspectable = (type: unknown, value: unknown): boolean =>
  typeof type === 'string' ? true : typeof value === 'string';

const permits = (
  type: unknown,
  name: string,
  kind: UrlKind,
  value: unknown,
  policy: UrlPolicy
): boolean => {
  const effective = kindFor(type, name, kind);
  if (isList(name) && typeof value === 'string') {
    const candidates = splitUrlList(name, value);
    return candidates.every((candidate) =>
      allowed(candidate, effective, policy)
    );
  }
  return allowed(value, effective, policy);
};

/**
 * Props with every refused URL removed.
 *
 * Returns the **same object** when nothing was refused, so the common path
 * allocates nothing and React's identity checks are unaffected.
 */
export const sanitizeUrlProps = (
  type: unknown,
  props: Record<string, unknown> | null | undefined,
  policy: UrlPolicy = defaultUrlPolicy,
  onRefused?: (message: string) => void
): Record<string, unknown> | null | undefined => {
  if (!props) {
    return props;
  }
  let sanitized: Record<string, unknown> | undefined;
  for (const [name, kind] of Object.entries(URL_PROPS)) {
    if (!Object.prototype.hasOwnProperty.call(props, name)) {
      continue;
    }
    const value = props[name];
    if (value === undefined || value === null) {
      continue;
    }
    if (!inspectable(type, value)) {
      continue;
    }
    if (permits(type, name, kind, String(value), policy)) {
      continue;
    }
    sanitized = sanitized ?? { ...props };
    delete sanitized[name];
    report(onRefused, name, value);
  }
  /*
    `data` is a URL on `<object>` and an ordinary prop everywhere else, so it
    cannot live in the table above - `<Foo data={{...}} />` must not be
    inspected as a URL.
  */
  if (
    typeof type === 'string' &&
    type.toLowerCase() === 'object' &&
    typeof props.data === 'string' &&
    !isAllowedUrl(props.data, policy)
  ) {
    sanitized = sanitized ?? { ...props };
    delete sanitized.data;
    report(onRefused, 'data', props.data);
  }
  return sanitized ?? props;
};

/**
 * The same policy, applied to a DOM subtree an engine rendered itself.
 *
 * Ractive owns its subtree and offers no hook for a bound attribute value, so
 * this runs immediately after it renders. That is a real difference from the
 * JSX profile, where the check happens *before* the element exists: here the
 * attribute is briefly present, so a `src` may already have started loading
 * even though it is removed in the same task. `javascript:` in an `href` -
 * the case that actually executes attacker code - needs a click, and is gone
 * long before one can arrive.
 */
export const sanitizeUrlAttributes = (
  root: Element | null | undefined,
  policy: UrlPolicy = defaultUrlPolicy,
  onRefused?: (message: string) => void
): number => {
  if (!root) {
    return 0;
  }
  let removed = 0;
  const names = Object.keys(URL_ATTRS);
  // Only `xlink:href` needs escaping, and `CSS.escape` is not guaranteed to
  // exist in every DOM implementation this runs in.
  const selector = names
    .map((name) => `[${name.replace(':', '\\:')}]`)
    .join(',');
  const candidates: Element[] = [
    ...(root.matches?.(selector) ? [root] : []),
    ...Array.from(root.querySelectorAll(selector)),
  ];
  for (const element of candidates) {
    const tag = element.tagName.toLowerCase();
    for (const name of names) {
      const value = element.getAttribute(name);
      if (value === null) {
        continue;
      }
      if (permits(tag, name, URL_ATTRS[name], value, policy)) {
        continue;
      }
      element.removeAttribute(name);
      removed += 1;
      report(onRefused, name, value);
    }
  }
  return removed;
};
