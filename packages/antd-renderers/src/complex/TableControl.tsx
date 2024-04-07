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
import isEmpty from 'lodash/isEmpty';
import union from 'lodash/union';
import {
  DispatchCell,
  JsonFormsStateContext,
  useJsonForms,
} from '@jsonforms/react';
import startCase from 'lodash/startCase';
import range from 'lodash/range';
import React from 'react';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteFilled,
} from '@ant-design/icons';
import { Button, Form, Table, Tooltip } from 'antd';
import {
  ArrayLayoutProps,
  ControlElement,
  errorsAt,
  formatErrorMessage,
  JsonSchema,
  Paths,
  Resolve,
  JsonFormsRendererRegistryEntry,
  JsonFormsCellRendererRegistryEntry,
  encode,
} from '@jsonforms/core';
import Hidden from '../util/Hidden';

import { WithDeleteDialogSupport } from './DeleteDialog';
import TableToolbar from './TableToolbar';
import { ErrorObject } from 'ajv';
import merge from 'lodash/merge';

const RenderActionsCell = (
  props: ArrayLayoutProps & WithDeleteDialogSupport & any
) => {
  const {
    data,
    config,
    uischema,
    path,
    index,
    moveUp,
    moveDown,
    openDeleteDialog,
    translations,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const childPath = Paths.compose(path, `${index}`);

  return (
    <div>
      {appliedUiSchemaOptions.showSortButtons ? (
        <>
          <Tooltip title='Move up'>
            <Button
              shape='circle'
              aria-label={translations.upAriaLabel}
              icon={<ArrowUpOutlined rev={undefined} />}
              onClick={moveUp(path, index)}
              disabled={index <= 0}
            />
          </Tooltip>
          <Tooltip title='Move down'>
            <Button
              shape='circle'
              aria-label={translations.downAriaLabel}
              icon={<ArrowDownOutlined rev={undefined} />}
              onClick={moveDown(path, index)}
              disabled={index >= data - 1}
            />
          </Tooltip>
        </>
      ) : null}
      <Tooltip title='Delete'>
        <Button
          aria-label={translations.removeAriaLabel}
          icon={<DeleteFilled rev={undefined} />}
          onClick={() => openDeleteDialog(childPath, index)}
        />
      </Tooltip>
    </div>
  );
};

const generateColumns = (props: ArrayLayoutProps) => {
  const { path, schema, enabled, renderers, cells } = props;

  if (schema.type === 'object') {
    return getValidColumnProps(schema).map((prop) => {
      const column = {
        dataIndex: prop,
        editable: enabled,
        title: schema.properties?.[prop]?.title ?? startCase(prop),
        render: (
          _field: any,
          row: { index: number; key: number },
          _index: number
        ) => {
          const rowPath = Paths.compose(path, `${row.index}`);

          return (
            <RenderCell
              schema={schema}
              propName={prop}
              rowPath={rowPath}
              enabled={enabled}
              renderers={renderers}
              cells={cells}
            />
          );
        },
      };

      return column;
    });
  } else {
    // primitives
    const columns = [
      {
        editable: enabled,
        render: (
          _field: any,
          row: { index: number; key: number },
          _index: number
        ) => {
          const rowPath = Paths.compose(path, `${row.index}`);

          return (
            <RenderCell
              schema={schema}
              rowPath={rowPath}
              enabled={enabled}
              renderers={renderers}
              cells={cells}
            />
          );
        },
      },
    ];
    return columns;
  }
};

const withActionsColumn = (columns: any, props: ArrayLayoutProps) => {
  const appliedUiSchemaOptions = merge(
    {},
    props.config,
    props.uischema.options
  );
  const width = appliedUiSchemaOptions.showSortButtons ? 150 : 50;

  return props.enabled
    ? columns.concat([
        {
          dataIndex: '',
          title: '',
          editable: true,
          width,
          render: (_field: any, _row: any, index: number) => {
            return <RenderActionsCell {...{ index, ...props }} />;
          },
        },
      ])
    : columns;
};

const getValidColumnProps = (scopedSchema: JsonSchema) => {
  if (
    scopedSchema.type === 'object' &&
    typeof scopedSchema.properties === 'object'
  ) {
    return Object.keys(scopedSchema.properties).filter(
      (prop) => scopedSchema.properties[prop].type !== 'array'
    );
  }
  // primitives
  return [''];
};

interface RenderCellProps extends OwnPropsOfRenderCell {
  rootSchema: JsonSchema;
  errors: string;
  path: string;
  enabled: boolean;
}

interface OwnPropsOfRenderCell {
  rowPath: string;
  propName?: string;
  schema: JsonSchema;
  enabled: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
}

const ctxToRenderCellProps = (
  ctx: JsonFormsStateContext,
  ownProps: OwnPropsOfRenderCell
): RenderCellProps => {
  const path =
    ownProps.rowPath +
    (ownProps.schema.type === 'object' ? '.' + ownProps.propName : '');
  const errors = formatErrorMessage(
    union(
      errorsAt(
        path,
        ownProps.schema,
        (p) => p === path
      )(ctx.core.errors).map((error: ErrorObject) => error.message)
    )
  );
  return {
    rowPath: ownProps.rowPath,
    propName: ownProps.propName,
    schema: ownProps.schema,
    rootSchema: ctx.core.schema,
    errors,
    path,
    enabled: ownProps.enabled,
    cells: ownProps.cells || ctx.cells,
    renderers: ownProps.renderers || ctx.renderers,
  };
};

const controlWithoutLabel = (scope: string): ControlElement => ({
  type: 'Control',
  scope: scope,
  label: false,
});

const RenderCell = (ownProps: OwnPropsOfRenderCell) => {
  const ctx = useJsonForms();
  const {
    path,
    propName,
    schema,
    rootSchema,
    errors,
    enabled,
    renderers,
    cells,
  } = ctxToRenderCellProps(ctx, ownProps);

  const isValid = isEmpty(errors);
  return (
    <Form.Item
      hasFeedback={!isValid}
      validateStatus={isValid ? 'success' : 'error'}
      help={errors}
      style={{ marginBottom: 0 }}
    >
      {schema.properties ? (
        <DispatchCell
          schema={Resolve.schema(
            schema,
            `#/properties/${encode(propName)}`,
            rootSchema
          )}
          uischema={controlWithoutLabel(`#/properties/${encode(propName)}`)}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      ) : (
        <DispatchCell
          schema={schema}
          uischema={controlWithoutLabel('#')}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      )}
    </Form.Item>
  );
};

export class TableControl extends React.Component<
  ArrayLayoutProps & WithDeleteDialogSupport,
  any
> {
  addItem = (path: string, value: any) => this.props.addItem(path, value);
  render() {
    const {
      label,
      description,
      path,
      schema,
      rootSchema,
      uischema,
      errors,
      visible,
      enabled,
      translations,
      data,
    } = this.props;

    const controlElement = uischema as ControlElement;

    const columns: any = withActionsColumn(
      generateColumns(this.props),
      this.props
    );
    const dataSource = range(data).map((index) => ({ index, key: index }));

    return (
      <Hidden hidden={!visible}>
        <TableToolbar
          errors={errors}
          label={label}
          description={description}
          addItem={this.addItem}
          path={path}
          uischema={controlElement}
          schema={schema}
          rootSchema={rootSchema}
          enabled={enabled}
          translations={translations}
        >
          <Table
            columns={columns}
            dataSource={dataSource}
            showHeader={schema.type === 'object'}
            pagination={{ hideOnSinglePage: true }}
          ></Table>
        </TableToolbar>
      </Hidden>
    );
  }
}
