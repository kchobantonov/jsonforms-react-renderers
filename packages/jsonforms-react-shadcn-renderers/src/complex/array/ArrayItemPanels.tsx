import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import { ItemValidationIndicator } from '@chobantonov/jsonforms-react-renderer-common/validation/ItemValidationIndicator';
import { ContainerValidationIndicator } from '../../layouts/ValidationIndicator';
import { ArrayLayoutProps, composePaths } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import React from 'react';
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
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
  open,
  onOpenChange,
  hideAvatar,
  actions,
  indicator,
  children,
}: React.PropsWithChildren<{
  label: string;
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hideAvatar: boolean;
  actions: React.ReactNode;
  indicator: React.ReactNode;
}>) => {
  const t = useI18n();
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className='shadcn-jsonforms-array-item'
    >
      <div className='relative flex items-center'>
        <CollapsibleTrigger
          render={<Button type='button' variant='ghost' />}
          className='h-auto min-w-0 flex-1 justify-start gap-3 whitespace-normal text-left'
          aria-label={label || String(index + 1)}
        >
          {!hideAvatar && (
            <span
              data-array-index
              aria-label={`${t('array.indexLabel')} ${index + 1}`}
              className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground'
            >
              {index + 1}
            </span>
          )}
          <span className='flex min-w-0 flex-1 items-center gap-2 pe-10'>
            <span className='min-w-0'>
              {hideAvatar ? `${index + 1} ${label}` : label}
            </span>
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

type ArrayItemPanelsProps = ArrayItemViewProps &
  Pick<ArrayLayoutProps, 'config' | 'uischema'> & {
    expandedIndex?: number;
    onExpand: (index: number | undefined) => void;
    onMove: (index: number, direction: -1 | 1) => void;
    canMove: boolean;
    count: number;
    translations: {
      upAriaLabel: string;
      up: string;
      downAriaLabel: string;
      down: string;
    };
  };

const ArrayItemActions = ({
  index,
  settings,
}: {
  index: number;
  settings: ArrayItemPanelsProps;
}) => {
  const t = useI18n();
  const {
    uischema,
    config,
    translations,
    canMove,
    count,
    removeLabel,
    removeTooltip,
    canRemove,
    onMove,
    requestRemove,
  } = settings;
  return (
    <>
      {(uischema.options?.showSortButtons ?? config?.showSortButtons) && (
        <>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={translations.upAriaLabel}
            title={translations.up}
            disabled={!canMove || index === 0}
            onClick={() => onMove(index, -1)}
          >
            <ArrowUp aria-hidden='true' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={translations.downAriaLabel}
            title={translations.down}
            disabled={!canMove || index === count - 1}
            onClick={() => onMove(index, 1)}
          >
            <ArrowDown aria-hidden='true' />
          </Button>
        </>
      )}
      <Button
        variant='destructive'
        size='icon'
        className='h-7 w-7'
        aria-label={removeLabel || t('array.removeAriaLabel')}
        title={removeTooltip || t('array.removeTooltip')}
        type='button'
        disabled={!canRemove}
        onClick={() => requestRemove(index)}
      >
        <Trash2 className='h-4 w-4' aria-hidden='true' />
      </Button>
    </>
  );
};

export function ArrayItemPanels(props: ArrayItemPanelsProps) {
  const {
    schema,
    path,
    enabled,
    cells,
    renderers,
    detail,
    indices,
    hideAvatar,
    childLabelForIndex,
    config,
    uischema,
    expandedIndex,
    onExpand,
  } = props;
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
            open={expandedIndex === index}
            onOpenChange={(open) => onExpand(open ? index : undefined)}
            hideAvatar={hideAvatar}
            actions={<ArrayItemActions index={index} settings={props} />}
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
