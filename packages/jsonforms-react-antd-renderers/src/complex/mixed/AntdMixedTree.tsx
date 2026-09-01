import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import { Button, Flex, Input, Tooltip, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useMemo, useState } from 'react';
import {
  mixedPathKey,
  MixedTreeNode,
  MixedTreePath,
  mixedTreeLabel,
} from './mixedTree';

export interface AntdMixedTreeProps {
  onSelect: (node: MixedTreeNode) => void;
  root: MixedTreeNode;
  selectedPath: MixedTreePath;
}

const containsSearch = (node: MixedTreeNode, search: string): boolean =>
  mixedTreeLabel(node).toLowerCase().includes(search) ||
  node.children.some((child) => containsSearch(child, search));

export const AntdMixedTree = ({
  onSelect,
  root,
  selectedPath,
}: AntdMixedTreeProps) => {
  const [search, setSearch] = useState('');
  const [showPrimitives, setShowPrimitives] = useState(false);
  const normalizedSearch = search.trim().toLowerCase();
  const nodeMap = useMemo(() => new Map<string, MixedTreeNode>(), [root]);

  const toDataNode = (node: MixedTreeNode): DataNode | null => {
    const structured = node.type === 'object' || node.type === 'array';
    if (
      node.path.length > 0 &&
      !structured &&
      !showPrimitives &&
      !normalizedSearch
    ) {
      return null;
    }
    if (normalizedSearch && !containsSearch(node, normalizedSearch)) return null;
    const key = mixedPathKey(node.path);
    nodeMap.set(key, node);
    return {
      key,
      title: (
        <Flex align='center' gap={6}>
          <Typography.Text code={structured}>{mixedTreeLabel(node)}</Typography.Text>
          {node.path.length === 0 ? (
            <Tooltip title={showPrimitives ? 'Hide primitives' : 'Show primitives'}>
              <Button
                aria-label={showPrimitives ? 'Hide primitives' : 'Show primitives'}
                icon={showPrimitives ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowPrimitives((current) => !current);
                }}
                size='small'
                type='text'
              />
            </Tooltip>
          ) : null}
        </Flex>
      ),
      children: node.children
        .map(toDataNode)
        .filter((child): child is DataNode => Boolean(child)),
    };
  };

  nodeMap.clear();
  const treeData = [toDataNode(root)].filter(
    (node): node is DataNode => Boolean(node)
  );

  return (
    <Flex vertical gap='small'>
      <Input.Search
        allowClear
        aria-label='Search value tree'
        onChange={(event) => setSearch(event.currentTarget.value)}
        placeholder='Search tree...'
        value={search}
      />
      <Tree
        aria-label='Value structure'
        defaultExpandAll
        onSelect={(keys) => {
          const node = keys[0] ? nodeMap.get(String(keys[0])) : undefined;
          if (node) onSelect(node);
        }}
        selectedKeys={[mixedPathKey(selectedPath)]}
        treeData={treeData}
      />
    </Flex>
  );
};
