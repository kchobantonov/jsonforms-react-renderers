import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import { Button, Flex, Input, Modal, Tooltip, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useEffect, useMemo, useState } from 'react';
import { AntdAdditionalPropertyRenameDialog } from '../additionalProperties/AntdAdditionalPropertyRenameDialog';
import { AntdJsonTypeIcon } from './AntdJsonTypeIcon';
import {
  mixedPathKey,
  MixedTreeNode,
  MixedTreePath,
  mixedTreeLabel,
} from './mixedTree';

export interface AntdMixedTreeProps {
  canDelete: (node: MixedTreeNode) => boolean;
  canRename: (node: MixedTreeNode) => boolean;
  onDelete: (node: MixedTreeNode) => void;
  onRename: (node: MixedTreeNode, nextName: string) => void;
  onSelect: (node: MixedTreeNode) => void;
  root: MixedTreeNode;
  selectedPath: MixedTreePath;
  validateRename: (node: MixedTreeNode, nextName: string) => string | undefined;
}

const containsSearch = (node: MixedTreeNode, search: string): boolean =>
  mixedTreeLabel(node).toLowerCase().includes(search) ||
  node.children.some((child) => containsSearch(child, search));

export const AntdMixedTree = ({
  canDelete,
  canRename,
  onDelete,
  onRename,
  onSelect,
  root,
  selectedPath,
  validateRename,
}: AntdMixedTreeProps) => {
  const [search, setSearch] = useState('');
  const [showPrimitives, setShowPrimitives] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([
    mixedPathKey([]),
  ]);
  const [renamingNode, setRenamingNode] = useState<MixedTreeNode | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingNode, setDeletingNode] = useState<MixedTreeNode | null>(null);
  const normalizedSearch = search.trim().toLowerCase();
  const nodeMap = useMemo(() => new Map<string, MixedTreeNode>(), [root]);
  const renameError = renamingNode
    ? validateRename(renamingNode, renameValue.trim())
    : undefined;
  const searchExpandedKeys = useMemo(() => {
    if (!normalizedSearch) return [];
    const keys: React.Key[] = [];
    const collectMatchingBranches = (node: MixedTreeNode) => {
      if (!containsSearch(node, normalizedSearch)) return;
      if (node.type === 'object' || node.type === 'array') {
        keys.push(mixedPathKey(node.path));
      }
      node.children.forEach(collectMatchingBranches);
    };
    collectMatchingBranches(root);
    return keys;
  }, [normalizedSearch, root]);

  useEffect(() => {
    const ancestorKeys = selectedPath.map((_, index) =>
      mixedPathKey(selectedPath.slice(0, index))
    );
    setExpandedKeys((current) => [
      ...new Set([...current, mixedPathKey([]), ...ancestorKeys]),
    ]);
  }, [selectedPath]);

  const closeRename = () => {
    setRenamingNode(null);
    setRenameValue('');
  };

  const toDataNode = (node: MixedTreeNode): DataNode | null => {
    const structured = node.type === 'object' || node.type === 'array';
    if (
      node.path.length > 0 &&
      !structured &&
      !showPrimitives &&
      mixedPathKey(selectedPath) !== mixedPathKey(node.path) &&
      !normalizedSearch
    ) {
      return null;
    }
    if (normalizedSearch && !containsSearch(node, normalizedSearch))
      return null;
    const key = mixedPathKey(node.path);
    nodeMap.set(key, node);
    const rootNode = node.path.length === 0;
    const deletable = !rootNode && canDelete(node);
    const renameable = !rootNode && canRename(node);
    return {
      icon: <AntdJsonTypeIcon type={node.type} />,
      key,
      title: (
        <Flex align='center' className='jsonforms-mixed-tree-row' gap={4}>
          {rootNode ? null : (
            <Typography.Text
              className='jsonforms-mixed-tree-label'
              ellipsis={{ tooltip: mixedTreeLabel(node) }}
            >
              {mixedTreeLabel(node)}
            </Typography.Text>
          )}
          <Flex
            className={`jsonforms-mixed-tree-actions${
              rootNode ? ' root-actions' : ''
            }`}
            gap={2}
          >
            {rootNode ? (
              <Tooltip
                title={showPrimitives ? 'Hide primitives' : 'Show primitives'}
              >
                <Button
                  aria-label={
                    showPrimitives ? 'Hide primitives' : 'Show primitives'
                  }
                  icon={
                    showPrimitives ? <EyeOutlined /> : <EyeInvisibleOutlined />
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowPrimitives((current) => !current);
                  }}
                  size='small'
                  type='text'
                />
              </Tooltip>
            ) : null}
            {renameable ? (
              <Tooltip title='Rename'>
                <Button
                  aria-label={`Rename ${mixedTreeLabel(node)}`}
                  icon={<EditOutlined />}
                  onClick={(event) => {
                    event.stopPropagation();
                    setRenamingNode(node);
                    setRenameValue(String(node.path[node.path.length - 1]));
                  }}
                  size='small'
                  type='text'
                />
              </Tooltip>
            ) : null}
            {deletable ? (
              <Tooltip title='Delete'>
                <Button
                  aria-label={`Delete ${mixedTreeLabel(node)}`}
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (structured && node.children.length > 0) {
                      setDeletingNode(node);
                    } else {
                      onDelete(node);
                    }
                  }}
                  size='small'
                  type='text'
                />
              </Tooltip>
            ) : null}
          </Flex>
        </Flex>
      ),
      children: node.children
        .map(toDataNode)
        .filter((child): child is DataNode => Boolean(child)),
    };
  };

  nodeMap.clear();
  const treeData = [toDataNode(root)].filter((node): node is DataNode =>
    Boolean(node)
  );

  return (
    <Flex className='jsonforms-mixed-tree' vertical gap='small'>
      <style>{`
        .jsonforms-mixed-tree .ant-tree-treenode { align-items: center; display: flex; width: 100%; }
        .jsonforms-mixed-tree .ant-tree-indent-unit { width: 20px; }
        .jsonforms-mixed-tree .ant-tree-node-content-wrapper { display: flex; flex: 1 1 auto; min-width: 0; }
        .jsonforms-mixed-tree .ant-tree-iconEle { flex: 0 0 24px; margin-inline-end: 0; text-align: center; }
        .jsonforms-mixed-tree .ant-tree-title { display: block; flex: 1 1 auto; min-width: 0; }
        .jsonforms-mixed-tree .ant-tree-list-holder-inner { min-width: max-content; }
        .jsonforms-mixed-tree-row { min-width: 0; width: 100%; }
        .jsonforms-mixed-tree-label { min-width: 0; flex: 1 1 auto; }
        .jsonforms-mixed-tree-actions { margin-inline-start: auto; flex: 0 0 auto; opacity: 0; visibility: hidden; }
        .jsonforms-mixed-tree-actions.root-actions,
        .ant-tree-node-content-wrapper:hover .jsonforms-mixed-tree-actions,
        .ant-tree-node-content-wrapper:focus-within .jsonforms-mixed-tree-actions { opacity: 1; visibility: visible; }
        .jsonforms-mixed-tree-actions .ant-btn { height: 24px; padding: 0; width: 24px; }
        .jsonforms-mixed-tree-type-icon { align-items: center; display: inline-flex; justify-content: center; width: 20px; }
      `}</style>
      <Input.Search
        allowClear
        aria-label='Search value tree'
        onChange={(event) => setSearch(event.currentTarget.value)}
        placeholder='Search tree...'
        value={search}
      />
      <Tree
        aria-label='Value structure'
        autoExpandParent={Boolean(normalizedSearch)}
        blockNode
        expandedKeys={normalizedSearch ? searchExpandedKeys : expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys)}
        onSelect={(keys) => {
          const node = keys[0] ? nodeMap.get(String(keys[0])) : undefined;
          if (node) onSelect(node);
        }}
        selectedKeys={[mixedPathKey(selectedPath)]}
        showIcon
        treeData={treeData}
      />
      <AntdAdditionalPropertyRenameDialog
        disabled={
          !renamingNode ||
          Boolean(renameError) ||
          !renameValue.trim() ||
          renameValue.trim() ===
            String(renamingNode.path[renamingNode.path.length - 1])
        }
        error={renameError}
        oldName={
          renamingNode
            ? String(renamingNode.path[renamingNode.path.length - 1])
            : null
        }
        onCancel={closeRename}
        onChange={setRenameValue}
        onRename={() => {
          if (!renamingNode || renameError) return;
          onRename(renamingNode, renameValue.trim());
          closeRename();
        }}
        value={renameValue}
      />
      <Modal
        okButtonProps={{ danger: true }}
        okText='Delete'
        onCancel={() => setDeletingNode(null)}
        onOk={() => {
          if (deletingNode) onDelete(deletingNode);
          setDeletingNode(null);
        }}
        open={Boolean(deletingNode)}
        title='Confirm delete'
      >
        Delete {deletingNode ? mixedTreeLabel(deletingNode) : 'this item'} and
        all of its nested content?
      </Modal>
    </Flex>
  );
};
