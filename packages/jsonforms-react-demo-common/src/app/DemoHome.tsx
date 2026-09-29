import React from 'react';
import type { ExampleDescription } from '@jsonforms/examples';
import type { DemoUi } from './types';
import { DefaultDemoTypography } from '../DefaultDemoTypography';

/**
 * The landing page, shown when no example is selected.
 */
export interface DemoHomeProps {
  Ui: DemoUi;
  brand: string;
  rendererName: string;
  logoSrc?: string;
  examples: ExampleDescription[];
  changeExample: (name: string) => void;
}

export const DemoHome = ({
  Ui,
  brand,
  rendererName,
  logoSrc,
  examples,
  changeExample,
}: DemoHomeProps): React.JSX.Element => {
  const { Button: UiButton, Typography: UiTypography = DefaultDemoTypography } =
    Ui;

  return (
    <section className='demo-home'>
      {logoSrc ? (
        <img className='demo-home-logo' src={logoSrc} alt={`${brand} logo`} />
      ) : (
        <div className='demo-home-mark'>{brand[0]}</div>
      )}
      <UiTypography component='p' className='demo-home-eyebrow'>
        JSON Forms renderer set
      </UiTypography>
      <UiTypography component='h1'>
        Welcome to JSON Forms React {rendererName}
      </UiTypography>
      <UiTypography component='p' className='demo-home-tagline'>
        More Forms. Less Code.
      </UiTypography>
      <UiButton onClick={() => changeExample(examples[0].name)}>
        Open Demo
      </UiButton>
    </section>
  );
};
