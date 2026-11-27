import {
  MixedNodeControl,
  MixedDetailControl,
  MixedCodeControl,
} from '@chobantonov/jsonforms-react-renderer-common/mixed/MixedDetailControl';
import { mixedParentNode } from '@chobantonov/jsonforms-react-renderer-common/mixed/mixedTreeActions';
import { useMixedRenderer } from '@chobantonov/jsonforms-react-renderer-common/mixed/useMixedRenderer';
import { ContainerValidationIndicator } from '../layouts/ValidationIndicator';
import { schemaForType } from '@chobantonov/jsonforms-react-renderer-common/mixed/mixedSchema';
export {
  schemaForType,
  isArrayElementPath,
  isMixedSchema,
  isMixedControl,
  mixedControlTester,
} from '@chobantonov/jsonforms-react-renderer-common/mixed/mixedSchema';
export type { JsonDataType } from '@chobantonov/jsonforms-react-renderer-common/mixed/mixedSchema';
import { ControlProps, JsonSchema7, resolveSchema } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Breadcrumb, Collapse, Flex, Typography } from 'antd';
import React from 'react';
import { AntdMixedNavigationContext } from './mixed/AntdMixedNavigationContext';
import { AntdMixedSplitPane } from './mixed/AntdMixedSplitPane';
import { useConfirmation } from '../util/useConfirmation';
import { AntdMixedTree } from './mixed/AntdMixedTree';
import { AntdMixedTypeSelector } from './mixed/AntdMixedTypeSelector';
import { AntdNestedMixedNavigation } from './mixed/AntdNestedMixedNavigation';
import { AntdJsonTypeIcon } from './mixed/AntdJsonTypeIcon';
import { MixedTreeNode } from './mixed/mixedTree';

export const MixedRendererComponent = (props: ControlProps) => {
  const { description, label, path, rootSchema, uischema } = props;
  const confirmation = useConfirmation();
  const model = useMixedRenderer(props, confirmation.request);
  const {
    structuredLayout,
    t,
    collapsible,
    expanded,
    setSelectedPath,
    selectedType,
    tree,
    selectedNode,
    canRenameNode,
  } = model;
  const parentNavigation = React.useContext(AntdMixedNavigationContext);

  const renderedControl = (
    <MixedDetailControl
      {...model.detailProps}
      selectedType={selectedType}
      selectedSchema={model.selectedSchema}
    />
  );
  const isStructuredType =
    selectedType === 'object' || selectedType === 'array';

  const selector = <AntdMixedTypeSelector {...model.selectorProps} />;
  if (!props.visible) return null;

  const validateNodeRename = (node: MixedTreeNode, nextName: string) => {
    const oldName = node.path[node.path.length - 1];
    const parent = mixedParentNode(tree, node);
    if (!nextName) return t('additionalProperties.nameRequired');
    if (!parent || typeof oldName !== 'string' || !canRenameNode(node)) {
      return t('mixed.renameBlocked');
    }
    if (
      nextName.includes('.') ||
      nextName.includes('[') ||
      nextName.includes(']')
    ) {
      return t('additionalProperties.nameInvalid', { name: nextName });
    }
    if (
      parent.data &&
      typeof parent.data === 'object' &&
      nextName !== oldName &&
      Object.prototype.hasOwnProperty.call(parent.data, nextName)
    ) {
      return t('additionalProperties.nameTaken', { name: nextName });
    }
    const parentSchema = schemaForType(
      parent.schema,
      'object',
      rootSchema,
    ) as JsonSchema7;
    let propertyNames = parentSchema.propertyNames as JsonSchema7 | undefined;
    if (propertyNames?.$ref) {
      propertyNames =
        (resolveSchema(rootSchema, propertyNames.$ref, rootSchema) as
          | JsonSchema7
          | undefined) ?? propertyNames;
    }
    const ajv = model.jsonforms.core?.ajv;
    if (propertyNames && ajv && !ajv.validate(propertyNames, nextName)) {
      /*
        ajv's own text where it has some - it names the constraint that
        failed, which is more use than any fixed sentence - and the
        translated message where it does not. ajv's text follows the
        validator's locale, not the form's; see the ajv localizers in the
        extended package.
      */
      return (
        ajv.errorsText(ajv.errors) ||
        t('additionalProperties.nameInvalid', { name: nextName })
      );
    }
    if (
      parentSchema.additionalProperties === false &&
      parentSchema.patternProperties &&
      !Object.keys(parentSchema.patternProperties).some((pattern) => {
        try {
          return new RegExp(pattern).test(nextName);
        } catch {
          return false;
        }
      })
    ) {
      return t('additionalProperties.namePattern');
    }
    return undefined;
  };
  const renameNode = (node: MixedTreeNode, nextName: string) => {
    if (!validateNodeRename(node, nextName)) model.renameNode(node, nextName);
  };

  if (structuredLayout === 'code') return <MixedCodeControl {...props} />;

  if (structuredLayout === 'tree' && parentNavigation && isStructuredType) {
    return (
      <AntdNestedMixedNavigation
        description={description}
        label={label}
        onView={() => parentNavigation.selectPath(path)}
        selector={selector}
      />
    );
  }

  const content = (
    <Flex
      data-structured-layout={structuredLayout}
      className='jsonforms-mixed-renderer'
      vertical
      gap='small'
    >
      {confirmation.dialog}
      <style>{`
        .jsonforms-mixed-renderer-primitive,
        .jsonforms-mixed-renderer-detail-primitive {
          align-items: start;
          display: grid;
          gap: 8px;
          grid-template-columns: 140px minmax(0, 1fr);
        }
        .jsonforms-mixed-renderer-unselected {
          grid-template-columns: minmax(0, 1fr);
        }
        .jsonforms-mixed-renderer-detail-control,
        .jsonforms-mixed-renderer-value {
          min-width: 0;
        }
        @media (max-width: 600px) {
          .jsonforms-mixed-renderer-primitive,
          .jsonforms-mixed-renderer-detail-primitive {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
      {isStructuredType ? (
        <>
          {label && uischema.label !== false && (
            <Typography.Text>{label}</Typography.Text>
          )}
          <Collapse
            ghost
            styles={{
              header: { padding: 0, alignItems: 'center' },
              body: { padding: '12px 0' },
            }}
            activeKey={expanded ? ['value'] : []}
            className='jsonforms-mixed-renderer-structured'
            expandIconPlacement='end'
            onChange={(keys) => model.setExpanded(keys.includes('value'))}
            items={[
              {
                key: 'value',
                collapsible: collapsible ? undefined : 'disabled',
                showArrow: collapsible,
                label: (
                  <Flex align='center' gap='middle'>
                    <div
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      {selector}
                    </div>
                    {model.validation.show && (
                      <ContainerValidationIndicator
                        count={model.validation.count}
                      />
                    )}
                  </Flex>
                ),
                children:
                  structuredLayout === 'nested' ? (
                    renderedControl
                  ) : tree && selectedNode ? (
                    <AntdMixedSplitPane
                      tree={
                        <AntdMixedTree
                          canDelete={model.canDeleteNode}
                          canRename={canRenameNode}
                          onDelete={model.deleteNode}
                          onRename={renameNode}
                          onSelect={(node) => setSelectedPath(node.path)}
                          root={tree}
                          selectedPath={selectedNode.path}
                          validateRename={validateNodeRename}
                        />
                      }
                      detail={
                        <Flex vertical gap='small'>
                          <Breadcrumb
                            items={[
                              {
                                title: <AntdJsonTypeIcon type={tree.type} />,
                                ...(selectedNode.path.length > 0
                                  ? {
                                      href: '#',
                                      onClick: (
                                        event: React.MouseEvent<
                                          HTMLAnchorElement | HTMLSpanElement
                                        >,
                                      ) => {
                                        event.preventDefault();
                                        setSelectedPath([]);
                                      },
                                    }
                                  : {}),
                              },
                              ...selectedNode.path.map((segment, index) => {
                                const breadcrumbPath = selectedNode.path.slice(
                                  0,
                                  index + 1,
                                );
                                const breadcrumbLabel =
                                  typeof segment === 'number'
                                    ? `Item ${segment}`
                                    : segment;
                                const current =
                                  index === selectedNode.path.length - 1;
                                return {
                                  title: breadcrumbLabel,
                                  ...(current
                                    ? {}
                                    : {
                                        href: '#',
                                        onClick: (
                                          event: React.MouseEvent<
                                            HTMLAnchorElement | HTMLSpanElement
                                          >,
                                        ) => {
                                          event.preventDefault();
                                          setSelectedPath(breadcrumbPath);
                                        },
                                      }),
                                };
                              }),
                            ]}
                          />
                          <MixedNodeControl
                            {...model.detailProps}
                            node={selectedNode}
                            {...model.nodeEditorProps}
                            MixedTypeSelector={AntdMixedTypeSelector}
                            wrapStructured={(children) => (
                              <Flex vertical gap='small'>
                                {children}
                              </Flex>
                            )}
                          />
                        </Flex>
                      }
                    />
                  ) : null,
              },
            ]}
          />
        </>
      ) : (
        <>
          {label && uischema.label !== false ? (
            <Typography.Text>{label}</Typography.Text>
          ) : null}
          <div
            className={`jsonforms-mixed-renderer-primitive${
              selectedType ? '' : ' jsonforms-mixed-renderer-unselected'
            }`}
          >
            <div className='jsonforms-mixed-renderer-type'>{selector}</div>
            {selectedType ? (
              <div className='jsonforms-mixed-renderer-value'>
                {renderedControl}
              </div>
            ) : null}
          </div>
        </>
      )}
      {description ? (
        <Typography.Text type='secondary'>{description}</Typography.Text>
      ) : null}
    </Flex>
  );
  return structuredLayout === 'nested' || parentNavigation ? (
    content
  ) : (
    <AntdMixedNavigationContext.Provider value={model.navigation}>
      {content}
    </AntdMixedNavigationContext.Provider>
  );
};

export const MixedRenderer = withJsonFormsControlProps(MixedRendererComponent);
