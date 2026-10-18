import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

describe('ConfirmDialog Component', () => {
  it('renders modal with title, message, and action buttons', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Project"
        message="Are you sure you want to delete this project?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog-confirm-btn')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog-cancel-btn')).toBeInTheDocument();
    expect(screen.getByText('Delete Project')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this project?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm|delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onConfirm only when Confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Action"
        message="Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when Cancel button is clicked or Escape key is pressed', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { unmount } = render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Action"
        message="Message"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    // Cancel button click
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    unmount();

    // Re-render and test Esc key
    const onCancelEsc = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Action"
        message="Message"
        onConfirm={onConfirm}
        onCancel={onCancelEsc}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancelEsc).toHaveBeenCalledTimes(1);
  });
});
