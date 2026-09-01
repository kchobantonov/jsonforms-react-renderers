import React from 'react';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

type CombinatorSwitchDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const CombinatorSwitchDialog = ({
  open,
  onCancel,
  onConfirm,
}: CombinatorSwitchDialogProps) => (
  <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Clear form?</DialogTitle>
        <DialogDescription>
          Your data will be cleared if you select a schema with a different data
          type. Do you want to proceed?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type='button' variant='outline' onClick={onCancel}>
          No
        </Button>
        <Button type='button' onClick={onConfirm}>
          Yes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
