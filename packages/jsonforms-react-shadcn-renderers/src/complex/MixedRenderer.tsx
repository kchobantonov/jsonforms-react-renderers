import { useMixedType } from '@chobantonov/jsonforms-react-renderer-common/useMixedType';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@jsonforms-react-shadcn-ui/breadcrumb';
import { validateAdditionalPropertyName } from '@chobantonov/jsonforms-react-renderer-common/additionalPropertyName';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@jsonforms-react-shadcn-ui/resizable';
import {
  ANY_TYPES,
  JsonDataType,
  getSchemaTypes,
  schemaForType,
  isArrayElementPath,
} from '@chobantonov/jsonforms-react-renderer-common/mixed';
export {
  schemaForType,
  isArrayElementPath,
  isMixedSchema,
  isMixedControl,
  mixedControlTester,
} from '@chobantonov/jsonforms-react-renderer-common/mixed';
export type { JsonDataType } from '@chobantonov/jsonforms-react-renderer-common/mixed';
import {
  isControl,
  ControlElement,
  ControlProps,
  createControlElement,
  createDefaultValue,
  findUISchema,
  JsonFormsUISchemaRegistryEntry,
  JsonSchema,
  JsonSchema7,
  UISchemaElement,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@jsonforms-react-shadcn-ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MixedNavigationContext,
  MixedTree,
  MixedTypeSelector,
  NestedMixedNavigation,
} from './mixed/MixedWidgets';
import { useConfirmation } from './mixed/useConfirmation';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import {
  buildMixedTree,
  deleteMixedTreeNode,
  findMixedTreeNode,
  MixedTreeNode,
  MixedTreePath,
  renameMixedTreeNode,
} from '@chobantonov/jsonforms-react-renderer-common/mixedTree';
import { useDynamicProperty } from '@chobantonov/jsonforms-react-renderer-common/dynamicProperties';

const findDetailUiSchema = (
  schema: JsonSchema,
  uischema: ControlElement,
  path: string,
  rootSchema: JsonSchema,
  uischemas: JsonFormsUISchemaRegistryEntry[]
) =>
  findUISchema(
    uischemas,
    schema,
    uischema.scope,
    path,
    () => createControlElement('#'),
    uischema,
    rootSchema
  );

export const MixedRendererComponent = ({
  cells,
  config,
  data,
  description,
  enabled,
  errors,
  handleChange,
  label,
  path,
  renderers,
  required,
  readonly,
  rootSchema,
  schema,
  uischema,
  visible,
}: ControlProps) => {
  const latest = useRef({ data, path, enabled, readonly });
  latest.current = { data, path, enabled, readonly };
  const jsonforms = useJsonForms();
  const t = useI18n();
  const confirmation = useConfirmation();
  const parentNavigation = React.useContext(MixedNavigationContext);
  const uischemas = jsonforms.uischemas ?? [];
  const [expanded, setExpanded] = useState(true);
  const [selectedPath, setSelectedPath] = useState<MixedTreePath>([]);
  const types = useMemo(() => getSchemaTypes(schema), [schema]);
  const { selectedType, selectNumericType } = useMixedType(data, types, path);
  const numericError =
    selectedType === 'integer' &&
    typeof data === 'number' &&
    !Number.isInteger(data)
      ? t('mixed.integerRequired')
      : undefined;
  const selectedSchema = useMemo(
    () =>
      selectedType
        ? schemaForType(schema, selectedType, rootSchema)
        : undefined,
    [rootSchema, schema, selectedType]
  );
  const detailUiSchema = useMemo(
    () =>
      selectedSchema
        ? findDetailUiSchema(
            selectedSchema,
            {
              ...uischema,
              options: {
                ...uischema.options,
                detail:
                  uischema.options?.[`${selectedType}-detail`] ??
                  uischema.options?.detail,
              },
            },
            path,
            rootSchema,
            uischemas ?? []
          )
        : undefined,
    [path, rootSchema, selectedSchema, uischema, uischemas]
  );
  const tree = useMemo(
    () =>
      selectedSchema && (selectedType === 'object' || selectedType === 'array')
        ? buildMixedTree(data, selectedSchema, rootSchema, label || 'Value')
        : undefined,
    [data, label, rootSchema, selectedSchema, selectedType]
  );
  const selectedNode = tree
    ? findMixedTreeNode(tree, selectedPath) ?? tree
    : undefined;
  const preserveDynamicPropertyKey = useDynamicProperty(path);
  const withoutControlLabel = (element: UISchemaElement): UISchemaElement =>
    isControl(element) ? { ...element, label: false } : element;

  useEffect(() => {
    if (tree && !findMixedTreeNode(tree, selectedPath)) setSelectedPath([]);
  }, [tree, selectedPath]);

  const renderNodeControl = (node?: MixedTreeNode) => {
    if (!node) return null;
    const isNestedPrimitive =
      node.path.length > 0 &&
      node.type !== 'array' &&
      node.type !== 'object' &&
      node.type !== 'null';
    const nodeSchema = ANY_TYPES.includes(node.type as JsonDataType)
      ? schemaForType(node.schema, node.type as JsonDataType, rootSchema)
      : node.schema;
    const nodePath = [path, ...node.path]
      .filter((segment) => segment !== '')
      .join('.');
    const nodeTypes = getSchemaTypes(node.schema);
    const nodeType =
      node.type && nodeTypes.includes(node.type as JsonDataType)
        ? node.type
        : node.type === 'integer' && nodeTypes.includes('number')
        ? 'number'
        : null;
    const nodeSelector =
      node.path.length > 0 ? (
        <div className='jsonforms-mixed-renderer-detail-type'>
          <MixedTypeSelector
            clearable={false}
            disabled={!enabled || Boolean(readonly)}
            onChange={(value) => {
              if (!value) return;
              const nextSchema = schemaForType(
                node.schema,
                value as JsonDataType,
                rootSchema
              );
              if (!enabled || readonly || value === nodeType) return;
              confirmation.request({
                operation: 'typeChange',
                catalogId: 'mixed',
                options: uischema.options,
                config,
                discarded: [node.data],
                perform: () => {
                  if (
                    latest.current.enabled &&
                    !latest.current.readonly &&
                    latest.current.data === data &&
                    latest.current.path === path
                  )
                    handleChange(
                      nodePath,
                      createDefaultValue(nextSchema, rootSchema)
                    );
                },
              });
            }}
            types={nodeTypes}
            value={nodeType}
          />
        </div>
      ) : null;
    const nodeUiSchema =
      node.path.length === 0 && detailUiSchema
        ? detailUiSchema
        : { type: 'Control', scope: '#' };
    const nodeControl =
      node.type === 'null' ? null : (
        <div className='jsonforms-mixed-renderer-detail-control'>
          <JsonFormsDispatch
            schema={nodeSchema}
            uischema={
              isNestedPrimitive
                ? withoutControlLabel(nodeUiSchema)
                : nodeUiSchema
            }
            path={nodePath}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
            readonly={readonly}
          />
        </div>
      );

    return isNestedPrimitive ? (
      <div className='jsonforms-mixed-renderer-detail-primitive'>
        {nodeSelector}
        {nodeControl}
      </div>
    ) : (
      <div className='space-y-2'>
        {nodeSelector}
        {nodeControl}
      </div>
    );
  };
  const renderedControl =
    selectedType !== 'null' && selectedSchema && detailUiSchema ? (
      <JsonFormsDispatch
        schema={selectedSchema}
        uischema={withoutControlLabel(detailUiSchema)}
        path={path}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
        readonly={readonly}
      />
    ) : null;
  const isStructuredType =
    selectedType === 'object' || selectedType === 'array';

  /*
    An array element's type cannot be cleared. Clearing dispatches `undefined`,
    and core unsets an array element by deleting it in place rather than
    compacting the array - so what is left is a hole, which serializes to
    `null`. The value would disappear from the structure view while the array
    kept a slot for it.

    There is nothing to put there either: a mixed value with no type has no
    representation, and `""` or `0` would be inventing one. Removing an element
    belongs to the array, not to this selector.
  */
  const arrayElement = isArrayElementPath(jsonforms.core?.data, path);
  /*
    A type change discards whatever the old type held, so it goes through the
    shared policy - whose documented fallback here is `complex`, not `always`:
    swapping one scalar for another loses little, replacing a populated object
    loses a lot. Clearing the selection follows the same operation, which
    section 14 states directly.

    Re-selecting the current type is not a change and never prompts.
  */
  const requestTypeChange = (run: () => void) =>
    confirmation.request({
      operation: 'typeChange',
      catalogId: 'mixed',
      discarded: [data],
      options: uischema?.options,
      config,
      perform: () => {
        const current = latest.current;
        if (
          current.enabled &&
          !current.readonly &&
          current.path === path &&
          current.data === data
        )
          run();
      },
    });

  const changeType = (nextType?: JsonDataType) => {
    if (!enabled || readonly) return;
    if (!nextType) {
      if (arrayElement) {
        return;
      }
      requestTypeChange(() => {
        handleChange(path, undefined);
        setSelectedPath([]);
      });
      return;
    }
    if (nextType === selectedType) {
      return;
    }
    if (
      typeof data === 'number' &&
      (nextType === 'number' || nextType === 'integer')
    ) {
      selectNumericType(nextType);
      return;
    }
    const nextSchema = schemaForType(schema, nextType, rootSchema);
    requestTypeChange(() => {
      if (nextType === 'number' || nextType === 'integer')
        selectNumericType(nextType);
      handleChange(path, createDefaultValue(nextSchema, rootSchema));
      setSelectedPath([]);
      if (nextType === 'object' || nextType === 'array') setExpanded(true);
    });
  };
  const selector = (
    <MixedTypeSelector
      clearable={!preserveDynamicPropertyKey && !arrayElement}
      disabled={!enabled || Boolean(readonly)}
      error={numericError ?? (!selectedType ? errors : undefined)}
      fullWidth={!selectedType}
      onChange={(value) => changeType(value as JsonDataType | undefined)}
      required={required}
      types={types}
      value={selectedType}
    />
  );
  const navigation = useMemo(
    () => ({
      selectPath: (targetPath: string) => {
        if (!tree) return;
        const findByDataPath = (
          node: MixedTreeNode
        ): MixedTreeNode | undefined => {
          const nodePath = [path, ...node.path]
            .filter((segment) => segment !== '')
            .join('.');
          if (nodePath === targetPath) return node;
          for (const child of node.children) {
            const found = findByDataPath(child);
            if (found) return found;
          }
          return undefined;
        };
        const target = findByDataPath(tree);
        if (target) {
          setSelectedPath(target.path);
          setExpanded(true);
        }
      },
    }),
    [path, tree]
  );
  const appliedOptions = { ...(config ?? {}), ...(uischema.options ?? {}) };
  const restrict = appliedOptions.restrict !== false;
  const parentNode = (node: MixedTreeNode) =>
    tree ? findMixedTreeNode(tree, node.path.slice(0, -1)) : undefined;
  const canDeleteNode = (node: MixedTreeNode) => {
    if (!enabled || readonly || node.path.length === 0) return false;
    const parent = parentNode(node);
    if (!parent) return false;
    if (!restrict) return true;
    const parentSchema = ANY_TYPES.includes(parent.type as JsonDataType)
      ? (schemaForType(
          parent.schema,
          parent.type as JsonDataType,
          rootSchema
        ) as JsonSchema7)
      : (parent.schema as JsonSchema7);
    if (Array.isArray(parent.data)) {
      return (
        parentSchema.minItems === undefined ||
        parent.data.length > parentSchema.minItems
      );
    }
    const key = node.path[node.path.length - 1];
    if (
      !parent.data ||
      typeof parent.data !== 'object' ||
      typeof key !== 'string'
    ) {
      return false;
    }
    if (parentSchema.required?.includes(key)) return false;
    return (
      parentSchema.minProperties === undefined ||
      Object.keys(parent.data).length > parentSchema.minProperties
    );
  };
  const canRenameNode = (node: MixedTreeNode) =>
    Boolean(
      enabled &&
        !readonly &&
        node.dynamic &&
        typeof node.path[node.path.length - 1] === 'string'
    );
  const validateNodeRename = (node: MixedTreeNode, nextName: string) => {
    const oldName = node.path[node.path.length - 1];
    const parent = parentNode(node);
    if (!parent || typeof oldName !== 'string' || !canRenameNode(node)) {
      return t('mixed.renameBlocked');
    }
    const result = validateAdditionalPropertyName({
      name: nextName,
      currentName: oldName,
      data: parent.data,
      schema: schemaForType(parent.schema, 'object', rootSchema),
      rootSchema,
      validate: jsonforms.core?.ajv
        ? (schema, value) =>
            Boolean(jsonforms.core!.ajv!.validate(schema, value))
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
  const deleteNode = (node: MixedTreeNode) => {
    if (!canDeleteNode(node)) return;
    /*
      "Tree Delete in the mixed workspace uses mixed" - the owner of the action,
      not whichever renderer happens to draw the row. Fallback `always`.
    */
    confirmation.request({
      operation: 'delete',
      catalogId: 'mixed',
      discarded: [node.data],
      options: uischema?.options,
      config,
      perform: () => {
        // Re-checked after confirmation: the guard, and the node still being
        // there, are both current rather than remembered.
        if (
          !canDeleteNode(node) ||
          latest.current.data !== data ||
          latest.current.path !== path ||
          !latest.current.enabled ||
          latest.current.readonly
        )
          return;
        handleChange(path, deleteMixedTreeNode(data, node.path));
        setSelectedPath(node.path.slice(0, -1));
      },
    });
  };
  const renameNode = (node: MixedTreeNode, nextName: string) => {
    if (validateNodeRename(node, nextName)) return;
    handleChange(path, renameMixedTreeNode(data, node.path, nextName));
    setSelectedPath([...node.path.slice(0, -1), nextName]);
  };

  if (!visible) return null;

  if (parentNavigation && isStructuredType) {
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
    <div className='jsonforms-mixed-renderer min-w-0 space-y-2'>
      {confirmation.dialog}
      {isStructuredType ? (
        <Collapsible
          open={expanded}
          onOpenChange={setExpanded}
          className='min-w-0'
        >
          <div className='flex items-center gap-3'>
            <div className='w-36 shrink-0'>{selector}</div>
            <CollapsibleTrigger
              render={<Button type='button' variant='ghost' />}
              className='flex-1 justify-between'
              aria-label={label || 'Value'}
            >
              <span>{label}</span>
              {expanded ? (
                <ChevronUp aria-hidden='true' />
              ) : (
                <ChevronDown aria-hidden='true' />
              )}
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent keepMounted hidden={!expanded} className='pt-3'>
            {tree && selectedNode && (
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
                    canDelete={canDeleteNode}
                    canRename={canRenameNode}
                    onDelete={deleteNode}
                    onRename={renameNode}
                    validateRename={validateNodeRename}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel minSize='30%' className='pl-3'>
                  <div className='min-w-0 space-y-2'>
                    <Breadcrumb aria-label='Value path'>
                      <BreadcrumbList>
                        {[
                          [],
                          ...selectedNode.path.map((_, index) =>
                            selectedNode.path.slice(0, index + 1)
                          ),
                        ].map((nodePath, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && <BreadcrumbSeparator />}
                            <BreadcrumbItem>
                              {index === selectedNode.path.length ? (
                                <BreadcrumbPage>
                                  {index === 0
                                    ? label || 'Value'
                                    : String(nodePath[index - 1])}
                                </BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink asChild>
                                  <button
                                    type='button'
                                    onClick={() => setSelectedPath(nodePath)}
                                  >
                                    {index === 0
                                      ? label || 'Value'
                                      : String(nodePath[index - 1])}
                                  </button>
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                          </React.Fragment>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>
                    {renderNodeControl(selectedNode)}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          {label && (
            <div className='shadcn-jsonforms-label'>
              {label}
              {required && ' *'}
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
  return parentNavigation ? (
    content
  ) : (
    <MixedNavigationContext.Provider value={navigation}>
      {content}
    </MixedNavigationContext.Provider>
  );
};
export const MixedRenderer = withJsonFormsControlProps(MixedRendererComponent);
