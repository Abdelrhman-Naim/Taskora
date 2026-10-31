import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MagicQuickAddBar } from '@/components/ai/MagicQuickAddBar';
import { renderWithProviders } from '../helpers/render';

describe('MagicQuickAddBar Component', () => {
  const mockMembers = [
    { uid: 'u1', displayName: 'Ahmed Designer', jobTitle: 'UI/UX Designer' },
    { uid: 'u2', displayName: 'Sarah Backend', jobTitle: 'Backend Developer' },
  ];

  it('renders quick-add command input with mic and submit buttons', () => {
    renderWithProviders(
      <MagicQuickAddBar
        projectId="proj-1"
        members={mockMembers}
        onTaskCreated={vi.fn()}
      />
    );

    expect(screen.getByTestId('magic-quick-add-bar')).toBeInTheDocument();
    expect(screen.getByTestId('magic-quick-add-input')).toBeInTheDocument();
    expect(screen.getByTestId('magic-quick-add-mic')).toBeInTheDocument();
    expect(screen.getByTestId('magic-quick-add-btn')).toBeInTheDocument();
  });

  it('submits natural language prompt and invokes onTaskCreated', async () => {
    const onTaskCreated = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'Design Checkout Flow',
        description: 'High-priority checkout UI',
        priority: 'high',
        dueDate: '2026-11-05',
        assigneeId: 'u1',
        checklist: ['Wireframe', 'Figma link'],
      }),
    } as unknown as Response);

    renderWithProviders(
      <MagicQuickAddBar
        projectId="proj-1"
        members={mockMembers}
        onTaskCreated={onTaskCreated}
      />
    );

    const input = screen.getByTestId('magic-quick-add-input');
    fireEvent.change(input, {
      target: { value: 'صمم شاشة الدفع للمصمم يوم الخميس أولوية عالية' },
    });

    const submitBtn = screen.getByTestId('magic-quick-add-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/quick-task',
        expect.anything()
      );
    });
  });
});
