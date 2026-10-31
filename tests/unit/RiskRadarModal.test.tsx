import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RiskRadarModal } from '@/components/ai/RiskRadarModal';
import { renderWithProviders } from '../helpers/render';
import { Task } from '@/types';

describe('RiskRadarModal Component', () => {
  const mockMembers = [
    { uid: 'u1', displayName: 'Ahmed Designer', jobTitle: 'UI/UX Designer' },
    { uid: 'u2', displayName: 'Sarah Backend', jobTitle: 'Backend Developer' },
  ];

  const mockTasks: Task[] = [
    {
      id: 't1',
      projectId: 'proj-1',
      title: 'Setup Database',
      description: 'Overdue task',
      status: 'in_progress',
      priority: 'high',
      assigneeId: 'u2',
      createdBy: 'u1',
      dueDate: '2026-10-01', // overdue
      checklist: [],
      labels: [],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders modal with project health assessment when opened', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        overallHealth: 'moderate_risk',
        healthScore: 68,
        risks: [
          {
            id: 'r1',
            level: 'high',
            title: 'Critical Overdue Deliverable',
            description: 'Database setup is past deadline',
            recommendation: 'Reassign or unblock dependencies immediately',
          },
        ],
        executiveSummary: 'Weekly Executive Report: Project is progressing with 1 critical risk.',
        workloadDistribution: [
          {
            memberUid: 'u2',
            memberName: 'Sarah Backend',
            role: 'Backend Developer',
            taskCount: 1,
            isOverloaded: false,
          },
        ],
      }),
    } as unknown as Response);

    renderWithProviders(
      <RiskRadarModal
        isOpen={true}
        onClose={vi.fn()}
        projectName="Core Platform"
        tasks={mockTasks}
        members={mockMembers}
      />
    );

    expect(screen.getByTestId('risk-radar-modal')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Critical Overdue Deliverable')).toBeInTheDocument();
      expect(screen.getByText(/Weekly Executive Report/)).toBeInTheDocument();
    });
  });
});
