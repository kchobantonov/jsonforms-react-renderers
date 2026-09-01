import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import React from 'react';
import { MixedTreeNode } from './mixedTypes';

export const MuiMixedDeleteDialog = ({
  node,
  onCancel,
  onConfirm,
}: {
  node: MixedTreeNode | null;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <Dialog onClose={onCancel} open={Boolean(node)}>
    <DialogTitle>Delete {node?.label}?</DialogTitle>
    <DialogContent>
      <DialogContentText>
        This value contains nested content. Deleting it cannot be undone.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button color='error' onClick={onConfirm} variant='contained'>
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);
