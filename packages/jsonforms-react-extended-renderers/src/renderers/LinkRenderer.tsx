import {
  LayoutProps,
  RankedTester,
  UISchemaElement,
  deriveLabelForUISchemaElement,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import React from 'react';
import { isAllowedUrl, resolveUrlPolicy } from '../util/urlPolicy';

export type LinkElement = UISchemaElement & {
  type: 'Link';
  label?: string;
  href?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  rel?: string;
};

export const linkRendererTester: RankedTester = rankWith(1, uiTypeIs('Link'));

/**
 * `rel` for a link, given its target.
 *
 * `target="_blank"` hands the opened page a `window.opener` reference to this
 * one unless `noopener` is set, which lets it navigate the form away. The
 * specification makes `noopener` a MUST and `noreferrer` a SHOULD. An
 * author-supplied `rel` is kept and these are added to it rather than
 * replacing it.
 */
export const linkRel = (
  target: string | undefined,
  rel: string | undefined
): string | undefined => {
  const tokens = (rel ?? '').split(/\s+/).filter(Boolean);
  if (target === '_blank') {
    for (const required of ['noopener', 'noreferrer']) {
      if (!tokens.includes(required)) {
        tokens.push(required);
      }
    }
  }
  return tokens.length > 0 ? tokens.join(' ') : undefined;
};

export const LinkRendererComponent = ({
  uischema,
  visible,
  config,
  t,
}: LayoutProps & TranslateProps) => {
  const element = uischema as LinkElement;
  if (!visible) {
    return null;
  }
  // A Link has no scope, so - like a Group or a Category - only an explicit
  // `i18n` prefix can give it a translation key. Falling back to the href
  // keeps an unlabelled link readable rather than rendering nothing.
  const label =
    deriveLabelForUISchemaElement(element, t) ?? element.label ?? element.href;
  const href = element.href;
  const navigable =
    typeof href === 'string' &&
    href !== '' &&
    isAllowedUrl(href, resolveUrlPolicy(config));

  if (!navigable) {
    // Section 13: an empty href renders plain, non-navigating semantics rather
    // than inventing a destination. A URL the policy refuses is treated the
    // same way - the text stays visible, but it does not become a link.
    return <span data-link-inert>{label}</span>;
  }

  return (
    <a
      href={href}
      target={element.target}
      rel={linkRel(element.target, element.rel)}
    >
      {label}
    </a>
  );
};

export const LinkRenderer = withTranslateProps(
  withJsonFormsLayoutProps(LinkRendererComponent)
);
