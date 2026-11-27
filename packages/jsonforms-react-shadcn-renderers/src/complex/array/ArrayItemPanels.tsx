import { ItemValidationIndicator } from '@chobantonov/jsonforms-react-renderer-common/validation/ItemValidationIndicator';
import { ContainerValidationIndicator } from '../../layouts/ValidationIndicator';
import { resolveCollapsed } from '@chobantonov/jsonforms-react-renderer-common/layout/groupState';
import { ArrayLayoutProps, composePaths } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import React from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@jsonforms-react-shadcn-ui/collapsible';
import type { ArrayItemViewProps } from './ArrayItemViewProps';
const ArrayItemPanel = ({
  label,
  index,
  initiallyOpen,
  hideAvatar,
  actions,
  indicator,
  children,
}: React.PropsWithChildren<{
  label: string;
  index: number;
  initiallyOpen: boolean;
  hideAvatar: boolean;
  actions: React.ReactNode;
  indicator: React.ReactNode;
}>) => {
  const [open, setOpen] = React.useState(initiallyOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className='shadcn-jsonforms-array-item'
    >
      <div className='relative flex items-center'>
        <CollapsibleTrigger
          render={<Button type='button' variant='ghost' />}
          className='h-auto min-w-0 flex-1 justify-start gap-3 whitespace-normal text-left'
          aria-label={label || String(index + 1)}
        >
          {!hideAvatar && (
            <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground'>
              {index + 1}
            </span>
          )}
          <span className='flex min-w-0 flex-1 items-center gap-2 pe-10'>
            <span className='min-w-0'>{label}</span>
            <span className='flex shrink-0 items-center leading-none'>
              {indicator}
            </span>
          </span>
          {open ? (
            <ChevronUp aria-hidden='true' />
          ) : (
            <ChevronDown aria-hidden='true' />
          )}
        </CollapsibleTrigger>
        <div className='absolute right-10 flex items-center gap-1'>
          {actions}
        </div>
      </div>
      <CollapsibleContent keepMounted hidden={!open} className='px-3 pb-3'>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export function ArrayItemPanels({
  schema,
  path,
  enabled,
  cells,
  renderers,
  detail,
  indices,
  hideAvatar,
  canRemove,
  requestRemove,
  childLabelForIndex,
  removeLabel,
  removeTooltip,
  config,
  uischema,
  addedItem,
}: ArrayItemViewProps &
  Pick<ArrayLayoutProps, 'config' | 'uischema'> & {
    addedItem?: { index: number; open: boolean };
  }) {
  return (
    <>
      {indices.map((index) => {
        const childPath = composePaths(path, `${index}`);
        const childLabel = childLabelForIndex(childPath, index);
        return (
          <ArrayItemPanel
            key={childPath}
            label={childLabel}
            indicator={
              <ItemValidationIndicator
                Indicator={ContainerValidationIndicator}
                path={childPath}
                options={uischema.options}
                config={config}
              />
            }
            index={index}
            initiallyOpen={
              index === addedItem?.index
                ? addedItem.open
                : index === 0 &&
                  !resolveCollapsed(uischema.options, config, 'array')
            }
            hideAvatar={hideAvatar}
            actions={
              <>
                {' '}
                <Button
                  variant='destructive'
                  size='icon'
                  className='h-7 w-7'
                  aria-label={removeLabel || 'Remove'}
                  title={removeTooltip || 'Remove item'}
                  type='button'
                  disabled={!canRemove}
                  onClick={() => requestRemove(index)}
                >
                  <Trash2 className='h-4 w-4' aria-hidden='true' />
                </Button>
              </>
            }
          >
            <JsonFormsDispatch
              schema={schema}
              uischema={detail}
              path={childPath}
              enabled={enabled}
              renderers={renderers}
              cells={cells}
            />
          </ArrayItemPanel>
        );
      })}
    </>
  );
}
