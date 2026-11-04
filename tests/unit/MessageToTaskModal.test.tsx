import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MessageToTaskModal } from '@/components/chat/MessageToTaskModal';
import { ChatMessage } from '@/types/chat';
import { Project } from '@/types';
import { renderWithProviders } from '../helpers/render';

vi.mock('@/services/tasks', () => ({
  createTask: vi.fn().mockResolvedValue('new-task-id-123'),
}));

vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn().mockReturnValue({}),
}));

describe('MessageToTaskModal Component', () => {
  const mockProject: Project = {
    id: 'proj-1',
    name: 'E-Commerce Platform',
    description: 'Project description',
    ownerId: 'owner-uid',
    memberIds: ['owner-uid', 'member-1'],
    memberNames: {
      'owner-uid': 'Owner User',
      'member-1': 'Member User',
    },
    memberProfiles: [
      {
        uid: 'owner-uid',
        email: 'owner@test.com',
        displayName: 'Owner User',
        jobTitle: 'Project Manager',
        role: 'owner',
        addedAt: '2026-11-01',
      },
      {
        uid: 'member-1',
        email: 'member@test.com',
        displayName: 'Member User',
        jobTitle: 'QA Engineer',
        role: 'member',
        addedAt: '2026-11-01',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMessage: ChatMessage = {
    id: 'msg-1',
    channelId: 'general',
    projectId: 'proj-1',
    senderId: 'member-1',
    senderName: 'Member User',
    text: 'Please review login vulnerability and security headers before deployment.',
    createdAt: '2026-11-04T12:00:00Z',
  };

  it('renders modal with message prefilled in title and description', () => {
    renderWithProviders(
      <MessageToTaskModal
        isOpen={true}
        onClose={vi.fn()}
        message={mockMessage}
        project={mockProject}
      />
    );

    expect(screen.getByTestId('message-to-task-dialog')).toBeInTheDocument();
    const titleInput = screen.getByTestId('task-title-input') as HTMLInputElement;
    expect(titleInput.value).toContain('Please review login vulnerability');
  });

  it('submits task and invokes onTaskCreated callback', async () => {
    const handleClose = vi.fn();
    const handleCreated = vi.fn();

    renderWithProviders(
      <MessageToTaskModal
        isOpen={true}
        onClose={handleClose}
        onTaskCreated={handleCreated}
        message={mockMessage}
        project={mockProject}
        currentUserId="owner-uid"
      />
    );

    const submitBtn = screen.getByTestId('create-task-from-msg-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleCreated).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
