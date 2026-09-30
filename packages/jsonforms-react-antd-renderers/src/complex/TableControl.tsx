import { PendingChangesProvider } from '@chobantonov/jsonforms-react-renderer-common/pendingChanges';
import { useCollectionPagination } from '@chobantonov/jsonforms-react-renderer-common/collectionPagination';
import { useRowDetail } from '@chobantonov/jsonforms-react-renderer-common/rowDetail';
import { RowDetailFrame } from './RowDetailFrame';
import { CollectionPager } from './CollectionPager';
import ArrowDownOutlined from '@ant-design/icons/ArrowDownOutlined';
import ArrowUpOutlined from '@ant-design/icons/ArrowUpOutlined';
import DeleteFilled from '@ant-design/icons/DeleteFilled';
import EditOutlined from '@ant-design/icons/EditOutlined';
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
  const cellOptions = (props.uischema as ControlElement)?.options?.cells as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (schema.type === 'object') {
    return getValidColumnProps(schema, cellOptions).map((prop) => {
      const props = {
        propName: prop,
        schema,
        title: schema.properties?.[prop]?.title ?? startCase(prop),
        enabled,
        cells,
        cellOptions: cellOptions?.[prop],
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

const getValidColumnProps = (
  scopedSchema: JsonSchema,
  cellOptions?: Record<string, unknown>
) => {
  if (
    scopedSchema.type === 'object' &&
    typeof scopedSchema.properties === 'object'
  ) {
    return Object.keys(scopedSchema.properties).filter(
      (prop) =>
        // Array columns are skipped by default because a plain cell cannot show
        // them, but a `cells` entry says how to summarise one, so keep it.
        scopedSchema.properties[prop].type !== 'array' ||
        Boolean(cellOptions?.[prop])
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
  /** The array uischema's `cells` entry for this column. */
  cellOptions?: Record<string, unknown>;
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
    cellOptions: ownProps.cellOptions,
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
  enabled: boolean;
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
  enabled,
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
              disabled={!enabled || !enableUp}
            />
          </Tooltip>
          <Tooltip title={translations.down}>
            <Button
              shape='circle'
              aria-label={translations.downAriaLabel}
              icon={<ArrowDownOutlined rev={undefined} />}
              onClick={moveDown}
              disabled={!enabled || !enableDown}
            />
          </Tooltip>
        </>
      ) : null}
      <Tooltip title={translations.removeTooltip}>
        <Button
          disabled={!enabled || disableRemove}
          aria-label={translations.removeAriaLabel}
          icon={<DeleteFilled rev={undefined} />}
          onClick={() => openDeleteDialog(childPath, rowIndex)}
        />
      </Tooltip>
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
            key: 'actions',
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

const CollectionTable = ({
  props,
  columns,
  dataSource,
  isObjectSchema,
}: any) => {
  const page = useCollectionPagination(
    dataSource.map((row: any) => row.index),
    props.uischema.options?.pagination,
    props.config,
    'array',
    true
  );
  const detail = useRowDetail(props);
  const actionColumn = columns.find((column: any) => column.key === 'actions');
  const displayColumns = detail.options
    ? [
        ...columns.filter((column: any) => column.key !== 'actions'),
        {
          key: 'actions',
          title: '',
          width: (actionColumn?.width ?? 0) + 40,
          render: (value: any, row: any, index: number) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
              <Tooltip title={detail.t('collection.editDetails')}>
                <Button
                  icon={<EditOutlined />}
                  aria-label={detail.t('collection.editDetails')}
                  onClick={() => detail.open(row.index)}
                />
              </Tooltip>
              {actionColumn?.render(value, row, index)}
            </div>
          ),
        },
      ]
    : columns;
  return (
    <PendingChangesProvider changes={page.pending}>
      <RowDetailFrame state={detail}>
        <div style={{ minWidth: 0, overflow: 'auto' }}>
          <Table
            scroll={{ x: 'max-content' }}
            dataSource={page.indices.map((index) => dataSource[index])}
            showHeader={isObjectSchema}
            columns={displayColumns}
            size='small'
            pagination={false}
            onRow={(row: any) => ({
              onClick: () => {
                if (detail.options?.presentation === 'panel')
                  detail.open(row.index);
              },
            })}
          />
          <CollectionPager page={page} />
        </div>
      </RowDetailFrame>
    </PendingChangesProvider>
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
        config={this.props.config}
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
        <CollectionTable
          props={this.props}
          columns={columns}
          dataSource={dataSource}
          isObjectSchema={isObjectSchema}
        />
      </TableToolbar>
    );
  }
}
