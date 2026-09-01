import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import React from 'react';

export interface MuiAdditionalPropertyRenameDialogProps {
  disabled: boolean;
  error?: string;
  oldName: string | null;
  onCancel: () => void;
  onChange: (value: string) => void;
  onRename: () => void;
  value: string;
}

export const MuiAdditionalPropertyRenameDialog = ({
  disabled,
  error,
  oldName,
  onCancel,
  onChange,
  onRename,
  value,
}: MuiAdditionalPropertyRenameDialogProps) => (
  <Dialog onClose={onCancel} open={oldName !== null}>
    <DialogTitle>Rename property</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Change the property name without changing its value.
      </DialogContentText>
      <TextField
        autoFocus
        error={Boolean(error)}
        fullWidth
        helperText={error}
        label='Property Name'
        margin='dense'
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onRename();
          }
        }}
        value={value}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button disabled={disabled} onClick={onRename} variant='contained'>
        Rename
      </Button>
    </DialogActions>
  </Dialog>
);
