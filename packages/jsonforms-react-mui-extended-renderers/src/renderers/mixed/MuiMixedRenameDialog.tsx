import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { MixedTreeNode } from './mixedTypes';

export const MuiMixedRenameDialog = ({
  existingNames,
  node,
  onCancel,
  onConfirm,
  validateName,
}: {
  existingNames: string[];
  node: MixedTreeNode | null;
  onCancel: () => void;
  onConfirm: (name: string) => void;
  validateName?: (name: string) => string;
}) => {
  const [name, setName] = useState('');
  useEffect(() => setName(node?.label ?? ''), [node]);
  const error = !name.trim()
    ? 'Property name is required.'
    : name.includes('.')
    ? 'Property names containing dots are not supported by JSON Forms paths.'
    : existingNames.includes(name) && name !== node?.label
    ? 'A property with this name already exists.'
    : validateName?.(name) ?? '';
  return (
    <Dialog onClose={onCancel} open={Boolean(node)}>
      <DialogTitle>Rename property</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          error={Boolean(error)}
          fullWidth
          helperText={error}
          label='Property name'
          margin='dense'
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          disabled={Boolean(error)}
          onClick={() => onConfirm(name)}
          variant='contained'
        >
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};
