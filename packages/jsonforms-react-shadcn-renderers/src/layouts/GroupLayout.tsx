import { ObjectDetailContext } from '../complex/ObjectDetailContext';
import { ErrorIndicator } from '../complex/ErrorIndicator';
import { ObjectErrorContext } from '@chobantonov/jsonforms-react-renderer-common/errorSummary';
import { useContainerValidation } from '@chobantonov/jsonforms-react-renderer-common/validationIndicator';
import { ContainerValidationIndicator } from './ValidationIndicator';
import {
  LayoutProps,
  RankedTester,
  UISchemaElement,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { useDynamicTreeResolver } from '@chobantonov/jsonforms-react-renderer-common/DynamicUiProvider';
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ShadcnLayout } from './Layout';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@jsonforms-react-shadcn-ui/collapsible';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@jsonforms-react-shadcn-ui/card';
import { useGroupState } from '../util/groupState';
import {
  useI18n,
  useTranslator,
} from '@chobantonov/jsonforms-react-renderer-common/translate';

export const ShadcnGroupLayout = (props: LayoutProps) => {
  const regions = props.uischema as typeof props.uischema & {
    cover?: UISchemaElement;
    header?: UISchemaElement[];
    i18n?: string;
    footer?: UISchemaElement[];
  };
  const renderRegion = (element: UISchemaElement, key: string) => (
    <JsonFormsDispatch
      key={key}
      schema={props.schema}
      uischema={element}
      path={props.path}
      enabled={props.enabled}
      renderers={props.renderers}
      cells={props.cells}
    />
  );
  const group = useGroupState(props.uischema, props.path, props.config);
  const t = useI18n();
  const translate = useTranslator();
  const footer = regions.footer;
  const hasRegions = Boolean(
    regions.cover || regions.header?.length || footer?.length,
  );
  const HeaderSection = hasRegions ? CardHeader : 'div';
  const resolveHeader = useDynamicTreeResolver(props.path);
  const headerLabel = regions.header
    ?.map(resolveHeader)
    .find((element) => element.type === 'Label') as
    | { text?: string; i18n?: string }
    | undefined;
  const headerTitle = headerLabel?.i18n
    ? translate(`${headerLabel.i18n}.text`, headerLabel.text || '')
    : headerLabel?.text;
  const validation = useContainerValidation(
    props.uischema,
    props.path,
    props.config,
    false,
  );
  const detail = React.useContext(ObjectDetailContext);
  const additional =
    detail?.uischema === props.uischema ? detail.additional : null;
  const object = React.useContext(ObjectErrorContext);
  const objectOwned = object?.uischema === props.uischema;
  const objectErrors = objectOwned ? object.message : '';
  if (!props.visible) return null;

  const header = (
    <>
      {!regions.header?.length && (
        <span className='shadcn-jsonforms-group-title'>{props.label}</span>
      )}
      <span className='shadcn-jsonforms-group-actions'>
        {objectOwned ? (
          objectErrors ? (
            <ErrorIndicator local errors={objectErrors} />
          ) : null
        ) : (
          validation.show && (
            <ContainerValidationIndicator count={validation.count} />
          )
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
      data-group-frame
      data-has-regions={hasRegions || undefined}
      data-collapsible={group.collapsible || undefined}
      role='group'
      aria-label={headerTitle || props.label || undefined}
      open={!group.collapsed}
      onOpenChange={(open) => {
        if (group.collapsible && open === group.collapsed) group.toggle();
      }}
    >
      {regions.cover && (
        <div className='shadcn-jsonforms-group-cover' data-group-cover>
          {renderRegion(regions.cover, 'cover')}
        </div>
      )}
      {group.collapsible ? (
        <HeaderSection className='shadcn-jsonforms-group-header px-0 gap-0'>
          {regions.header?.length ? (
            <div data-group-header>
              {regions.header.map((element, index) => (
                <div
                  className={
                    index === 0 ? 'group-header-title' : 'group-header-detail'
                  }
                  key={index}
                >
                  {renderRegion(element, `header-${index}`)}
                </div>
              ))}
            </div>
          ) : null}
          <CollapsibleTrigger
            render={<Button type='button' variant='ghost' />}
            aria-label={headerTitle || props.label || 'Group'}
            aria-controls={group.contentId}
          >
            {header}
          </CollapsibleTrigger>
        </HeaderSection>
      ) : props.label ||
        group.hasData ||
        objectErrors ||
        validation.show ||
        regions.header?.length ? (
        <HeaderSection className='shadcn-jsonforms-group-header px-0 gap-0'>
          {hasRegions ? (
            <CardTitle className='shadcn-jsonforms-group-heading'>
              {header}
            </CardTitle>
          ) : (
            header
          )}
          {regions.header?.length ? (
            <div data-group-header>
              {regions.header.map((element, index) => (
                <div
                  className={
                    index === 0 ? 'group-header-title' : 'group-header-detail'
                  }
                  key={index}
                >
                  {renderRegion(element, `header-${index}`)}
                </div>
              ))}
            </div>
          ) : null}
        </HeaderSection>
      ) : null}
      <CollapsibleContent
        className='shadcn-jsonforms-group-content'
        id={group.contentId}
        keepMounted
        hidden={group.collapsed}
      >
        {hasRegions ? (
          <CardContent className='shadcn-jsonforms-group-card-content px-0'>
            {(props.uischema as any).elements?.length > 0 && (
              <ShadcnLayout {...props} direction='column' />
            )}
            {additional}
          </CardContent>
        ) : (
          <>
            {(props.uischema as any).elements?.length > 0 && (
              <ShadcnLayout {...props} direction='column' />
            )}
            {additional}
          </>
        )}
        {group.collapsible && Boolean(footer?.length) && (
          <CardFooter
            className='shadcn-jsonforms-group-footer'
            data-group-footer
          >
            {footer?.map((element, index) =>
              renderRegion(element, `footer-${index}`),
            )}
          </CardFooter>
        )}
      </CollapsibleContent>
      {!group.collapsible && footer && footer.length > 0 && (
        <CardFooter className='shadcn-jsonforms-group-footer' data-group-footer>
          {footer.map((element, index) =>
            renderRegion(element, `footer-${index}`),
          )}
        </CardFooter>
      )}
    </Collapsible>
  );
};

export const groupTester: RankedTester = rankWith(2, uiTypeIs('Group'));
