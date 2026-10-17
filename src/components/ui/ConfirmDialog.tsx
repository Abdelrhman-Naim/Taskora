'use client';

import React from 'react';
import { Dialog } from './Dialog';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function ConfirmDialog(props: ConfirmDialogProps): React.ReactElement | null {
  return <Dialog {...props} />;
}
