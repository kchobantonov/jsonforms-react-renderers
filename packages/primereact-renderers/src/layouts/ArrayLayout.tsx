/*
  The MIT License

  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import { PrimeIcons } from 'primereact/api';

import {
  ArrayLayoutProps,
  ArrayTranslations,
  OwnPropsOfJsonFormsRenderer,
  Resolve,
  composePaths,
  computeLabel,
  createDefaultValue,
  findUISchema,
  getFirstPrimitiveProp,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  JsonFormsStateContext,
  withJsonFormsContext,
} from '@jsonforms/react';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import {
  Accordion,
  AccordionTab,
  AccordionTabChangeEvent,
} from 'primereact/accordion';
import map from 'lodash/map';
import merge from 'lodash/merge';
import range from 'lodash/range';
import React, { ComponentType, useCallback, useMemo, useState } from 'react';
import { ArrayLayoutToolbar } from './ArrayToolbar';

interface ExtraProps {
  rowIndex: number;
  enableUp: boolean;
  enableDown: boolean;
  showSortButtons: boolean;
  disableRemove?: boolean;
}

const ArrayLayoutComponent = (
  props: { ctx: JsonFormsStateContext } & ArrayLayoutProps & {
      translations: ArrayTranslations;
    }
) => {
  const [expanded, setExpanded] = useState<number | boolean>(false);
  const innerCreateDefaultValue = useCallback(
    () => createDefaultValue(props.schema, props.rootSchema),
    [props.schema]
  );
  const handleChange = useCallback(
    (tab: number) => (_event: any, expandedPanel: boolean) => {
      setExpanded(expandedPanel ? tab : false);
    },
    []
  );
  const {
    enabled,
    data,
    path,
    schema,
    uischema,
    errors,
    addItem,
    renderers,
    cells,
    label,
    required,
    rootSchema,
    config,
    uischemas,
    description,
    disableAdd,
    disableRemove,
    translations,
    moveUp,
    moveDown,
    removeItems,
  } = props;

  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const showSortButtons =
    appliedUiSchemaOptions.showSortButtons ||
    appliedUiSchemaOptions.showArrayLayoutSortButtons;

  const avatarStyle = useMemo(() => {
    const style: React.CSSProperties = { marginRight: '10px' };

    if (expanded) {
      style.backgroundColor = 'red';
    }
    return style;
  }, [expanded]);

  const getExtra = ({
    rowIndex,
    enableUp,
    enableDown,
    showSortButtons,
    disableRemove,
  }: ExtraProps) => {
    return (
      <>
        {showSortButtons ? (
          <>
            <Button
              tooltip={translations.up}
              aria-label={translations.upAriaLabel}
              icon={PrimeIcons.ARROW_UP}
              onClick={(event) => {
                event.stopPropagation();
                moveUp(path, rowIndex)();
              }}
              disabled={!enabled || !enableUp}
            />
            <Button
              tooltip={translations.down}
              aria-label={translations.downAriaLabel}
              icon={PrimeIcons.ARROW_DOWN}
              onClick={(event) => {
                event.stopPropagation();
                moveDown(path, rowIndex)();
              }}
              disabled={!enabled || !enableDown}
            />
          </>
        ) : null}
        <Button
          onClick={(event) => {
            event.stopPropagation();
            removeItems(path, [rowIndex])();
          }}
          tooltip={translations.removeTooltip}
          disabled={!enabled || disableRemove}
          icon={PrimeIcons.TRASH}
          aria-label={translations.removeAriaLabel}
        />
      </>
    );
  };

  const foundUISchema = useMemo(
    () =>
      findUISchema(
        uischemas,
        schema,
        uischema.scope,
        path,
        undefined,
        uischema,
        rootSchema
      ),
    [uischemas, schema, uischema.scope, path, uischema, rootSchema]
  );

  const arraySchema = Resolve.schema(rootSchema, uischema.scope, rootSchema);

  const doDisableAdd =
    disableAdd ||
    appliedUiSchemaOptions.disableAdd ||
    (appliedUiSchemaOptions.restrict &&
      arraySchema !== undefined &&
      arraySchema.maxItems !== undefined &&
      data >= arraySchema.maxItems);

  const doDisableRemove =
    disableRemove ||
    appliedUiSchemaOptions.disableRemove ||
    (appliedUiSchemaOptions.restrict &&
      arraySchema !== undefined &&
      arraySchema.minItems !== undefined &&
      data <= arraySchema.minItems);

  const childLabelForIndex = (childPath: string, index: number) => {
    const childLabelProp =
      uischema.options?.childLabelProp ?? getFirstPrimitiveProp(schema);
    if (!childLabelProp) {
      return `${index}`;
    }
    const labelValue = Resolve.data(
      props.ctx.core.data,
      composePaths(childPath, childLabelProp)
    );
    if (
      labelValue === undefined ||
      labelValue === null ||
      Number.isNaN(labelValue)
    ) {
      return '';
    }
    return `${labelValue}`;
  };

  return (
    <ArrayLayoutToolbar
      translations={translations}
      label={computeLabel(
        label,
        required,
        appliedUiSchemaOptions.hideRequiredAsterisk
      )}
      description={description}
      errors={errors}
      path={path}
      enabled={enabled}
      addItem={addItem}
      createDefault={innerCreateDefaultValue}
      disableAdd={doDisableAdd}
    >
      {data > 0 ? (
        <Accordion
          activeIndex={data}
          onTabChange={(e: AccordionTabChangeEvent) =>
            handleChange(e.index as number)
          }
        >
          {map(range(data), (index) => {
            const childPath = composePaths(path, `${index}`);

            const childLabel = childLabelForIndex(childPath, index);

            return (
              <AccordionTab
                header={
                  <>
                    <Avatar aria-label='Index' style={avatarStyle}>
                      {index + 1}
                    </Avatar>
                    <span>{childLabel}</span>
                    <div>
                      {getExtra({
                        rowIndex: index,
                        enableUp: index !== 0,
                        enableDown: index !== props.data - 1,
                        showSortButtons: showSortButtons,
                        disableRemove: doDisableRemove,
                      })}
                    </div>
                  </>
                }
                key={String(index)}
              >
                <JsonFormsDispatch
                  schema={schema}
                  uischema={foundUISchema}
                  path={childPath}
                  key={childPath}
                  renderers={renderers}
                  cells={cells}
                />
              </AccordionTab>
            );
          })}
        </Accordion>
      ) : (
        <p>{translations.noDataMessage}</p>
      )}
    </ArrayLayoutToolbar>
  );
};

export const withContextToJsonFormsRendererProps = (
  Component: ComponentType<ArrayLayoutProps>
): ComponentType<OwnPropsOfJsonFormsRenderer> =>
  function WithContextToJsonFormsRendererProps({
    ctx,
    props,
  }: JsonFormsStateContext & ArrayLayoutProps) {
    return <Component {...props} ctx={ctx} />;
  };

export const ArrayLayout = React.memo(
  withJsonFormsContext(
    withContextToJsonFormsRendererProps(ArrayLayoutComponent)
  )
);
