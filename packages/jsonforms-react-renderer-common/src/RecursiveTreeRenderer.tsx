import { resolveEditorDetail } from './detail';
import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  ControlProps,
  JsonSchema7,
  ControlElement,
  JsonFormsRendererRegistryEntry,
  RankedTester,
  composePaths,
  schemaTypeIs,
  resolveSchema,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  withJsonFormsControlProps,
  useJsonForms,
} from '@jsonforms/react';
import {
  buildRecursiveTree,
  recursiveTreeSelection,
  recursiveTreeParent,
  recursiveNodeSchema,
} from './recursiveTree';
import {
  MixedTreeNode,
  MixedTreePath,
  mixedPathKey,
  deleteMixedTreeNode,
  findMixedTreeNode,
} from './mixedTree';
import { useI18n } from './translate';
import { ConfirmationCatalogId, ConfirmationOperation } from './confirmation';
import { useContainerValidation } from './validationIndicator';

type TreeProps = {
  root: MixedTreeNode;
  selectedPath: MixedTreePath;
  onSelect: (node: MixedTreeNode) => void;
  canDelete: (node: MixedTreeNode) => boolean;
  canRename: (node: MixedTreeNode) => boolean;
  onDelete: (node: MixedTreeNode) => void;
  onRename: (node: MixedTreeNode, name: string) => void;
  validateRename: (node: MixedTreeNode, name: string) => string | undefined;
  domainTree?: boolean;
  renderIndicator?: (node: MixedTreeNode) => React.ReactNode;
};
type LinkProps = { children: React.ReactNode; onClick: () => void };
const Navigation = createContext<{
  select: (path: string) => void;
  labelProperty: string;
  Link: React.ComponentType<LinkProps>;
} | null>(null);

const NodeLink = withJsonFormsControlProps(({ data, path }: ControlProps) => {
  const navigation = useContext(Navigation)!;
  return (
    <navigation.Link onClick={() => navigation.select(path)}>
      {typeof data?.[navigation.labelProperty] === 'string' &&
      data[navigation.labelProperty].trim()
        ? data[navigation.labelProperty]
        : String(Number(path.split('.').pop()) + 1)}
    </navigation.Link>
  );
});

// Keep native array actions, defaults, permissions and confirmation. Only the
// row detail is replaced with navigation to the child's editor.
const ChildrenLinks = withJsonFormsControlProps((props: ControlProps) => (
  <JsonFormsDispatch
    schema={props.schema}
    path={props.path}
    enabled={props.enabled}
    renderers={props.renderers}
    cells={props.cells}
    uischema={
      {
        ...props.uischema,
        scope: '#',
        options: {
          ...props.uischema.options,
          recursiveTreeChildren: true,
          table: false,
          format: undefined,
          collapsed: false,
          detail: {
            type: 'Control',
            scope: '#',
            options: { recursiveTreeNodeLink: true },
          },
        },
      } as ControlElement
    }
  />
));

export const recursiveTreeTester: RankedTester = (ui) =>
  ui.type === 'Control' &&
  ui.options?.recursiveTree &&
  typeof ui.options.recursiveTree.childrenProperty === 'string' &&
  typeof ui.options.recursiveTree.labelProperty === 'string'
    ? 30
    : -1;

export const createRecursiveTreeRenderer = (
  Tree: React.ComponentType<TreeProps>,
  Indicator: React.ComponentType<{ count?: number }>,
  Link: React.ComponentType<LinkProps>,
  useConfirmation: () => {
    request: (request: {
      operation: ConfirmationOperation;
      catalogId: ConfirmationCatalogId;
      discarded: unknown[];
      options?: Record<string, unknown>;
      config?: unknown;
      perform: () => void;
    }) => void;
    dialog: React.ReactNode;
  }
) => {
  const NodeIndicator = ({ path, options, config }: any) => {
    const validation = useContainerValidation(
      { type: 'Control', scope: '#', options } as ControlElement,
      path,
      config,
      false
    );
    return validation.show ? <Indicator count={validation.count} /> : null;
  };
  const RecursiveTree = (props: ControlProps) => {
    const { data, schema, rootSchema, path, uischema, config, label, visible } =
      props;
    const options = uischema.options!.recursiveTree;
    const confirmation = useConfirmation();
    const t = useI18n();
    const context = useJsonForms();
    const ajv = context.core?.ajv;
    const tree = useMemo(
      () =>
        buildRecursiveTree(
          data,
          schema,
          rootSchema,
          options.childrenProperty,
          options.labelProperty,
          label || 'Value'
        ),
      [
        data,
        schema,
        rootSchema,
        options.childrenProperty,
        options.labelProperty,
        label,
      ]
    );
    const [selection, setSelection] = useState<{
      node: MixedTreeNode;
      tree: MixedTreeNode;
    }>({ node: tree, tree });
    const selected =
      selection.tree === tree
        ? selection.node
        : recursiveTreeSelection(tree, selection.node, selection.tree);
    const select = (node: MixedTreeNode) => setSelection({ node, tree });
    // Updating this remembered snapshot prevents a later mutation from comparing
    // against an obsolete array index after an external reorder.
    React.useEffect(() => {
      if (selection.tree !== tree) setSelection({ node: selected, tree });
    }, [tree, selected, selection.tree]);
    const nodePath = (node: MixedTreeNode) =>
      node.path.reduce<string>(
        (p, segment) => composePaths(p, String(segment)),
        path
      );
    const branch = (node: MixedTreeNode) =>
      recursiveNodeSchema(node.schema, rootSchema, node.data);
    const resolve = (candidate: any) =>
      candidate?.$ref
        ? resolveSchema(rootSchema, candidate.$ref, rootSchema) ?? candidate
        : candidate;
    const writable = (node: MixedTreeNode) => {
      if (!props.enabled || props.readonly) return false;
      for (let length = 0; length <= node.path.length; length += 2) {
        const ancestor = findMixedTreeNode(tree, node.path.slice(0, length));
        if (!ancestor || (branch(ancestor) as JsonSchema7).readOnly)
          return false;
        if (
          length < node.path.length &&
          resolve(branch(ancestor).properties?.[options.childrenProperty])
            ?.readOnly
        )
          return false;
      }
      return true;
    };
    const canDelete = (node: MixedTreeNode) => {
      if (!node.path.length || !writable(node)) return false;
      const parent = recursiveTreeParent(tree, node.path);
      const collection = resolve(
        branch(parent).properties?.[options.childrenProperty]
      );
      return (
        writable(parent) &&
        !collection?.readOnly &&
        parent.children.length > (collection?.minItems ?? 0)
      );
    };
    const nameSchema = (node: MixedTreeNode) =>
      resolve(branch(node).properties?.[options.labelProperty]);
    const canRename = (node: MixedTreeNode) => {
      const field = nameSchema(node);
      return (
        writable(node) &&
        field &&
        !field.readOnly &&
        field.const === undefined &&
        (!field.type || field.type === 'string')
      );
    };
    const validateRename = (node: MixedTreeNode, name: string) => {
      if (!name.trim()) return t('additionalProperties.nameRequired');
      const field = nameSchema(node);
      if (!field) return t('additionalProperties.nameInvalid', { name });
      try {
        if (ajv && !ajv.validate(field, name))
          return t('additionalProperties.nameInvalid', { name });
      } catch {
        return t('additionalProperties.nameInvalid', { name });
      }
      return undefined;
    };
    // Confirmation callbacks must use current permissions and data, and must
    // never delete a replacement item that now occupies the original index.
    const current = React.useRef({
      tree,
      props,
      canDelete,
      canRename,
      validateRename,
    });
    current.current = { tree, props, canDelete, canRename, validateRename };
    const onDelete = (node: MixedTreeNode) => {
      if (!canDelete(node)) return;
      confirmation.request({
        operation: 'delete',
        catalogId: 'mixed',
        discarded: [node.data],
        options: uischema.options,
        config,
        perform: () => {
          const now = current.current;
          const target = findMixedTreeNode(now.tree, node.path);
          if (!target || target.data !== node.data || !now.canDelete(target))
            return;
          now.props.handleChange(
            now.props.path,
            deleteMixedTreeNode(now.props.data, target.path)
          );
        },
      });
    };
    const onRename = (node: MixedTreeNode, name: string) => {
      const now = current.current;
      const target = findMixedTreeNode(now.tree, node.path);
      if (
        !target ||
        target.data !== node.data ||
        !now.canRename(target) ||
        now.validateRename(target, name)
      )
        return;
      now.props.handleChange(
        composePaths(nodePath(target), options.labelProperty),
        name
      );
    };
    const registry = useMemo<JsonFormsRendererRegistryEntry[]>(
      () => [
        {
          tester: (ui) => (ui.options?.recursiveTreeNodeLink ? 100 : -1),
          renderer: NodeLink,
        },
        {
          tester: (ui, candidate, context) =>
            !ui.options?.recursiveTreeChildren &&
            (ui as ControlElement).scope?.endsWith(
              '/properties/' +
                options.childrenProperty
                  .replace(/~/g, '~0')
                  .replace(/\//g, '~1')
            ) &&
            schemaTypeIs('array')(ui, candidate, context)
              ? 100
              : -1,
          renderer: ChildrenLinks,
        },
        ...(props.renderers ?? []),
      ],
      [props.renderers, options.childrenProperty]
    );
    const detail = resolveEditorDetail(
      options.detail,
      context.uischemas ?? [],
      selected.schema,
      '#',
      nodePath(selected),
      rootSchema,
      { type: 'Control', scope: '#', label } as ControlElement
    );
    if (!visible) return null;
    return (
      <Navigation.Provider
        value={{
          Link,
          labelProperty: options.labelProperty,
          select: (target) => {
            const find = (node: MixedTreeNode): MixedTreeNode | undefined =>
              nodePath(node) === target
                ? node
                : node.children.map(find).find(Boolean);
            const found = find(tree);
            if (found) select(found);
          },
        }}
      >
        <div
          data-recursive-tree
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <Tree
              domainTree
              root={tree}
              selectedPath={selected.path}
              onSelect={select}
              canDelete={canDelete}
              canRename={canRename}
              onDelete={onDelete}
              onRename={onRename}
              validateRename={validateRename}
              renderIndicator={(node) => (
                <NodeIndicator
                  path={nodePath(node)}
                  options={uischema.options}
                  config={config}
                />
              )}
            />
          </div>
          <div
            data-recursive-tree-detail
            style={{ flex: '3 1 360px', minWidth: 0 }}
          >
            <JsonFormsDispatch
              key={mixedPathKey(selected.path)}
              schema={selected.schema}
              path={nodePath(selected)}
              enabled={props.enabled}
              renderers={registry}
              cells={props.cells}
              uischema={{
                ...detail,
                options: { ...detail.options, recursiveTree: undefined },
              }}
            />
          </div>
        </div>
        {confirmation.dialog}
      </Navigation.Provider>
    );
  };
  return withJsonFormsControlProps(RecursiveTree);
};
