import { JSONFORMS_EXTENDED_CONFIG_KEY } from './configNamespaces';

/**
 * Which URLs a URL-bearing element may navigate to or load.
 *
 * Section 12 of the specification makes this a MUST for every URL-bearing
 * value - `Link.href`, `ImageView.src`, Markdown links and images - and fixes
 * the defaults below for when no configuration is supplied.
 */
export interface UrlPolicy {
  allowedSchemes: string[];
  allowRelative: boolean;
  allowImageDataUrls: boolean;
}

export const defaultUrlPolicy: UrlPolicy = {
  allowedSchemes: ['https', 'http', 'mailto'],
  allowRelative: true,
  allowImageDataUrls: false,
};

/** Reads `config.jsonformsExtended.security.urlPolicy`, filling in defaults. */
export const resolveUrlPolicy = (config: unknown): UrlPolicy => {
  const extended = (config as Record<string, unknown> | undefined)?.[
    JSONFORMS_EXTENDED_CONFIG_KEY
  ] as Record<string, unknown> | undefined;
  const security = extended?.security as Record<string, unknown> | undefined;
  const supplied = security?.urlPolicy as Partial<UrlPolicy> | undefined;
  if (!supplied) {
    return defaultUrlPolicy;
  }
  return {
    allowedSchemes: Array.isArray(supplied.allowedSchemes)
      ? supplied.allowedSchemes.map((scheme) => String(scheme).toLowerCase())
      : defaultUrlPolicy.allowedSchemes,
    allowRelative:
      supplied.allowRelative === undefined
        ? defaultUrlPolicy.allowRelative
        : supplied.allowRelative === true,
    allowImageDataUrls:
      supplied.allowImageDataUrls === undefined
        ? defaultUrlPolicy.allowImageDataUrls
        : supplied.allowImageDataUrls === true,
  };
};

/** `scheme:` at the start of a URL. Deliberately strict about what counts. */
const SCHEME = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;

/**
 * Whether a URL may be used, under the supplied policy.
 *
 * A URL with no scheme is relative and governed by `allowRelative`. A URL with
 * a scheme must name one the policy allows - so `javascript:`, `data:` and
 * `vbscript:` are refused by default rather than being rendered into an
 * anchor. Protocol-relative `//host/path` counts as absolute, because it
 * inherits the page's scheme and can leave the origin.
 *
 * Leading control characters and whitespace are stripped before the test:
 * `java\\nscript:alert(1)` is a scheme, and browsers treat it as one.
 */
export const isAllowedUrl = (
  url: unknown,
  policy: UrlPolicy = defaultUrlPolicy
): boolean => {
  if (typeof url !== 'string') {
    return false;
  }
  // eslint-disable-next-line no-control-regex
  const candidate = url.replace(/[\u0000- ]/g, '');
  if (candidate === '') {
    // An empty href is explicitly allowed by section 13; the Link renderer
    // gives it non-navigating semantics rather than inventing a destination.
    return true;
  }
  if (candidate.startsWith('//')) {
    return false;
  }
  const scheme = SCHEME.exec(candidate)?.[1]?.toLowerCase();
  if (scheme === undefined) {
    return policy.allowRelative;
  }
  return policy.allowedSchemes.includes(scheme);
};

/** `data:image/<subtype>;...` - an inline image, and nothing else. */
const IMAGE_DATA_URL = /^data:image\/[a-zA-Z0-9.+-]+[;,]/;

/**
 * Whether a URL may be **loaded as an image**.
 *
 * Same policy as {@link isAllowedUrl}, plus `allowImageDataUrls`: a
 * `data:image/...` URL is a reasonable way to inline a small asset, and is
 * nothing like a `data:text/html` document handed to a link. The flag only
 * opens inline *images* - a `data:` URL of any other media type stays refused
 * whatever it is used for, so turning this on cannot become a way to smuggle
 * a document in.
 *
 * It is off by default, because an inline payload bypasses whatever CSP
 * `img-src` allow-list the host maintains.
 */
export const isAllowedImageUrl = (
  url: unknown,
  policy: UrlPolicy = defaultUrlPolicy
): boolean => {
  if (
    policy.allowImageDataUrls &&
    typeof url === 'string' &&
    // eslint-disable-next-line no-control-regex
    IMAGE_DATA_URL.test(url.replace(/[\u0000- ]/g, ''))
  ) {
    return true;
  }
  return isAllowedUrl(url, policy);
};
