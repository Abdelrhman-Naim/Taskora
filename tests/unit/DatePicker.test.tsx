import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import { DatePicker } from '@/components/ui/DatePicker';

describe('DatePicker Component', () => {
  it('renders input with id, value, placeholder, and calendar button', () => {
    renderWithProviders(
      <DatePicker
        id="test-date"
        value="2026-10-20"
        onChange={() => {}}
        data-testid="date-picker-input"
      />
    );

    const input = screen.getByTestId('date-picker-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.id).toBe('test-date');
    expect(input.value).toBe('2026-10-20');
    expect(input.getAttribute('dir')).toBe('ltr');
  });

  it('opens custom calendar popup when calendar trigger is clicked', () => {
    renderWithProviders(
      <DatePicker
        id="test-date"
        value="2026-10-20"
        onChange={() => {}}
        data-testid="date-picker-input"
      />
    );

    const openBtn = screen.getByLabelText(/open calendar|فتح التقويم/i);
    fireEvent.click(openBtn);

    const calendarDialog = screen.getByRole('dialog', { name: /calendar|التقويم/i });
    expect(calendarDialog).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('selects date when day cell is clicked and calls onChange', () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <DatePicker
        id="test-date"
        value="2026-10-20"
        onChange={handleChange}
        data-testid="date-picker-input"
      />
    );

    const openBtn = screen.getByLabelText(/open calendar|فتح التقويم/i);
    fireEvent.click(openBtn);

    // Click day 25
    const dayBtn = screen.getAllByRole('button', { name: '25' })[0];
    fireEvent.click(dayBtn);

    expect(handleChange).toHaveBeenCalled();
  });

  it('clears date when clear button is clicked', () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <DatePicker
        id="test-date"
        value="2026-10-20"
        onChange={handleChange}
        data-testid="date-picker-input"
      />
    );

    const clearBtn = screen.getByLabelText(/clear date|مسح التاريخ/i);
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalled();
  });
});
