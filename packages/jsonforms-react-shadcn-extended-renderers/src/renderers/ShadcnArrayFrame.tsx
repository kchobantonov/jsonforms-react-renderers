import { ErrorIndicator } from '@chobantonov/jsonforms-react-shadcn-renderers';
import { useArrayPanelState } from '@chobantonov/jsonforms-react-renderer-common/arrayPanelState';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import type { EditorArrayFrameProps } from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from '@jsonforms-react-shadcn-ui/button';

export const ShadcnArrayFrame = ({
  options,
  config,
  label,
  description,
  errors,
  actions,
  children,
}: EditorArrayFrameProps) => {
  const panel = useArrayPanelState(options, config);
  return (
    <div className='shadcn-jsonforms-array'>
      <div className='flex items-center justify-between gap-2 pb-2'>
        <div className='flex items-center gap-2'>
          {label && <h3>{label}</h3>}
          {errors && <ErrorIndicator local errors={errors} />}
        </div>
        <div className='ml-auto flex gap-1'>
          {actions?.map((action) => (
            <Button
              key={action.key}
              type='button'
              size='icon-sm'
              variant={action.danger ? 'destructive' : 'default'}
              title={action.label}
              aria-label={action.label}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.icon}
            </Button>
          ))}
          {panel.collapsible && (
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={label || 'Array'}
              aria-expanded={!panel.collapsed}
              aria-controls={panel.contentId}
              onClick={panel.toggle}
            >
              {panel.collapsed ? (
                <ChevronDown aria-hidden='true' />
              ) : (
                <ChevronUp aria-hidden='true' />
              )}
            </Button>
          )}
        </div>
      </div>
      {description && (
        <p className='text-sm text-muted-foreground'>{description}</p>
      )}
      <div id={panel.contentId} hidden={panel.collapsed}>
        {children}
      </div>
    </div>
  );
};
