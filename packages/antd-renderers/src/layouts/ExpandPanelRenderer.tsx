import merge from 'lodash/merge';
import get from 'lodash/get';
import React, {
  ComponentType,
  Dispatch,
  ReducerAction,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  JsonFormsDispatch,
  JsonFormsStateContext,
  withJsonFormsContext,
} from '@jsonforms/react';
import {
  composePaths,
  ControlElement,
  findUISchema,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  moveDown,
  moveUp,
  Resolve,
  update,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsUISchemaRegistryEntry,
  getFirstPrimitiveProp,
  createId,
  removeId,
  ArrayTranslations,
} from '@jsonforms/core';

import { Avatar, Button, Collapse, Space, Tooltip, Typography } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteFilled,
} from '@ant-design/icons';
import Hidden from '../util/Hidden';

interface OwnPropsOfExpandPanel {
  enabled: boolean;
  index: number;
  path: string;
  uischema: ControlElement;
  schema: JsonSchema;
  expanded: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  uischemas?: JsonFormsUISchemaRegistryEntry[];
  rootSchema: JsonSchema;
  enableMoveUp: boolean;
  enableMoveDown: boolean;
  config: any;
  childLabelProp?: string;
  isExpanded?: boolean;
  handleExpansion(panel: string): (event: any, expanded: boolean) => void;
  translations: ArrayTranslations;
}

interface StatePropsOfExpandPanel extends OwnPropsOfExpandPanel {
  key: React.Key;
  childLabel: string;
  childPath: string;
  enableMoveUp: boolean;
  enableMoveDown: boolean;
}

/**
 * Dispatch props of a table control
 */
export interface DispatchPropsOfExpandPanel {
  removeItems(path: string, toDelete: number[]): (event: any) => void;
  moveUp(path: string, toMove: number): (event: any) => void;
  moveDown(path: string, toMove: number): (event: any) => void;
}

export interface ExpandPanelProps
  extends StatePropsOfExpandPanel,
    DispatchPropsOfExpandPanel {}

const ExpandPanelRendererComponent = (props: ExpandPanelProps) => {
  const [labelHtmlId] = useState<string>(createId('expand-panel'));

  useEffect(() => {
    return () => {
      removeId(labelHtmlId);
    };
  }, [labelHtmlId]);

  const {
    enabled,
    childLabel,
    childPath,
    index,
    key,
    expanded,
    moveDown,
    moveUp,
    enableMoveDown,
    enableMoveUp,
    removeItems,
    path,
    rootSchema,
    schema,
    uischema,
    uischemas,
    renderers,
    cells,
    config,
    translations,
    childLabelProp: _childLabelProp,
    handleExpansion: _handleExpansion,
    ...panelProps
  } = props;

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

  const getExtra = () => {
    return (
      <>
        {showSortButtons && enabled ? (
          <>
            <Tooltip key='tooltip-up' title={translations.up}>
              <Button
                onClick={moveUp(path, index)}
                shape='circle'
                icon={<ArrowUpOutlined rev={undefined} />}
                disabled={!enableMoveUp}
                aria-label={translations.upAriaLabel}
              />
            </Tooltip>
            <Tooltip key='tooltip-down' title={translations.down}>
              <Button
                onClick={moveDown(path, index)}
                shape='circle'
                icon={<ArrowDownOutlined rev={undefined} />}
                disabled={!enableMoveDown}
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

  return (
    <Collapse.Panel
      {...panelProps}
      aria-labelledby={labelHtmlId}
      key={key}
      header={
        <>
          <Avatar aria-label='Index' style={avatarStyle}>
            {index + 1}
          </Avatar>
          <Hidden hidden={!childLabel}>
            <Typography.Text id={labelHtmlId}>{childLabel}</Typography.Text>
          </Hidden>
        </>
      }
      extra={<Space>{getExtra()}</Space>}
    >
      <JsonFormsDispatch
        schema={schema}
        uischema={foundUISchema}
        path={childPath}
        key={childPath}
        renderers={renderers}
        cells={cells}
      />
    </Collapse.Panel>
  );
};

export const ExpandPanelRenderer = React.memo(ExpandPanelRendererComponent);

/**
 * Maps state to dispatch properties of an expand pandel control.
 *
 * @param dispatch the store's dispatch method
 * @returns {DispatchPropsOfArrayControl} dispatch props of an expand panel control
 */
export const ctxDispatchToExpandPanelProps: (
  dispatch: Dispatch<ReducerAction<any>>
) => DispatchPropsOfExpandPanel = (dispatch) => ({
  removeItems: useCallback(
    (path: string, toDelete: number[]) =>
      (event: any): void => {
        event.stopPropagation();
        dispatch(
          update(path, (array) => {
            toDelete
              .sort()
              .reverse()
              .forEach((s) => array.splice(s, 1));
            return array;
          })
        );
      },
    [dispatch]
  ),
  moveUp: useCallback(
    (path: string, toMove: number) =>
      (event: any): void => {
        event.stopPropagation();
        dispatch(
          update(path, (array) => {
            moveUp(array, toMove);
            return array;
          })
        );
      },
    [dispatch]
  ),
  moveDown: useCallback(
    (path: string, toMove: number) =>
      (event: any): void => {
        event.stopPropagation();
        dispatch(
          update(path, (array) => {
            moveDown(array, toMove);
            return array;
          })
        );
      },
    [dispatch]
  ),
});

/**
 * Map state to control props.
 * @param state the JSON Forms state
 * @param ownProps any own props
 * @returns {StatePropsOfControl} state props for a control
 */
export const withContextToExpandPanelProps = (
  Component: ComponentType<ExpandPanelProps>
): ComponentType<OwnPropsOfExpandPanel> =>
  function WithContextToExpandPanelProps({
    ctx,
    props,
  }: JsonFormsStateContext & ExpandPanelProps) {
    const dispatchProps = ctxDispatchToExpandPanelProps(ctx.dispatch);
    const { childLabelProp, schema, path, index, uischemas } = props;
    const childPath = composePaths(path, `${index}`);
    const childData = Resolve.data(ctx.core.data, childPath);
    const childLabel = childLabelProp
      ? get(childData, childLabelProp, '')
      : get(childData, getFirstPrimitiveProp(schema), '');

    return (
      <Component
        {...props}
        {...dispatchProps}
        childLabel={childLabel}
        childPath={childPath}
        uischemas={uischemas}
      />
    );
  };

export const withJsonFormsExpandPanelProps = (
  Component: ComponentType<ExpandPanelProps>
): ComponentType<OwnPropsOfExpandPanel> =>
  withJsonFormsContext(withContextToExpandPanelProps(Component));

export default withJsonFormsExpandPanelProps(ExpandPanelRenderer);
