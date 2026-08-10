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
    arraySchema,
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
            <Tooltip title={translations.up}>
              <Button
                shape='circle'
                aria-label={translations.upAriaLabel}
                icon={<ArrowUpOutlined rev={undefined} />}
                onClick={(event) => {
                  event.stopPropagation();
                  moveUp(path, rowIndex)();
                }}
                disabled={!enabled || !enableUp}
              />
            </Tooltip>
            <Tooltip title={translations.down}>
              <Button
                shape='circle'
                aria-label={translations.downAriaLabel}
                icon={<ArrowDownOutlined rev={undefined} />}
                onClick={(event) => {
                  event.stopPropagation();
                  moveDown(path, rowIndex)();
                }}
                disabled={!enabled || !enableDown}
              />
            </Tooltip>
          </>
        ) : null}
        <Tooltip key='tooltip-remove' title={translations.removeTooltip}>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              removeItems(path, [rowIndex])();
            }}
            shape='circle'
            disabled={!enabled || disableRemove}
            icon={<DeleteFilled rev={undefined} />}
            aria-label={translations.removeAriaLabel}
          />
        </Tooltip>
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
        <Collapse
          accordion
          expandIconPosition='end'
          onChange={(value: any) => handleChange(value)}
          items={map(range(data), (index) => {
            const childPath = composePaths(path, `${index}`);

            const text = childLabelForIndex(childPath, index);

            return {
              key: String(index),
              label: (
                <>
                  <Avatar aria-label='Index' style={avatarStyle}>
                    {index + 1}
                  </Avatar>
                  {text ? <Typography.Text>{text}</Typography.Text> : null}
                </>
              ),
              extra: (
                <Space>
                  {getExtra({
                    rowIndex: index,
                    enableUp: index !== 0,
                    enableDown: index !== props.data - 1,
                    showSortButtons: showSortButtons,
                    disableRemove: doDisableRemove,
                  })}
                </Space>
              ),
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
