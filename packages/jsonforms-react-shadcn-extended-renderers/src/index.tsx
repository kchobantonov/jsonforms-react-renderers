import {
  JsonFormsRendererRegistryEntry,
  RankedTester,
} from '@jsonforms/core';
import {
  buttonRendererTester,
  createButtonRenderer,
  createExtendedRenderers,
} from '@chobantonov/jsonforms-react-extended-renderers';
import React from 'react';

export type ShadcnExtendedRendererOptions = {
  components?: Record<string, React.ComponentType<any>>;
};

export const ShadcnButton = (props: React.ComponentPropsWithoutRef<'button'>) => (
  <button className='shadcn-jsonforms-button' {...props} />
);

export const ShadcnAlert = ({
  children,
  type,
  ...props
}: React.PropsWithChildren<{ type?: string }>) => (
  <div className={`shadcn-jsonforms-alert shadcn-jsonforms-alert-${type ?? 'info'}`} {...props}>
    {children}
  </div>
);

export const createShadcnExtendedRenderers = (
  options: ShadcnExtendedRendererOptions = {}
): JsonFormsRendererRegistryEntry[] => {
  const buttonRenderer = createButtonRenderer({
    ButtonComponent: ShadcnButton,
  });

  return [
    {
      tester: buttonRendererTester as RankedTester,
      renderer: buttonRenderer,
    },
    ...createExtendedRenderers({
      components: {
        Alert: ShadcnAlert,
        Button: ShadcnButton,
        ...(options.components ?? {}),
      },
      includeButtonRenderer: false,
    }),
  ];
};

export const shadcnExtendedRenderers = createShadcnExtendedRenderers();
export const advancedShadcnRenderers = shadcnExtendedRenderers;

export * from './theme';
export * from '@chobantonov/jsonforms-react-extended-renderers';
