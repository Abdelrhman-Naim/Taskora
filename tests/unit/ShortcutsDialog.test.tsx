import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShortcutsDialog } from '@/components/shell/ShortcutsDialog';
import { I18nProvider } from '@/i18n/I18nProvider';

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider initialLocale="en">{ui}</I18nProvider>);
}

describe('ShortcutsDialog (Task 62)', () => {
  it('does not render when isOpen is false', () => {
    renderWithI18n(<ShortcutsDialog isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('shortcuts-dialog')).toBeNull();
  });

  it('renders shortcut keys when isOpen is true', () => {
    renderWithI18n(<ShortcutsDialog isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('shortcuts-dialog')).toBeInTheDocument();
    expect(screen.getByText('N')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    renderWithI18n(<ShortcutsDialog isOpen={true} onClose={handleClose} />);
    const closeBtn = screen.getByLabelText('Close');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
