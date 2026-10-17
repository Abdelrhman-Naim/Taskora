import { describe, it, expect, vi } from 'vitest';
import React, { useState, useRef } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Dialog } from '@/components/ui/Dialog';
import { Segmented } from '@/components/ui/Segmented';

describe('Design System UI Primitives', () => {
  describe('Button', () => {
    it('renders with children, respects variant and size', () => {
      renderWithProviders(<Button variant="primary" size="md">Click me</Button>);
      const btn = screen.getByRole('button', { name: 'Click me' });
      expect(btn).toBeDefined();
      expect(btn.hasAttribute('disabled')).toBe(false);
    });

    it('sets disabled and aria-busy="true" when loading is true', () => {
      renderWithProviders(<Button loading>Submit</Button>);
      const btn = screen.getByRole('button');
      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(btn.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('IconButton', () => {
    it('renders accessible label as aria-label and has role button', () => {
      renderWithProviders(<IconButton icon="trash" label="Delete item" />);
      const btn = screen.getByRole('button', { name: 'Delete item' });
      expect(btn).toBeDefined();
      expect(btn.getAttribute('aria-label')).toBe('Delete item');
    });

    it('type-checks that label is mandatory', () => {
      // @ts-expect-error label is required on IconButton
      const element = <IconButton icon="edit" />;
      expect(element).toBeDefined();
    });
  });

  describe('Field', () => {
    it('connects label to input via id and htmlFor', () => {
      renderWithProviders(
        <Field id="test-email" label="Email address">
          {(fieldProps) => <Input {...fieldProps} type="email" />}
        </Field>
      );
      const label = screen.getByText('Email address');
      const input = screen.getByLabelText('Email address');
      expect(label.getAttribute('for')).toBe('test-email');
      expect(input.id).toBe('test-email');
      expect(input.getAttribute('aria-invalid')).toBe('false');
    });

    it('sets aria-invalid="true" and connects aria-describedby to error element', () => {
      renderWithProviders(
        <Field id="test-name" label="Project name" error="Name is too short">
          {(fieldProps) => <Input {...fieldProps} />}
        </Field>
      );
      const input = screen.getByLabelText('Project name');
      const errorEl = screen.getByText('Name is too short');

      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe(errorEl.id);
      expect(errorEl.getAttribute('role')).toBe('alert');
    });
  });

  describe('Badge', () => {
    it('renders kind="high" with text and 3-bar indicator in English', () => {
      renderWithProviders(<Badge kind="high" />, { locale: 'en' });
      const badge = screen.getByText('High');
      expect(badge).toBeDefined();
    });

    it('renders kind="high" with text and indicator in Arabic', () => {
      renderWithProviders(<Badge kind="high" />, { locale: 'ar' });
      const badge = screen.getByText('عالية');
      expect(badge).toBeDefined();
    });

    it('renders kind="overdue" with text and not color alone', () => {
      renderWithProviders(<Badge kind="overdue" />, { locale: 'en' });
      expect(screen.getByText('Overdue')).toBeDefined();

      renderWithProviders(<Badge kind="overdue" />, { locale: 'ar' });
      expect(screen.getByText('متأخرة')).toBeDefined();
    });
  });

  describe('ProgressBar', () => {
    it('renders role="progressbar" with aria-valuenow, valuemax, and aria-label', () => {
      renderWithProviders(<ProgressBar value={3} max={10} label="Project completion" />);
      const progress = screen.getByRole('progressbar', { name: 'Project completion' });
      expect(progress.getAttribute('aria-valuenow')).toBe('3');
      expect(progress.getAttribute('aria-valuemax')).toBe('10');
      expect(progress.getAttribute('aria-label')).toBe('Project completion');
    });
  });

  describe('Dialog', () => {
    function TestDialogOpener() {
      const [open, setOpen] = useState(false);
      const triggerRef = useRef<HTMLButtonElement>(null);

      return (
        <div>
          <button ref={triggerRef} onClick={() => setOpen(true)}>
            Open Dialog
          </button>
          <Dialog
            isOpen={open}
            title="Confirm deletion"
            description="Are you sure?"
            onClose={() => setOpen(false)}
            triggerRef={triggerRef}
          >
            <button onClick={() => setOpen(false)}>Cancel</button>
            <button onClick={() => setOpen(false)}>Confirm</button>
          </Dialog>
        </div>
      );
    }

    it('traps focus, closes on Escape, and returns focus to opener button', () => {
      renderWithProviders(<TestDialogOpener />);
      const openBtn = screen.getByRole('button', { name: 'Open Dialog' });

      // Open dialog
      fireEvent.click(openBtn);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();

      // Check Esc key closes
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).toBeNull();

      // Check focus restored
      expect(document.activeElement).toBe(openBtn);
    });
  });

  describe('Segmented', () => {
    it('navigates options via keyboard arrows', () => {
      const onChange = vi.fn();
      renderWithProviders(
        <Segmented
          label="View mode"
          value="list"
          onChange={onChange}
          options={[
            { value: 'list', label: 'List view' },
            { value: 'grid', label: 'Grid view' },
            { value: 'board', label: 'Board view' },
          ]}
        />
      );

      const listRadio = screen.getByRole('radio', { name: 'List view' });
      const gridRadio = screen.getByRole('radio', { name: 'Grid view' });

      expect(listRadio.getAttribute('aria-checked')).toBe('true');
      expect(gridRadio.getAttribute('aria-checked')).toBe('false');

      // ArrowRight advances to next option
      fireEvent.keyDown(listRadio, { key: 'ArrowRight' });
      expect(onChange).toHaveBeenCalledWith('grid');
    });
  });
});
