import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import React from 'react';
import { ShadcnLayout } from './Layout';
import { Button } from '../components/ui/button';
import { useGroupState } from '../util/groupState';

export const ShadcnGroupLayout = (props: LayoutProps) => {
  const group = useGroupState(props.uischema, props.path, props.config);
  if (!props.visible) return null;

  return (
    <fieldset className='shadcn-jsonforms-group'>
      {props.label || group.collapsible || group.hasData ? (
        <legend>
          {props.label}
          {group.hasData && (
            <span role='img' aria-label='Contains data' data-group-indicator>
              ●
            </span>
          )}
          {group.collapsible && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={props.label || 'Group'}
              aria-expanded={!group.collapsed}
              aria-controls={group.contentId}
              onClick={group.toggle}
            >
              <span aria-hidden='true'>{group.collapsed ? '▸' : '▾'}</span>
            </Button>
          )}
        </legend>
      ) : null}
      <div id={group.contentId} hidden={group.collapsed}>
        <ShadcnLayout {...props} direction='column' />
      </div>
    </fieldset>
  );
};

export const groupTester: RankedTester = rankWith(2, uiTypeIs('Group'));
