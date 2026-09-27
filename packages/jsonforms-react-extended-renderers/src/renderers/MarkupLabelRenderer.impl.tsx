import React from 'react';
import { MarkdownProfile, renderMarkdown } from '../util/markdown';
import { UrlPolicy } from '../util/urlPolicy';

export interface MarkdownTextProps {
  text: string;
  profile: MarkdownProfile;
  urlPolicy: UrlPolicy;
  onRefusedUrl?: (href: string) => void;
}

/**
 * The half of the markup label that needs the parser.
 *
 * Split into its own module so `import('./MarkupLabelRenderer.impl')` gives
 * the bundler a seam: a form with no Markdown label never downloads
 * markdown-it.
 */
export const MarkdownText = ({
  text,
  profile,
  urlPolicy,
  onRefusedUrl,
}: MarkdownTextProps) => (
  <>{renderMarkdown(text, { profile, urlPolicy, onRefusedUrl })}</>
);

export default MarkdownText;
