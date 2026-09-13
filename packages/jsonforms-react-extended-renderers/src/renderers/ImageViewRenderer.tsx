import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';

export const imageViewRendererTester: RankedTester = rankWith(
  1,
  uiTypeIs('ImageView')
);

export const ImageViewRendererComponent = ({
  config,
  uischema,
  visible,
}: LayoutProps) => {
  const configuredSrc =
    uischema.options?.src !== undefined ? uischema.options.src : config?.src;
  const configuredAlt =
    uischema.options?.alt !== undefined ? uischema.options.alt : config?.alt;
  const src = typeof configuredSrc === 'string' ? configuredSrc : '';
  const alt = typeof configuredAlt === 'string' ? configuredAlt : '';

  return visible && src ? (
    <img src={src} alt={alt} style={{ maxWidth: '100%', height: 'auto' }} />
  ) : null;
};

export const ImageViewRenderer = withJsonFormsLayoutProps(
  ImageViewRendererComponent
);
