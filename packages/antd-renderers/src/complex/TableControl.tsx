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
  ControlElement,
  errorsAt,
  formatErrorMessage,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  Paths,
} from '@jsonforms/core';
import { JsonFormsStateContext, useJsonForms } from '@jsonforms/react';
import { Button, Table, TableColumnProps, Tooltip } from 'antd';
import range from 'lodash/range';
import startCase from 'lodash/startCase';
import union from 'lodash/union';
import React, { useMemo } from 'react';

import { ErrorObject } from 'ajv';
import merge from 'lodash/merge';
import { WithDeleteDialogSupport } from './DeleteDialog';
import DataCell, { DataCellProps } from './DataCell';
import TableToolbar from './TableToolbar';

const generateDataColumns = (props: ArrayLayoutProps): TableColumnProps[] => {
  const { path, schema, enabled, cells } = props;

  if (schema.type === 'object') {
    return getValidColumnProps(schema).map((prop) => {
      const props = {
        propName: prop,
        schema,
        title: schema.properties?.[prop]?.title ?? startCase(prop),
        enabled,
        cells,
      };
      return {
        dataIndex: props.propName,
        title: props.title,
        render: (
          _field: any,
          row: { index: number; key: number },
          _index: number
        ) => {
          const rowPath = Paths.compose(path, `${row.index}`);

          return <RowDataCell {...props} rowPath={rowPath}></RowDataCell>;
        },
      } as TableColumnProps;
    });
  } else {
    // primitives
    const props = {
      schema,
      enabled,
    };
    return [
      {
        render: (
          _field: any,
          row: { index: number; key: number },
          _index: number
        ) => {
          const rowPath = Paths.compose(path, `${row.index}`);

          return <RowDataCell {...props} rowPath={rowPath}></RowDataCell>;
        },
      },
    ];
  }
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

interface RowDataCellProps {
  rowPath: string;
  propName?: string;
  schema: JsonSchema;
  enabled: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
}

const ctxToDataCellProps = (
  ctx: JsonFormsStateContext,
  ownProps: RowDataCellProps
): DataCellProps => {
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

const RowDataCell = (ownProps: RowDataCellProps) => {
  const ctx = useJsonForms();
  const dataCellProps = ctxToDataCellProps(ctx, ownProps);

  return <DataCell {...dataCellProps} />;
};

interface ActionCellProps {
  childPath: string;
  rowIndex: number;
  moveUpCreator: (path: string, position: number) => () => void;
  moveDownCreator: (path: string, position: number) => () => void;
  enableUp: boolean;
  enableDown: boolean;
  showSortButtons: boolean;
  path: string;
  translations: ArrayTranslations;
  disableRemove?: boolean;
}

const ActionCell = ({
  childPath,
  rowIndex,
  openDeleteDialog,
  moveUpCreator,
  moveDownCreator,
  enableUp,
  enableDown,
  showSortButtons,
  path,
  translations,
  disableRemove,
}: ActionCellProps & WithDeleteDialogSupport) => {
  const moveUp = useMemo(
    () => moveUpCreator(path, rowIndex),
    [moveUpCreator, path, rowIndex]
  );
  const moveDown = useMemo(
    () => moveDownCreator(path, rowIndex),
    [moveDownCreator, path, rowIndex]
  );

  return (
    <div>
      {showSortButtons ? (
        <>
          <Tooltip title={translations.up}>
            <Button
              shape='circle'
              aria-label={translations.upAriaLabel}
              icon={<ArrowUpOutlined rev={undefined} />}
              onClick={moveUp}
              disabled={!enableUp}
            />
          </Tooltip>
          <Tooltip title={translations.down}>
            <Button
              shape='circle'
              aria-label={translations.downAriaLabel}
              icon={<ArrowDownOutlined rev={undefined} />}
              onClick={moveDown}
              disabled={!enableDown}
            />
          </Tooltip>
        </>
      ) : null}
      {!disableRemove ? (
        <Tooltip title={translations.removeTooltip}>
          <Button
            aria-label={translations.removeAriaLabel}
            icon={<DeleteFilled rev={undefined} />}
            onClick={() => openDeleteDialog(childPath, rowIndex)}
          />
        </Tooltip>
      ) : null}
    </div>
  );
};

interface GenerateColumns extends ArrayLayoutProps, WithDeleteDialogSupport {
  moveUpCreator: (path: string, position: number) => () => void;
  moveDownCreator: (path: string, position: number) => () => void;
  showSortButtons: boolean;
  path: string;
  translations: ArrayTranslations;
  disableRemove?: boolean;
}

const generateColumns = (props: GenerateColumns) => {
  const path = props.path;
  const width = props.showSortButtons ? 150 : 50;

  return generateDataColumns(props).concat(
    props.enabled
      ? [
          {
            dataIndex: '',
            title: '',
            width: width,
            render: (
              _field: any,
              row: { index: number; key: number },
              _index: number
            ) => {
              const rowIndex = row.index;
              const childPath = Paths.compose(path, `${rowIndex}`);

              const enableUp = rowIndex !== 0;
              const enableDown = rowIndex !== props.data - 1;

              return (
                <ActionCell
                  {...props}
                  enableUp={enableUp}
                  enableDown={enableDown}
                  rowIndex={rowIndex}
                  childPath={childPath}
                />
              );
            },
          },
        ]
      : []
  );
};

export class TableControl extends React.Component<
  ArrayLayoutProps &
    WithDeleteDialogSupport & { translations: ArrayTranslations },
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
      openDeleteDialog,
      moveUp,
      moveDown,
      visible,
      enabled,
      translations,
      disableAdd,
      disableRemove,
      config,
      data,
    } = this.props;

    const appliedUiSchemaOptions = merge({}, config, uischema.options);
    const doDisableAdd = disableAdd || appliedUiSchemaOptions.disableAdd;
    const doDisableRemove =
      disableRemove || appliedUiSchemaOptions.disableRemove;

    const controlElement = uischema as ControlElement;
    const isObjectSchema = schema.type === 'object';

    if (!visible) {
      return null;
    }

    const columns: any = generateColumns({
      openDeleteDialog,
      translations,
      ...this.props,
      disableRemove: doDisableRemove,
      showSortButtons:
        appliedUiSchemaOptions.showSortButtons ||
        appliedUiSchemaOptions.showArrayTableSortButtons,
      moveUpCreator: moveUp,
      moveDownCreator: moveDown,
    });

    const dataSource = range(data).map((index) => ({ index, key: index }));

    return (
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
        disableAdd={doDisableAdd}
      >
        <Table
          dataSource={dataSource}
          showHeader={isObjectSchema}
          columns={columns}
          pagination={{ hideOnSinglePage: true }}
        ></Table>
      </TableToolbar>
    );
  }
}
