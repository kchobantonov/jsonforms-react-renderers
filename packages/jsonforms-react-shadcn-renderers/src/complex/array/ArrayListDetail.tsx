import { ScrollRegion } from '../../components/ScrollRegion';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@jsonforms-react-shadcn-ui/resizable';
import { ArrayLayoutProps, composePaths } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import {
  Item,
  ItemGroup,
  ItemContent,
  ItemActions,
} from '@jsonforms-react-shadcn-ui/item';
import { Avatar, AvatarFallback } from '@jsonforms-react-shadcn-ui/avatar';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import type { ArrayItemViewProps } from './ArrayItemViewProps';
export function ArrayListDetail({
  schema,
  path,
  enabled,
  cells,
  renderers,
  detail,
  indices,
  count,
  label,
  readonly,
  selectedItem,
  emptyMessage,
  ...itemProps
}: ArrayItemViewProps &
  Pick<ArrayLayoutProps, 'label' | 'readonly'> & {
    count: number;
    selectedItem: number;
    onSelect: (index: number) => void;
    emptyMessage: () => string;
  }) {
  if (count === 0)
    return (
      <div className='py-6 text-center text-muted-foreground'>
        {emptyMessage()}
      </div>
    );
  const activeIndex = Math.min(selectedItem, count - 1);
  return (
    <ResizablePanelGroup orientation='horizontal' style={{ height: 'auto' }}>
      <ResizablePanel defaultSize='25%' minSize='15%' maxSize='60%'>
        <ScrollRegion
          className='shadcn-jsonforms-list-navigation'
          style={{ maxHeight: '20rem' }}
        >
          <ItemGroup
            className='min-w-0 rounded-lg border p-1'
            aria-label={label}
          >
            {indices.map((index) => {
              const selected = activeIndex === index;
              const itemLabel = itemProps.childLabelForIndex(
                composePaths(path, String(index)),
                index,
              );
              return (
                <ArrayListItem
                  key={index}
                  index={index}
                  selected={selected}
                  itemLabel={itemLabel}
                  {...itemProps}
                />
              );
            })}
          </ItemGroup>
        </ScrollRegion>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize='25%'>
        <div className='min-w-0 space-y-3 ps-3' role='tabpanel'>
          <JsonFormsDispatch
            schema={schema}
            uischema={detail}
            path={composePaths(path, String(activeIndex))}
            enabled={enabled && !readonly}
            renderers={renderers}
            cells={cells}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ArrayListItem({
  index,
  selected,
  itemLabel,
  hideAvatar,
  canRemove,
  removeLabel,
  removeTooltip,
  onSelect,
  requestRemove,
}: Pick<
  ArrayItemViewProps,
  'hideAvatar' | 'canRemove' | 'removeLabel' | 'removeTooltip' | 'requestRemove'
> & {
  index: number;
  selected: boolean;
  itemLabel: string;
  onSelect: (index: number) => void;
}) {
  return (
    <Item
      role='listitem'
      size='sm'
      variant={selected ? 'muted' : 'default'}
      className='flex-nowrap gap-1 p-1'
    >
      <ItemContent className='min-w-0'>
        <Button
          type='button'
          variant='ghost'
          className='h-auto min-h-12 w-full min-w-0 justify-start gap-3 whitespace-nowrap text-left'
          aria-pressed={selected}
          aria-label={itemLabel || String(index + 1)}
          onClick={() => onSelect(index)}
        >
          {!hideAvatar && (
            <Avatar className='border'>
              <AvatarFallback>{index + 1}</AvatarFallback>
            </Avatar>
          )}
          <span className='min-w-0 flex-1 truncate'>{itemLabel}</span>
          {selected && (
            <Check className='h-4 w-4 shrink-0' aria-hidden='true' />
          )}
        </Button>
      </ItemContent>
      <ItemActions className='shrink-0'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-6 w-6 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive'
          aria-label={removeLabel}
          title={removeTooltip}
          disabled={!canRemove}
          onClick={() => requestRemove(index)}
        >
          <Trash2 className='h-3 w-3' aria-hidden='true' />
        </Button>
      </ItemActions>
    </Item>
  );
}
