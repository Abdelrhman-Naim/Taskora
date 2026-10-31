import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AIProjectArchitectModal } from '@/components/ai/AIProjectArchitectModal';
import { renderWithProviders } from '../helpers/render';

describe('AIProjectArchitectModal Component', () => {
  const mockMembers = [
    { uid: 'u1', displayName: 'Ahmed Designer', jobTitle: 'UI/UX Designer' },
    { uid: 'u2', displayName: 'Sarah Backend', jobTitle: 'Backend Developer' },
  ];

  it('renders modal with prompt input and microphone trigger when open', () => {
    renderWithProviders(
      <AIProjectArchitectModal
        isOpen={true}
        onClose={vi.fn()}
        members={mockMembers}
        onProjectCreated={vi.fn()}
      />
    );

    expect(screen.getByTestId('ai-architect-modal')).toBeInTheDocument();
    expect(screen.getByTestId('ai-prompt-input')).toBeInTheDocument();
    expect(screen.getByTestId('ai-mic-btn')).toBeInTheDocument();
    expect(screen.getByTestId('ai-generate-btn')).toBeInTheDocument();
  });

  it('triggers generation and displays preview of tasks with role assignments', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        projectName: 'Smart Delivery App',
        projectDescription: 'On-demand food delivery platform',
        tasks: [
          {
            title: 'Design Mobile UI',
            description: 'Figma mockups',
            priority: 'high',
            suggestedDueDaysFromNow: 5,
            assignedMemberUid: 'u1',
            assignedMemberName: 'Ahmed Designer',
            assignedMemberRole: 'UI/UX Designer',
            checklist: ['Home screen', 'Checkout'],
          },
        ],
      }),
    } as unknown as Response);

    renderWithProviders(
      <AIProjectArchitectModal
        isOpen={true}
        onClose={vi.fn()}
        members={mockMembers}
        onProjectCreated={vi.fn()}
      />
    );

    const input = screen.getByTestId('ai-prompt-input');
    fireEvent.change(input, { target: { value: 'تطبيق توصيل طعام ذكي' } });

    const generateBtn = screen.getByTestId('ai-generate-btn');
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Smart Delivery App')).toBeInTheDocument();
      expect(screen.getByText('Design Mobile UI')).toBeInTheDocument();
      expect(screen.getByText('UI/UX Designer')).toBeInTheDocument();
    });
  });
});
