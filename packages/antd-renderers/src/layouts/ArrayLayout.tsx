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
import ArrowDownOutlined from '@ant-design/icons/ArrowDownOutlined';
import ArrowUpOutlined from '@ant-design/icons/ArrowUpOutlined';
import DeleteFilled from '@ant-design/icons/DeleteFilled';
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
import {
  Avatar,
  Button,
  Collapse,
  Empty,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import get from 'lodash/get';
import map from 'lodash/map';
import merge from 'lodash/merge';
import range from 'lodash/range';
import React, { ComponentType, useCallback, useMemo, useState } from 'react';
import { ArrayLayoutToolbar } from './ArrayToolbar';

const ArrayLayoutComponent = (
  props: { ctx: JsonFormsStateContext } & ArrayLayoutProps & {
      translations: ArrayTranslations;
    }
) => {
  const [expanded, setExpanded] = useState<string | boolean>(false);
  const innerCreateDefaultValue = useCallback(
    () => createDefaultValue(props.schema, props.rootSchema),
    [props.schema]
  );
  const handleChange = useCallback(
    (panel: string) => (_event: any, expandedPanel: boolean) => {
      setExpanded(expandedPanel ? panel : false);
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

  const getExtra = (data: number, index: number) => {
    return (
      <>
        {showSortButtons && enabled ? (
          <>
            <Tooltip key='tooltip-up' title={translations.up}>
              <Button
                onClick={moveUp(path, index)}
                shape='circle'
                icon={<ArrowUpOutlined rev={undefined} />}
                disabled={index == 0}
                aria-label={translations.upAriaLabel}
              />
            </Tooltip>
            <Tooltip key='tooltip-down' title={translations.down}>
              <Button
                onClick={moveDown(path, index)}
                shape='circle'
                icon={<ArrowDownOutlined rev={undefined} />}
                disabled={index >= data - 1}
                aria-label={translations.downAriaLabel}
              />
            </Tooltip>
          </>
        ) : null}
        {enabled ? (
          <Tooltip key='tooltip-remove' title={translations.removeTooltip}>
            <Button
              onClick={removeItems(path, [index])}
              shape='circle'
              icon={<DeleteFilled rev={undefined} />}
              aria-label={translations.removeAriaLabel}
            />
          </Tooltip>
        ) : null}
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
  const doDisableAdd = disableAdd || appliedUiSchemaOptions.disableAdd;
  const doDisableRemove = disableRemove || appliedUiSchemaOptions.disableRemove;
  if (doDisableRemove) {
    // TODO
  }

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
        <Collapse
          accordion
          onChange={(value: any) => handleChange(value)}
          items={map(range(data), (index) => {
            const childPath = composePaths(path, `${index}`);
            const childData = Resolve.data(props.ctx.core.data, childPath);
            const childLabel = appliedUiSchemaOptions.elementLabelProp
              ? get(childData, appliedUiSchemaOptions.elementLabelProp, '')
              : get(childData, getFirstPrimitiveProp(schema), '');

            return {
              key: String(index),
              label: (
                <>
                  <Avatar aria-label='Index' style={avatarStyle}>
                    {index + 1}
                  </Avatar>
                  {!childLabel ? (
                    <Typography.Text>{childLabel}</Typography.Text>
                  ) : null}
                </>
              ),
              extra: <Space>{getExtra(data, index)}</Space>,
              children: (
                <JsonFormsDispatch
                  schema={schema}
                  uischema={foundUISchema}
                  path={childPath}
                  key={childPath}
                  renderers={renderers}
                  cells={cells}
                />
              ),
            };
          })}
        ></Collapse>
      ) : (
        <Empty description={translations.noDataMessage} />
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
