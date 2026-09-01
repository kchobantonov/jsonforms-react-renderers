import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Box,
  IconButton,
  List,
  ListItemButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { MuiJsonTypeIcon } from './MuiJsonTypeIcon';
import {
  mixedTreeNodeLabel,
  MixedTreeNode,
  MixedTreePath,
  pathKey,
} from './mixedTypes';

export interface MuiMixedTreeProps {
  canDelete: (node: MixedTreeNode) => boolean;
  disabled: boolean;
  onDelete: (node: MixedTreeNode) => void;
  onRename: (node: MixedTreeNode) => void;
  onSelect: (node: MixedTreeNode) => void;
  root: MixedTreeNode;
  selectedPath: MixedTreePath;
}

const containsSearch = (node: MixedTreeNode, search: string): boolean =>
  node.label.toLowerCase().includes(search) ||
  node.children.some((child) => containsSearch(child, search));

export const MuiMixedTree = ({
  canDelete,
  disabled,
  onDelete,
  onRename,
  onSelect,
  root,
  selectedPath,
}: MuiMixedTreeProps) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['$']));
  const [search, setSearch] = useState('');
  const [showPrimitives, setShowPrimitives] = useState(false);
  const normalizedSearch = search.trim().toLowerCase();

  useEffect(() => {
    setExpanded((current) => {
      const next = new Set(current);
      for (let length = 0; length <= selectedPath.length; length += 1) {
        next.add(pathKey(selectedPath.slice(0, length)));
      }
      return next;
    });
  }, [selectedPath]);

  const renderNode = (node: MixedTreeNode, depth: number): React.ReactNode => {
    const key = pathKey(node.path);
    const rootNode = node.path.length === 0;
    const structured = node.type === 'object' || node.type === 'array';
    const matches = !normalizedSearch || containsSearch(node, normalizedSearch);
    if (!matches || (!showPrimitives && !structured && node.path.length > 0))
      return null;
    const isExpanded = expanded.has(key) || Boolean(normalizedSearch);
    const visibleChildren = node.children.map((child) =>
      renderNode(child, depth + 1)
    );
    return (
      <React.Fragment key={key}>
        <ListItemButton
          aria-label={rootNode ? `${node.type} root` : undefined}
          aria-expanded={structured ? isExpanded : undefined}
          aria-selected={key === pathKey(selectedPath)}
          onClick={() => onSelect(node)}
          role='treeitem'
          selected={key === pathKey(selectedPath)}
          sx={{
            pl: 0.5 + depth * 2,
            py: 0.25,
            '&:hover .mixed-tree-node-actions, &:focus-within .mixed-tree-node-actions':
              {
                opacity: 1,
              },
          }}
        >
          {structured ? (
            <IconButton
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.label}`}
              onClick={(event) => {
                event.stopPropagation();
                setExpanded((current) => {
                  const next = new Set(current);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                });
              }}
              size='small'
              tabIndex={-1}
            >
              <ChevronRightIcon
                sx={{
                  transform: isExpanded ? 'rotate(90deg)' : 'none',
                  transition: (theme) =>
                    theme.transitions.create('transform', {
                      duration: theme.transitions.duration.shortest,
                    }),
                }}
              />
            </IconButton>
          ) : (
            <Box sx={{ width: 34 }} />
          )}
          <MuiJsonTypeIcon sx={{ mr: 1 }} type={node.type} />
          {rootNode ? (
            <Box sx={{ flex: 1 }} />
          ) : (
            <Typography noWrap sx={{ flex: 1 }} variant='body2'>
              {mixedTreeNodeLabel(node)}
            </Typography>
          )}
          {rootNode ? (
            <Tooltip
              title={showPrimitives ? 'Hide primitives' : 'Show primitives'}
            >
              <IconButton
                aria-label={
                  showPrimitives ? 'Hide primitives' : 'Show primitives'
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setShowPrimitives((current) => !current);
                }}
                size='small'
              >
                {showPrimitives ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </IconButton>
            </Tooltip>
          ) : null}
          {node.dynamic ? (
            <Tooltip title='Rename property'>
              <span>
                <IconButton
                  aria-label={`Rename ${node.label}`}
                  disabled={disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRename(node);
                  }}
                  className='mixed-tree-node-actions'
                  size='small'
                  sx={{ opacity: 0 }}
                >
                  <EditIcon />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
          {node.path.length > 0 ? (
            <Tooltip
              title={
                canDelete(node)
                  ? 'Delete item'
                  : 'The schema requires this item to remain.'
              }
            >
              <span>
                <IconButton
                  aria-label={`Delete ${node.label}`}
                  disabled={disabled || !canDelete(node)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(node);
                  }}
                  className='mixed-tree-node-actions'
                  size='small'
                  sx={{ opacity: 0 }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </ListItemButton>
        {structured && isExpanded ? visibleChildren : null}
      </React.Fragment>
    );
  };

  const tree = useMemo(
    () => renderNode(root, 0),
    [
      canDelete,
      disabled,
      expanded,
      normalizedSearch,
      root,
      selectedPath,
      showPrimitives,
    ]
  );

  return (
    <Stack spacing={1}>
      <TextField
        aria-label='Search tree'
        fullWidth
        onChange={(event) => setSearch(event.target.value)}
        placeholder='Search tree...'
        size='small'
        value={search}
      />
      <List aria-label='Value structure' disablePadding role='tree'>
        {tree}
      </List>
    </Stack>
  );
};
