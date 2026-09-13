import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  ControlElement,
  ControlProps,
  isControl,
  JsonSchema,
  JsonSchema7,
  rankWith,
  RankedTester,
  Scopable,
  TesterContext,
  UISchemaElement,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Breadcrumbs,
  Button,
  FormHelperText,
  Stack,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { MuiMixedDeleteDialog } from './mixed/MuiMixedDeleteDialog';
import { MuiMixedNavigationContext } from './mixed/MuiMixedNavigationContext';
import { MuiMixedRenameDialog } from './mixed/MuiMixedRenameDialog';
import { MuiMixedTree } from './mixed/MuiMixedTree';
import { MuiMixedTypeSelector } from './mixed/MuiMixedTypeSelector';
import { MuiNestedMixedNavigation } from './mixed/MuiNestedMixedNavigation';
import { MuiSplitPane } from './mixed/MuiSplitPane';
import {
  buildMixedTree,
  defaultValueForType,
  deleteAtMixedPath,
  findMixedDetailUiSchema,
  getAtMixedPath,
  getSchemaTypes,
  JsonDataType,
  MixedTreeNode,
  MixedTreePath,
  mixedTreeNodeLabel,
  pathKey,
  renameAtMixedPath,
  schemaForType,
  selectedTypeForData,
} from './mixed/mixedTypes';

const isGeneratedRootControl = (uischema: UISchemaElement) => {
  const elements = (uischema as any)?.elements;
  return (
    (uischema.type === 'VerticalLayout' || uischema.type === 'Group') &&
    Array.isArray(elements) &&
    elements.length === 1 &&
    elements[0].type === 'Control' &&
    elements[0].scope === '#'
  );
};

export const isMuiMixedSchema = (
  uischema: UISchemaElement & Scopable,
  schema: JsonSchema,
  _context: TesterContext
) => {
  if ((schema as unknown) === true) return true;
  if (!schema || typeof schema !== 'object') return false;
  if (schema.allOf || schema.anyOf || schema.oneOf) return false;
  if (Array.isArray(schema.type)) return schema.type.length > 1;
  return (
    schema.type === undefined &&
    !schema.properties &&
    !schema.patternProperties &&
    schema.additionalProperties === undefined &&
    isControl(uischema)
  );
};

export const isMuiMixedControl = (
  uischema: UISchemaElement,
  schema: JsonSchema,
  context: TesterContext
) =>
  isMuiMixedSchema(uischema as UISchemaElement & Scopable, schema, context) &&
  (isControl(uischema) || isGeneratedRootControl(uischema));

export const muiMixedControlTester: RankedTester = rankWith(
  21,
  isMuiMixedControl
);

const findTreeNode = (
  node: MixedTreeNode,
  path: MixedTreePath
): MixedTreeNode | undefined => {
  if (pathKey(node.path) === pathKey(path)) return node;
  for (const child of node.children) {
    const found = findTreeNode(child, path);
    if (found) return found;
  }
  return undefined;
};

const dataPathForNode = (rootPath: string, path: MixedTreePath) =>
  [rootPath, ...path].filter((segment) => segment !== '').join('.');

export const MuiMixedRendererComponent = ({
  cells,
  data,
  description,
  enabled,
  errors,
  handleChange,
  label,
  path,
  readonly,
  renderers,
  required,
  rootSchema,
  schema,
  uischema,
  visible,
}: ControlProps) => {
  const context = useJsonForms();
  const parentNavigation = React.useContext(MuiMixedNavigationContext);
  const uischemas = context.uischemas ?? [];
  const types = useMemo(() => getSchemaTypes(schema), [schema]);
  const selectedType = selectedTypeForData(data, types);
  const [expanded, setExpanded] = useState(false);
  const [selectedPath, setSelectedPath] = useState<MixedTreePath>([]);
  const [deleteNode, setDeleteNode] = useState<MixedTreeNode | null>(null);
  const [renameNode, setRenameNode] = useState<MixedTreeNode | null>(null);
  const disabled = !enabled || Boolean(readonly);
  const restrict = context.config?.restrict !== false;
  const selectedSchema = useMemo(
    () =>
      selectedType
        ? schemaForType(schema, selectedType, rootSchema)
        : undefined,
    [rootSchema, schema, selectedType]
  );
  const tree = useMemo(
    () =>
      selectedSchema
        ? buildMixedTree(data, selectedSchema, rootSchema, label || 'Value')
        : undefined,
    [data, label, rootSchema, selectedSchema]
  );
  const selectedNode = tree
    ? findTreeNode(tree, selectedPath) ?? tree
    : undefined;

  useEffect(() => {
    if (tree && !findTreeNode(tree, selectedPath)) setSelectedPath([]);
  }, [tree, selectedPath]);

  if (!visible) return null;

  const changeType = (type: JsonDataType) => {
    handleChange(path, defaultValueForType(schema, type, rootSchema));
    setSelectedPath([]);
    if (type === 'object' || type === 'array') setExpanded(true);
  };
  const selector = (
    <MuiMixedTypeSelector
      disabled={disabled}
      error={!selectedType ? errors : undefined}
      label='Type'
      onChange={changeType}
      required={required}
      types={types}
      value={selectedType}
    />
  );

  const renderNodeControl = (node: MixedTreeNode) => {
    const nodeType = node.type;
    const nodeSchema = nodeType
      ? schemaForType(node.schema, nodeType, rootSchema)
      : node.schema;
    const detailUiSchema =
      node.path.length === 0 && selectedType
        ? findMixedDetailUiSchema(
            nodeSchema,
            selectedType,
            uischema,
            path,
            rootSchema,
            uischemas
          )
        : ({ type: 'Control', scope: '#' } as ControlElement);
    return (
      <JsonFormsDispatch
        cells={cells}
        enabled={enabled}
        path={dataPathForNode(path, node.path)}
        readonly={readonly}
        renderers={renderers}
        schema={nodeSchema}
        uischema={detailUiSchema}
      />
    );
  };

  const primitive =
    selectedType && selectedType !== 'null' && selectedSchema ? (
      <JsonFormsDispatch
        cells={cells}
        enabled={enabled}
        path={path}
        readonly={readonly}
        renderers={renderers}
        schema={selectedSchema}
        uischema={{
          type: 'Control',
          scope: '#',
          label: false,
          options: { ...uischema.options, clearable: false },
        }}
      />
    ) : null;
  const structured = selectedType === 'object' || selectedType === 'array';
  const parentOfRename = renameNode
    ? (getAtMixedPath(data, renameNode.path.slice(0, -1)) as
        | Record<string, unknown>
        | undefined)
    : undefined;

  const navigation = useMemo(
    () => ({
      rootPath: path,
      selectPath: (targetPath: string) => {
        if (!tree) return;
        const findByDataPath = (
          node: MixedTreeNode
        ): MixedTreeNode | undefined => {
          if (dataPathForNode(path, node.path) === targetPath) return node;
          for (const child of node.children) {
            const found = findByDataPath(child);
            if (found) return found;
          }
          return undefined;
        };
        const target = findByDataPath(tree);
        if (!target) return;
        setSelectedPath(target.path);
        setExpanded(true);
      },
    }),
    [path, tree]
  );

  if (parentNavigation && structured && selectedType) {
    return (
      <MuiNestedMixedNavigation
        description={description}
        label={label}
        onView={() => parentNavigation.selectPath(path)}
        selector={selector}
        type={selectedType}
      />
    );
  }

  const renderer = (
    <Stack className='jsonforms-mui-mixed-renderer' spacing={0.75}>
      {!structured ? (
        <>
          {label ? (
            <Typography component='label' variant='body2'>
              {label}
              {required ? ' *' : ''}
            </Typography>
          ) : null}
          <Box
            data-mixed-boolean-row={selectedType === 'boolean' ? '' : undefined}
            sx={
              selectedType === 'boolean'
                ? {
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0, 1fr)',
                    alignItems: 'center',
                    columnGap: 1,
                    '& > .MuiFormControl-root': { gridColumn: 1, gridRow: 1 },
                    // Keep the native boolean input in row 1 and its helper text below.
                    '& > .mixed-value': { display: 'contents' },
                    '& > .mixed-value > .MuiFormControlLabel-root': {
                      gridColumn: 2,
                      gridRow: 1,
                      justifySelf: 'start',
                      m: 0,
                    },
                    '& > .mixed-value > .MuiFormHelperText-root': {
                      gridColumn: 2,
                    },
                  }
                : { alignItems: 'flex-start', display: 'flex', gap: 1 }
            }
          >
            {selector}
            <Box className='mixed-value' sx={{ flex: 1, minWidth: 0 }}>
              {primitive}
            </Box>
          </Box>
        </>
      ) : (
        <Accordion
          expanded={expanded}
          onChange={(_event, next) => setExpanded(next)}
          variant='outlined'
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack
              alignItems='center'
              direction='row'
              spacing={2}
              sx={{ width: '100%' }}
            >
              <Box
                onClick={(event) => event.stopPropagation()}
                onFocus={(event) => event.stopPropagation()}
                sx={{ flexShrink: 0 }}
              >
                {selector}
              </Box>
              {label ? (
                <Typography>
                  {label}
                  {required ? ' *' : ''}
                </Typography>
              ) : null}
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {tree && selectedNode ? (
              <MuiSplitPane
                tree={
                  <MuiMixedTree
                    canDelete={(node) => {
                      if (!restrict) return true;
                      const parent = findTreeNode(tree, node.path.slice(0, -1));
                      const parentSchema = parent?.schema as
                        | JsonSchema7
                        | undefined;
                      if (parent?.type === 'array') {
                        const length = Array.isArray(parent.data)
                          ? parent.data.length
                          : 0;
                        return length > (parentSchema?.minItems ?? 0);
                      }
                      if (parent?.type === 'object') {
                        const count =
                          parent.data && typeof parent.data === 'object'
                            ? Object.keys(parent.data).length
                            : 0;
                        if (parentSchema?.required?.includes(node.label))
                          return false;
                        return count > (parentSchema?.minProperties ?? 0);
                      }
                      return true;
                    }}
                    disabled={disabled}
                    onDelete={(node) => {
                      const nonEmpty =
                        (node.type === 'array' || node.type === 'object') &&
                        node.children.length > 0;
                      if (nonEmpty) setDeleteNode(node);
                      else
                        handleChange(path, deleteAtMixedPath(data, node.path));
                    }}
                    onRename={setRenameNode}
                    onSelect={(node) => setSelectedPath(node.path)}
                    root={tree}
                    selectedPath={selectedNode.path}
                  />
                }
                detail={
                  <Stack spacing={1}>
                    <Breadcrumbs aria-label='Selected value path'>
                      <Button onClick={() => setSelectedPath([])} size='small'>
                        {mixedTreeNodeLabel(tree)}
                      </Button>
                      {selectedNode.path.map((segment, index) => (
                        <Button
                          key={`${segment}-${index}`}
                          onClick={() =>
                            setSelectedPath(
                              selectedNode.path.slice(0, index + 1)
                            )
                          }
                          size='small'
                        >
                          {typeof segment === 'number'
                            ? `Item ${segment}`
                            : segment}
                        </Button>
                      ))}
                    </Breadcrumbs>
                    {renderNodeControl(selectedNode)}
                  </Stack>
                }
              />
            ) : null}
          </AccordionDetails>
        </Accordion>
      )}
      {description ? <FormHelperText>{description}</FormHelperText> : null}
      <MuiMixedDeleteDialog
        node={deleteNode}
        onCancel={() => setDeleteNode(null)}
        onConfirm={() => {
          if (deleteNode)
            handleChange(path, deleteAtMixedPath(data, deleteNode.path));
          setDeleteNode(null);
        }}
      />
      <MuiMixedRenameDialog
        existingNames={Object.keys(parentOfRename ?? {})}
        node={renameNode}
        onCancel={() => setRenameNode(null)}
        onConfirm={(name) => {
          if (renameNode)
            handleChange(path, renameAtMixedPath(data, renameNode.path, name));
          setRenameNode(null);
        }}
        validateName={(name) => {
          if (!renameNode) return '';
          const parent = findTreeNode(
            tree as MixedTreeNode,
            renameNode.path.slice(0, -1)
          );
          const parentSchema = parent?.schema as JsonSchema7 | undefined;
          if (parentSchema?.additionalProperties === false) {
            const matches = Object.keys(
              parentSchema.patternProperties ?? {}
            ).some((pattern) => {
              try {
                return new RegExp(pattern).test(name);
              } catch {
                return false;
              }
            });
            if (!matches)
              return 'The property name does not match an allowed pattern.';
          }
          const propertyNames = parentSchema?.propertyNames;
          const ajv = context.core?.ajv;
          if (
            propertyNames &&
            ajv &&
            !ajv.validate(propertyNames as object, name)
          ) {
            return (
              ajv.errorsText(ajv.errors) || 'The property name is invalid.'
            );
          }
          return '';
        }}
      />
    </Stack>
  );

  return parentNavigation ? (
    renderer
  ) : (
    <MuiMixedNavigationContext.Provider value={navigation}>
      {renderer}
    </MuiMixedNavigationContext.Provider>
  );
};

export const MuiMixedRenderer = withJsonFormsControlProps(
  MuiMixedRendererComponent
);
