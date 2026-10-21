import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import { LabelsInput } from '@/components/tasks/LabelsInput';

describe('LabelsInput Component (Task 56)', () => {
  it('adds trimmed label on Enter or comma', () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <LabelsInput value={['frontend']} onChange={handleChange} />
    );

    const input = screen.getByTestId('labels-input-field');

    // Test Enter
    fireEvent.change(input, { target: { value: '  backend  ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith(['frontend', 'backend']);

    // Test comma
    handleChange.mockClear();
    fireEvent.change(input, { target: { value: '  api,  ' } });
    fireEvent.keyDown(input, { key: ',', code: 'Comma' });
    expect(handleChange).toHaveBeenCalledWith(['frontend', 'api']);
  });

  it('ignores duplicate label case-insensitively', () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <LabelsInput value={['frontend']} onChange={handleChange} />
    );

    const input = screen.getByTestId('labels-input-field');
    fireEvent.change(input, { target: { value: 'Frontend' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('rejects adding a 6th label when max=5 and displays limit message', () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <LabelsInput value={['l1', 'l2', 'l3', 'l4', 'l5']} onChange={handleChange} max={5} />
    );

    const input = screen.getByTestId('labels-input-field');
    fireEvent.change(input, { target: { value: 'l6' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByText(/Cannot exceed 5 labels|validation\.labels\.limit/i)).toBeInTheDocument();
  });

  it('removes the last label on Backspace when input is empty', () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <LabelsInput value={['first', 'second']} onChange={handleChange} />
    );

    const input = screen.getByTestId('labels-input-field');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Backspace', code: 'Backspace' });

    expect(handleChange).toHaveBeenCalledWith(['first']);
  });
});
