import { ArrayTranslations } from '@jsonforms/core';
import { PrimeIcons } from 'primereact/api';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import React from 'react';
import ValidationIcon from '../complex/ValidationIcon';
export interface ArrayLayoutToolbarProps {
  label: string;
  description: string;
  errors: string;
  path: string;
  enabled: boolean;
  addItem(path: string, data: any): () => void;
  createDefault(): any;
  translations: ArrayTranslations;
  disableAdd?: boolean;
  children?: React.ReactNode;
}

const renderTitle = (label: string, errors: string) => (
  <div className='grid'>
    <div className='col'>{label}</div>
    <div className='col' style={{ padding: '10px' }}>
      <ValidationIcon id='tooltip-validation' errorMessages={errors} />
    </div>
  </div>
);

export const ArrayLayoutToolbar = React.memo(function ArrayLayoutToolbar({
  label,
  description,
  errors,
  addItem,
  path,
  enabled,
  createDefault,
  translations,
  disableAdd,
  children,
}: ArrayLayoutToolbarProps) {
  return (
    <Card
      style={{ width: '100%' }}
      title={renderTitle(label, errors)}
      subTitle={description}
      header={
        enabled ? (
          <Button
            tooltip={translations.addTooltip}
            disabled={!enabled || disableAdd}
            aria-label={translations.addTooltip}
            onClick={addItem(path, createDefault())}
            icon={PrimeIcons.PLUS_CIRCLE}
          />
        ) : (
          <></>
        )
      }
    >
      {children}
    </Card>
  );
});
