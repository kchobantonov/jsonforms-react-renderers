import {
  canDeleteMixedTreeNode,
  canRenameMixedTreeNode,
} from './mixedTreeActions';
import {
  deleteMixedTreeNode,
  renameMixedTreeNode,
  type MixedTreeNode,
  buildMixedTree,
  findMixedTreeNode,
  type MixedTreePath,
} from './mixedTree';
import type { ConfirmationRequest } from '../interaction/confirmation';
import { useMixedNavigation } from './useMixedNavigation';
import { createMixedTypeChangeHandler } from './createMixedTypeChangeHandler';
import { useLayoutEffect, useRef, useMemo, useState } from 'react';
import { findMixedDetailUiSchema } from '../core/detailUiSchema';
import { useContainerValidation } from '../validation/validationIndicator';
import { useGroupExpansion } from '../layout/groupState';
import { useMixedType } from './useMixedType';
import {
  getSchemaTypes,
  schemaForType,
  isArrayElementPath,
  type JsonDataType,
} from './mixedSchema';
import { useDynamicProperty } from '../objects/dynamicProperties';
import { useI18n } from '../locale/translate';
import {
  isControl,
  type ControlProps,
  type UISchemaElement,
} from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';

export const useMixedRenderer = (
  props: ControlProps,
  requestConfirmation: (request: ConfirmationRequest) => void,
) => {
  const {
    cells,
    enabled,
    readonly,
    renderers,
    errors,
    required,
    handleChange,
    data,
    config,
    label,
    path,
    rootSchema,
    schema,
    uischema,
  } = props;
  const jsonforms = useJsonForms();
  const structuredLayout =
    uischema.options?.structuredLayout ??
    config?.jsonformsExtended?.mixed?.structuredLayout ??
    'tree';
  const validation = useContainerValidation(
    { ...uischema, scope: '#' },
    path,
    config,
    false,
  );
  const t = useI18n();
  const uischemas = useMemo(
    () => jsonforms.uischemas ?? [],
    [jsonforms.uischemas],
  );
  const { collapsible, collapsed, setExpanded } = useGroupExpansion(
    uischema,
    config,
    true,
    'mixed',
  );
  const expanded = !collapsed;
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
    [rootSchema, schema, selectedType],
  );
  const detailUiSchema = useMemo(
    () =>
      selectedSchema
        ? findMixedDetailUiSchema(
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
            uischemas ?? [],
          )
        : undefined,
    [path, rootSchema, selectedSchema, selectedType, uischema, uischemas],
  );
  const tree = useMemo(
    () =>
      selectedSchema && (selectedType === 'object' || selectedType === 'array')
        ? buildMixedTree(data, selectedSchema, rootSchema, label || 'Value')
        : undefined,
    [data, label, rootSchema, selectedSchema, selectedType],
  );
  const selectedNode = tree
    ? (findMixedTreeNode(tree, selectedPath) ?? tree)
    : undefined;
  const preserveDynamicPropertyKey = useDynamicProperty(path);
  const withoutControlLabel = (element: UISchemaElement): UISchemaElement =>
    isControl(element) && element.scope === '#'
      ? { ...element, label: false }
      : element;

  if (
    tree &&
    selectedPath.length > 0 &&
    !findMixedTreeNode(tree, selectedPath)
  ) {
    setSelectedPath([]);
  }

  const arrayElement = isArrayElementPath(jsonforms.core?.data, path);
  const changeType = createMixedTypeChangeHandler({
    data,
    path,
    schema,
    rootSchema,
    uischema,
    config,
    handleChange,
    arrayElement,
    selectedType,
    selectNumericType,
    setSelectedPath,
    setExpanded,
    requestConfirmation,
  });
  const navigation = useMixedNavigation(
    path,
    tree,
    setSelectedPath,
    setExpanded,
  );
  const selectorProps = {
    clearable: !preserveDynamicPropertyKey && !arrayElement,
    disabled: !enabled || Boolean(readonly),
    error: numericError ?? (!selectedType ? errors : undefined),
    fullWidth: !selectedType,
    onChange: (value: string | undefined) =>
      changeType(value as JsonDataType | undefined),
    required,
    types,
    value: selectedType,
  };
  const latest = useRef({ data, path, enabled, readonly });
  useLayoutEffect(() => {
    latest.current = { data, path, enabled, readonly };
  }, [data, path, enabled, readonly]);
  const appliedOptions = { ...config, ...uischema.options };
  const restrict = appliedOptions.restrict !== false;
  const canDeleteNode = (node: MixedTreeNode) =>
    canDeleteMixedTreeNode(tree, node, rootSchema, enabled, readonly, restrict);
  const canRenameNode = (node: MixedTreeNode) =>
    canRenameMixedTreeNode(node, enabled, readonly);
  const deleteNode = (node: MixedTreeNode) => {
    if (!canDeleteNode(node)) return;
    /*
      "Tree Delete in the mixed workspace uses mixed" - the owner of the action,
      not whichever renderer happens to draw the row. Fallback `always`.
    */
    requestConfirmation({
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
    handleChange(path, renameMixedTreeNode(data, node.path, nextName));
    setSelectedPath([...node.path.slice(0, -1), nextName]);
  };

  return {
    appliedOptions,
    canDeleteNode,
    canRenameNode,
    deleteNode,
    renameNode,
    selectorProps,
    navigation,
    nodeEditorProps: { rootSchema, handleChange },
    detailProps: {
      path,
      enabled,
      readonly,
      renderers,
      cells,
      detailUiSchema,
      withoutControlLabel,
    },
    jsonforms,
    structuredLayout,
    validation,
    t,
    uischemas,
    collapsible,
    collapsed,
    setExpanded,
    expanded,
    selectedPath,
    setSelectedPath,
    types,
    selectedType,
    selectNumericType,
    numericError,
    selectedSchema,
    detailUiSchema,
    tree,
    selectedNode,
    preserveDynamicPropertyKey,
    withoutControlLabel,
  };
};
