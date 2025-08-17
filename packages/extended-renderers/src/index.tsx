import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';
import {
  TemplateLayoutProps,
  TemplateLayoutRenderer,
  templateRendererTester,
} from './extended/TemplateLayoutRenderer';

export const createExtendedRenderers = (
  components?: Record<string, React.ComponentType<any>>
): JsonFormsRendererRegistryEntry[] => {
  // Wrap the TemplateLayoutRenderer with JSON Forms props
  const WrappedTemplateLayoutRenderer = withJsonFormsLayoutProps(
    (props: TemplateLayoutProps) => (
      <TemplateLayoutRenderer {...props} components={components} />
    )
  );

  return [
    {
      tester: templateRendererTester,
      renderer: WrappedTemplateLayoutRenderer,
    },
  ];
};
