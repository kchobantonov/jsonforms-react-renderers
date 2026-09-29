import React from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@jsonforms-react-shadcn-ui/dialog';

export const DeleteDialog = ({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete item?</DialogTitle>
        <DialogDescription>
          This will remove the selected item and its data.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type='button' variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='button' variant='destructive' onClick={onConfirm}>
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
