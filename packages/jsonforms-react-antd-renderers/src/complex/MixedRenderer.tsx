import {
  ControlElement,
  ControlProps,
  createControlElement,
  createDefaultValue,
  findUISchema,
  isControl,
  JsonFormsUISchemaRegistryEntry,
  JsonSchema,
  JsonSchema7,
  rankWith,
  RankedTester,
  resolveSchema,
  Scopable,
  TesterContext,
  UISchemaElement,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import { Breadcrumb, Collapse, Flex, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { AntdMixedNavigationContext } from './mixed/AntdMixedNavigationContext';
import { AntdMixedSplitPane } from './mixed/AntdMixedSplitPane';
import { AntdMixedTree } from './mixed/AntdMixedTree';
import { AntdMixedTypeSelector } from './mixed/AntdMixedTypeSelector';
import { AntdNestedMixedNavigation } from './mixed/AntdNestedMixedNavigation';
import { AntdJsonTypeIcon } from './mixed/AntdJsonTypeIcon';
import {
  buildMixedTree,
  deleteMixedTreeNode,
  findMixedTreeNode,
  MixedTreeNode,
  MixedTreePath,
  renameMixedTreeNode,
} from './mixed/mixedTree';
import { PRESERVE_DYNAMIC_PROPERTY_OPTION } from '../util/dynamicProperties';

export type JsonDataType =
  | 'array'
  | 'boolean'
  | 'integer'
  | 'null'
  | 'number'
  | 'object'
  | 'string';

const ANY_TYPES: JsonDataType[] = [
  'array',
  'boolean',
  'integer',
  'null',
  'number',
  'object',
  'string',
];

const ARRAY_KEYWORDS = [
  'items',
  'maxItems',
  'minItems',
  'uniqueItems',
] as const;
const OBJECT_KEYWORDS = [
  'additionalProperties',
  'dependencies',
  'dependentRequired',
  'dependentSchemas',
  'maxProperties',
  'minProperties',
  'patternProperties',
  'properties',
  'propertyNames',
  'required',
] as const;
const STRING_KEYWORDS = [
  'contentEncoding',
  'contentMediaType',
  'format',
  'maxLength',
  'minLength',
  'pattern',
] as const;
const NUMBER_KEYWORDS = [
  'exclusiveMaximum',
  'exclusiveMinimum',
  'maximum',
  'minimum',
  'multipleOf',
] as const;

const removeKeywords = (schema: JsonSchema7, keywords: readonly string[]) =>
  keywords.forEach(
    (keyword) => delete (schema as Record<string, unknown>)[keyword]
  );

const getJsonDataType = (value: any): JsonDataType | null => {
  if (typeof value === 'string') {
    return 'string';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    return 'object';
  }

  return null;
};

const getSchemaTypes = (schema: JsonSchema): JsonDataType[] => {
  if (typeof schema !== 'object') {
    return ANY_TYPES;
  }

  if (typeof schema.type === 'string') {
    return [schema.type as JsonDataType];
  }

  if (Array.isArray(schema.type)) {
    return schema.type as JsonDataType[];
  }

  return ANY_TYPES;
};

export const schemaForType = (
  schema: JsonSchema,
  type: JsonDataType,
  rootSchema: JsonSchema
): JsonSchema => {
  const nextSchema: JsonSchema7 = {
    ...(typeof schema === 'object' ? (schema as JsonSchema7) : {}),
    type,
  };
  delete nextSchema.anyOf;
  delete nextSchema.oneOf;
  delete nextSchema.allOf;
  if (type !== 'array') removeKeywords(nextSchema, ARRAY_KEYWORDS);
  if (type !== 'object') removeKeywords(nextSchema, OBJECT_KEYWORDS);
  if (type !== 'string') removeKeywords(nextSchema, STRING_KEYWORDS);
  if (type !== 'integer' && type !== 'number') {
    removeKeywords(nextSchema, NUMBER_KEYWORDS);
  }
  if (nextSchema.default !== undefined) {
    const defaultType = getJsonDataType(nextSchema.default);
    const compatibleDefault =
      defaultType === type || (type === 'number' && defaultType === 'integer');
    if (!compatibleDefault) delete nextSchema.default;
  }

  if (type === 'object') {
    nextSchema.additionalProperties =
      nextSchema.additionalProperties !== false
        ? nextSchema.additionalProperties ?? true
        : false;
  } else if (type === 'array') {
    const items =
      typeof nextSchema.items === 'object' &&
      typeof (nextSchema.items as JsonSchema).$ref === 'string'
        ? resolveSchema(
            rootSchema,
            (nextSchema.items as JsonSchema).$ref,
            rootSchema
          ) ?? nextSchema.items
        : nextSchema.items;
    nextSchema.items =
      items && typeof items === 'object'
        ? (items as JsonSchema7 | JsonSchema7[])
        : { type: ANY_TYPES as JsonSchema7['type'] };
  }

  return nextSchema;
};

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
  const jsonforms = useJsonForms();
  const parentNavigation = React.useContext(AntdMixedNavigationContext);
  const uischemas = jsonforms.uischemas ?? [];
  const [expanded, setExpanded] = useState(true);
  const [selectedPath, setSelectedPath] = useState<MixedTreePath>([]);
  const types = useMemo(() => getSchemaTypes(schema), [schema]);
  const dataType = getJsonDataType(data);
  const selectedType =
    dataType && types.includes(dataType)
      ? dataType
      : dataType === 'integer' && types.includes('number')
      ? 'number'
      : null;
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
            uischema,
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
  const preserveDynamicPropertyKey =
    uischema.options?.[PRESERVE_DYNAMIC_PROPERTY_OPTION] === true;
  const preserveDynamicProperty = (element: UISchemaElement) =>
    preserveDynamicPropertyKey && isControl(element)
      ? {
          ...element,
          options: {
            ...(element.options ?? {}),
            [PRESERVE_DYNAMIC_PROPERTY_OPTION]: true,
          },
        }
      : element;
  const withoutControlLabel = (element: UISchemaElement): UISchemaElement =>
    isControl(element) ? { ...element, label: false } : element;

  useEffect(() => {
    if (tree && !findMixedTreeNode(tree, selectedPath)) setSelectedPath([]);
  }, [tree, selectedPath]);

  if (!visible) {
    return null;
  }

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
          <AntdMixedTypeSelector
            clearable={false}
            disabled={!enabled || Boolean(readonly)}
            onChange={(value) => {
              if (!value) return;
              const nextSchema = schemaForType(
                node.schema,
                value as JsonDataType,
                rootSchema
              );
              handleChange(
                nodePath,
                createDefaultValue(nextSchema, rootSchema)
              );
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
            uischema={preserveDynamicProperty(
              isNestedPrimitive
                ? withoutControlLabel(nodeUiSchema)
                : nodeUiSchema
            )}
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
      <Flex vertical gap='small'>
        {nodeSelector}
        {nodeControl}
      </Flex>
    );
  };
  const renderedControl =
    selectedType !== 'null' && selectedSchema && detailUiSchema ? (
      <JsonFormsDispatch
        schema={selectedSchema}
        uischema={preserveDynamicProperty(withoutControlLabel(detailUiSchema))}
        path={path}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
        readonly={readonly}
      />
    ) : null;
  const isStructuredType =
    selectedType === 'object' || selectedType === 'array';

  const changeType = (nextType?: JsonDataType) => {
    if (!nextType) {
      handleChange(path, undefined);
      setSelectedPath([]);
      return;
    }
    const nextSchema = schemaForType(schema, nextType, rootSchema);
    handleChange(path, createDefaultValue(nextSchema, rootSchema));
    setSelectedPath([]);
    if (nextType === 'object' || nextType === 'array') setExpanded(true);
  };
  const selector = (
    <AntdMixedTypeSelector
      clearable={!preserveDynamicPropertyKey}
      disabled={!enabled || Boolean(readonly)}
      error={!selectedType ? errors : undefined}
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
    if (!nextName) return 'Property name is required.';
    if (!parent || typeof oldName !== 'string' || !canRenameNode(node)) {
      return 'This property cannot be renamed.';
    }
    if (
      nextName.includes('.') ||
      nextName.includes('[') ||
      nextName.includes(']')
    ) {
      return `Property name '${nextName}' is invalid.`;
    }
    if (
      parent.data &&
      typeof parent.data === 'object' &&
      nextName !== oldName &&
      Object.prototype.hasOwnProperty.call(parent.data, nextName)
    ) {
      return `Property '${nextName}' already exists.`;
    }
    const parentSchema = schemaForType(
      parent.schema,
      'object',
      rootSchema
    ) as JsonSchema7;
    let propertyNames = parentSchema.propertyNames as JsonSchema7 | undefined;
    if (propertyNames?.$ref) {
      propertyNames =
        (resolveSchema(rootSchema, propertyNames.$ref, rootSchema) as
          | JsonSchema7
          | undefined) ?? propertyNames;
    }
    const ajv = jsonforms.core?.ajv;
    if (propertyNames && ajv && !ajv.validate(propertyNames, nextName)) {
      return ajv.errorsText(ajv.errors) || 'The property name is invalid.';
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
      return 'The property name does not match an allowed pattern.';
    }
    return undefined;
  };
  const deleteNode = (node: MixedTreeNode) => {
    if (!canDeleteNode(node)) return;
    handleChange(path, deleteMixedTreeNode(data, node.path));
    setSelectedPath(node.path.slice(0, -1));
  };
  const renameNode = (node: MixedTreeNode, nextName: string) => {
    if (validateNodeRename(node, nextName)) return;
    handleChange(path, renameMixedTreeNode(data, node.path, nextName));
    setSelectedPath([...node.path.slice(0, -1), nextName]);
  };

  if (parentNavigation && isStructuredType) {
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
    <Flex className='jsonforms-mixed-renderer' vertical gap='small'>
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
        <Collapse
          activeKey={expanded ? ['value'] : []}
          className='jsonforms-mixed-renderer-structured'
          expandIconPlacement='end'
          onChange={(keys) => setExpanded(keys.includes('value'))}
          items={[
            {
              key: 'value',
              label: (
                <Flex
                  align='center'
                  gap='middle'
                  onClick={(event) => event.stopPropagation()}
                >
                  {selector}
                  {label &&
                  label.trim().toLocaleLowerCase() !== selectedType ? (
                    <Typography.Text>{label}</Typography.Text>
                  ) : null}
                </Flex>
              ),
              children:
                tree && selectedNode ? (
                  <AntdMixedSplitPane
                    tree={
                      <AntdMixedTree
                        canDelete={canDeleteNode}
                        canRename={canRenameNode}
                        onDelete={deleteNode}
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
                                      >
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
                                index + 1
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
                                        >
                                      ) => {
                                        event.preventDefault();
                                        setSelectedPath(breadcrumbPath);
                                      },
                                    }),
                              };
                            }),
                          ]}
                        />
                        {renderNodeControl(selectedNode)}
                      </Flex>
                    }
                  />
                ) : null,
            },
          ]}
        />
      ) : (
        <>
          {label ? <Typography.Text>{label}</Typography.Text> : null}
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
  return parentNavigation ? (
    content
  ) : (
    <AntdMixedNavigationContext.Provider value={navigation}>
      {content}
    </AntdMixedNavigationContext.Provider>
  );
};

export const isMixedSchema = (
  uischema: UISchemaElement & Scopable,
  schema: JsonSchema,
  context: TesterContext
) => {
  if (schema && typeof schema === 'boolean') {
    return true;
  }

  if (!schema || typeof schema !== 'object') {
    return false;
  }

  if (Array.isArray(schema.type)) {
    return schema.type.length > 1;
  }

  if (
    schema.allOf ||
    schema.anyOf ||
    schema.oneOf ||
    schema.properties ||
    schema.patternProperties ||
    schema.additionalProperties !== undefined
  ) {
    return false;
  }

  if (schema.type === undefined && isControl(uischema)) {
    return true;
  }

  if (schema.type === 'object') {
    const schemaPath = uischema.scope;
    if (schemaPath) {
      const currentDataSchema = resolveSchema(
        schema,
        schemaPath,
        context?.rootSchema
      );
      return Array.isArray(
        (currentDataSchema as JsonSchema7 | undefined)?.type
      );
    }
  }

  return false;
};

const isDefaultGeneratedUiSchema = (uischema: UISchemaElement): boolean => {
  const elements = (uischema as any)?.elements;
  return (
    (uischema.type === 'VerticalLayout' || uischema.type === 'Group') &&
    Array.isArray(elements) &&
    elements.length === 1 &&
    elements[0].scope === '#' &&
    elements[0].type === 'Control'
  );
};

export const isMixedControl = (
  uischema: UISchemaElement,
  schema: JsonSchema,
  context: TesterContext
) =>
  isMixedSchema(uischema as UISchemaElement & Scopable, schema, context) &&
  (isControl(uischema) || isDefaultGeneratedUiSchema(uischema));

export const mixedControlTester: RankedTester = rankWith(20, isMixedControl);

export const MixedRenderer = withJsonFormsControlProps(MixedRendererComponent);
