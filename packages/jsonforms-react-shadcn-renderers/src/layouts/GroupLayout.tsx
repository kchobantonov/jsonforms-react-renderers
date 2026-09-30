import { useContainerValidation } from '@chobantonov/jsonforms-react-renderer-common/validationIndicator';
import { ContainerValidationIndicator } from './ValidationIndicator';
import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ShadcnLayout } from './Layout';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@jsonforms-react-shadcn-ui/collapsible';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { useGroupState } from '../util/groupState';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';

export const ShadcnGroupLayout = (props: LayoutProps) => {
  const group = useGroupState(props.uischema, props.path, props.config);
  const t = useI18n();
  const validation = useContainerValidation(
    props.uischema,
    props.path,
    props.config,
    false
  );
  if (!props.visible) return null;

  const header = (
    <>
      <span className='shadcn-jsonforms-group-title'>{props.label}</span>
      <span className='shadcn-jsonforms-group-actions'>
        {validation.show && (
          <ContainerValidationIndicator count={validation.count} />
        )}
        {group.hasData && (
          <span
            role='img'
            aria-label={t('group.dataIndicator')}
            title={t('group.dataIndicator')}
            data-group-indicator
          >
            ●
          </span>
        )}
        {group.collapsible &&
          (group.collapsed ? (
            <ChevronDown aria-hidden='true' />
          ) : (
            <ChevronUp aria-hidden='true' />
          ))}
      </span>
    </>
  );

  return (
    <Collapsible
      className='shadcn-jsonforms-group'
      data-collapsible={group.collapsible || undefined}
      role='group'
      aria-label={props.label || undefined}
      open={!group.collapsed}
      onOpenChange={(open) => {
        if (group.collapsible && open === group.collapsed) group.toggle();
      }}
    >
      {group.collapsible ? (
        <CollapsibleTrigger
          render={<Button type='button' variant='ghost' />}
          className='shadcn-jsonforms-group-header'
          aria-label={props.label || 'Group'}
          aria-controls={group.contentId}
        >
          {header}
        </CollapsibleTrigger>
      ) : props.label || group.hasData || validation.show ? (
        <div className='shadcn-jsonforms-group-header'>{header}</div>
      ) : null}
      <CollapsibleContent
        className='shadcn-jsonforms-group-content'
        id={group.contentId}
        keepMounted
        hidden={group.collapsed}
      >
        <ShadcnLayout {...props} direction='column' />
      </CollapsibleContent>
    </Collapsible>
  );
};

export const groupTester: RankedTester = rankWith(2, uiTypeIs('Group'));
