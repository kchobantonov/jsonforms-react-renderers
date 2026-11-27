import {
  MixedNodeControl,
  MixedDetailControl,
  MixedCodeControl,
} from '@chobantonov/jsonforms-react-renderer-common/mixed/MixedDetailControl';
import { mixedParentNode } from '@chobantonov/jsonforms-react-renderer-common/mixed/mixedTreeActions';
import { useMixedRenderer } from '@chobantonov/jsonforms-react-renderer-common/mixed/useMixedRenderer';
import React from 'react';
import { ContainerValidationIndicator } from '../layouts/ValidationIndicator';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@jsonforms-react-shadcn-ui/breadcrumb';
import { validateAdditionalPropertyName } from '@chobantonov/jsonforms-react-renderer-common/objects/additionalPropertyName';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@jsonforms-react-shadcn-ui/resizable';
import { schemaForType } from '@chobantonov/jsonforms-react-renderer-common/mixed/mixedSchema';
export {
  schemaForType,
  isArrayElementPath,
  isMixedSchema,
  isMixedControl,
  mixedControlTester,
} from '@chobantonov/jsonforms-react-renderer-common/mixed/mixedSchema';
export type { JsonDataType } from '@chobantonov/jsonforms-react-renderer-common/mixed/mixedSchema';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@jsonforms-react-shadcn-ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  MixedNavigationContext,
  MixedTree,
  MixedTypeSelector,
  NestedMixedNavigation,
} from './mixed/MixedWidgets';
import { useConfirmation } from './mixed/useConfirmation';
import { MixedTreeNode } from '@chobantonov/jsonforms-react-renderer-common/mixed/mixedTree';

export const MixedRendererComponent = (props: ControlProps) => {
  const { description, label, path, rootSchema, uischema } = props;
  const confirmation = useConfirmation();
  const model = useMixedRenderer(props, confirmation.request);
  const {
    appliedOptions,
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
  const parentNavigation = React.useContext(MixedNavigationContext);

  const renderedControl = (
    <MixedDetailControl
      {...model.detailProps}
      selectedType={selectedType}
      selectedSchema={model.selectedSchema}
    />
  );
  const isStructuredType =
    selectedType === 'object' || selectedType === 'array';

  const selector = <MixedTypeSelector {...model.selectorProps} />;
  const validateNodeRename = (node: MixedTreeNode, nextName: string) => {
    const oldName = node.path[node.path.length - 1];
    const parent = mixedParentNode(tree, node);
    if (!parent || typeof oldName !== 'string' || !canRenameNode(node)) {
      return t('mixed.renameBlocked');
    }
    const result = validateAdditionalPropertyName({
      name: nextName,
      currentName: oldName,
      data: parent.data,
      schema: schemaForType(parent.schema, 'object', rootSchema),
      rootSchema,
      validate: model.jsonforms.core?.ajv
        ? (schema, value) =>
            Boolean(model.jsonforms.core!.ajv!.validate(schema, value))
        : undefined,
    });
    if (result.error === 'required')
      return t('additionalProperties.nameRequired');
    if (result.error === 'already-defined')
      return t('additionalProperties.nameTaken', { name: nextName });
    if (result.error)
      return t('additionalProperties.nameInvalid', { name: nextName });
    return undefined;
  };
  const renameNode = (node: MixedTreeNode, nextName: string) => {
    if (!validateNodeRename(node, nextName)) model.renameNode(node, nextName);
  };

  if (!props.visible) return null;

  if (structuredLayout === 'code') return <MixedCodeControl {...props} />;

  if (structuredLayout === 'tree' && parentNavigation && isStructuredType) {
    return (
      <NestedMixedNavigation
        description={description}
        label={label}
        onView={() => parentNavigation.selectPath(path)}
        selector={selector}
      />
    );
  }

  const content = (
    <div
      data-structured-layout={structuredLayout}
      className='jsonforms-mixed-renderer min-w-0 space-y-2'
    >
      {confirmation.dialog}
      {isStructuredType ? (
        <Collapsible
          open={expanded}
          onOpenChange={model.setExpanded}
          className='min-w-0'
        >
          {label && uischema.label !== false && (
            <div className='shadcn-jsonforms-label mb-2'>{label}</div>
          )}
          <div className='flex items-center gap-3'>
            <div className='w-36 shrink-0'>{selector}</div>
            {model.validation.show && (
              <ContainerValidationIndicator count={model.validation.count} />
            )}
            {collapsible ? (
              <CollapsibleTrigger
                render={<Button type='button' variant='ghost' />}
                className='flex-1 justify-end'
                aria-label={label || t('control.value')}
              >
                {expanded ? (
                  <ChevronUp aria-hidden='true' />
                ) : (
                  <ChevronDown aria-hidden='true' />
                )}
              </CollapsibleTrigger>
            ) : (
              <span className='flex-1' />
            )}
          </div>
          <CollapsibleContent keepMounted hidden={!expanded} className='pt-3'>
            {structuredLayout === 'nested' && renderedControl}
            {structuredLayout === 'tree' && tree && selectedNode && (
              <ResizablePanelGroup orientation='horizontal' className='min-w-0'>
                <ResizablePanel
                  defaultSize='30%'
                  minSize='20%'
                  className='pr-3'
                >
                  <MixedTree
                    root={tree}
                    selectedPath={selectedNode.path}
                    onSelect={(node) => setSelectedPath(node.path)}
                    canDelete={model.canDeleteNode}
                    canRename={canRenameNode}
                    onDelete={model.deleteNode}
                    onRename={renameNode}
                    validateRename={validateNodeRename}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel minSize='30%' className='pl-3'>
                  <div className='min-w-0 space-y-2'>
                    <Breadcrumb aria-label={t('mixed.valuePath')}>
                      <BreadcrumbList>
                        {[
                          [],
                          ...selectedNode.path.map((_, index) =>
                            selectedNode.path.slice(0, index + 1),
                          ),
                        ].map((nodePath, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && <BreadcrumbSeparator />}
                            <BreadcrumbItem>
                              {index === selectedNode.path.length ? (
                                <BreadcrumbPage>
                                  {index === 0
                                    ? label || t('control.value')
                                    : String(nodePath[index - 1])}
                                </BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink asChild>
                                  <button
                                    type='button'
                                    onClick={() => setSelectedPath(nodePath)}
                                  >
                                    {index === 0
                                      ? label || t('control.value')
                                      : String(nodePath[index - 1])}
                                  </button>
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                          </React.Fragment>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>
                    <MixedNodeControl
                      {...model.detailProps}
                      node={selectedNode}
                      {...model.nodeEditorProps}
                      MixedTypeSelector={MixedTypeSelector}
                      wrapStructured={(children) => (
                        <div className='space-y-2'>{children}</div>
                      )}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          {label && uischema.label !== false && (
            <div className='shadcn-jsonforms-label'>
              {label}
              {props.required && !appliedOptions.hideRequiredAsterisk && ' *'}
            </div>
          )}
          <div
            className={
              selectedType && selectedType !== 'null'
                ? 'jsonforms-mixed-renderer-primitive'
                : ''
            }
          >
            {selector}
            <div className='min-w-0'>{renderedControl}</div>
          </div>
        </>
      )}
    </div>
  );
  return structuredLayout === 'nested' || parentNavigation ? (
    content
  ) : (
    <MixedNavigationContext.Provider value={model.navigation}>
      {content}
    </MixedNavigationContext.Provider>
  );
};
export const MixedRenderer = withJsonFormsControlProps(MixedRendererComponent);
