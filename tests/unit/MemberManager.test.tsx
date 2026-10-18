import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemberManager } from '@/components/projects/MemberManager';
import { Project } from '@/types';
import { AppError } from '@/lib/errors';
import { renderWithProviders } from '../helpers/render';

describe('MemberManager Component', () => {
  const project: Project = {
    id: 'proj-1',
    name: 'Team Project',
    description: '',
    ownerId: 'owner-uid',
    memberIds: ['owner-uid', 'member-1-uid', 'member-2-uid'],
    memberNames: {
      'owner-uid': 'Alice Owner',
      'member-1-uid': 'Bob Member',
      'member-2-uid': 'Charlie Member',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders members list from memberNames and does NOT show Remove button for owner', () => {
    renderWithProviders(
      <MemberManager
        project={project}
        onAddMember={vi.fn()}
        onRemoveMember={vi.fn()}
        getAssignedTaskCount={vi.fn().mockResolvedValue(0)}
      />
    );

    // Shows all members
    expect(screen.getByTestId('member-manager')).toBeInTheDocument();
    expect(screen.getByTestId('member-list')).toBeInTheDocument();
    expect(screen.getAllByTestId('member-row').length).toBe(3);
    expect(screen.getByTestId('add-member-form')).toBeInTheDocument();
    expect(screen.getByTestId('add-member-input')).toBeInTheDocument();
    expect(screen.getByTestId('add-member-btn')).toBeInTheDocument();

    expect(screen.getByText('Alice Owner')).toBeInTheDocument();
    expect(screen.getByText('Bob Member')).toBeInTheDocument();
    expect(screen.getByText('Charlie Member')).toBeInTheDocument();

    // Owner badge
    expect(screen.getByText('Owner')).toBeInTheDocument();

    // Remove buttons: only Bob and Charlie have Remove buttons, NOT Alice
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons.length).toBe(2);
  });

  it('shows ConfirmDialog stating assigned tasks count when Remove is clicked', async () => {
    const handleRemove = vi.fn().mockResolvedValue({ unassigned: 3 });
    const getCount = vi.fn().mockResolvedValue(3);

    renderWithProviders(
      <MemberManager
        project={project}
        onAddMember={vi.fn()}
        onRemoveMember={handleRemove}
        getAssignedTaskCount={getCount}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]); // Remove Bob

    await waitFor(() => {
      expect(
        screen.getByText(/3 assigned tasks will be unassigned/i)
      ).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /confirm remove|remove member/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleRemove).toHaveBeenCalledWith('member-1-uid');
    });
  });

  it('displays unknown-user error next to email field when member is not found', async () => {
    const handleAdd = vi.fn().mockRejectedValue(
      new AppError('unknown-user', 'No user found with this email address')
    );

    renderWithProviders(
      <MemberManager
        project={project}
        onAddMember={handleAdd}
        onRemoveMember={vi.fn()}
        getAssignedTaskCount={vi.fn().mockResolvedValue(0)}
      />
    );

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'notfound@example.test' } });

    const addBtn = screen.getByRole('button', { name: /add member/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/No user found with this email address/i)
      ).toBeInTheDocument();
    });
  });
});
