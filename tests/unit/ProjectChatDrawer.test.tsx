import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ProjectChatDrawer } from '@/components/chat/ProjectChatDrawer';
import { Project, Task } from '@/types';
import { renderWithProviders } from '../helpers/render';

vi.mock('@/services/chat', () => ({
  getGeneralChannelId: () => 'general',
  getDmChannelId: (a: string, b: string) => `dm_${a}_${b}`,
  sendMessage: vi.fn().mockResolvedValue({ id: 'msg-mock-id' }),
  subscribeToMessages: vi.fn((db, projId, channelId, callback) => {
    callback([
      {
        id: 'm1',
        channelId: 'general',
        projectId: 'proj-1',
        senderId: 'user-2',
        senderName: 'Bob Designer',
        senderRole: 'member',
        text: 'Hello team, the new Figma design is ready!',
        createdAt: '2026-11-04T12:00:00Z',
      },
      {
        id: 'm2',
        channelId: 'general',
        projectId: 'proj-1',
        senderId: 'user-1',
        senderName: 'Alice Owner',
        senderRole: 'owner',
        text: 'Awesome, checking it now.',
        taskMention: {
          taskId: 't-101',
          taskTitle: 'Review Wireframes',
          taskStatus: 'in_progress',
        },
        createdAt: '2026-11-04T12:05:00Z',
      },
    ]);
    return vi.fn(); // unsubscribe mock
  }),
}));

vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn().mockReturnValue({}),
}));

describe('ProjectChatDrawer Component', () => {
  const mockProject: Project = {
    id: 'proj-1',
    name: 'E-Commerce Platform',
    description: 'Project description',
    ownerId: 'user-1',
    memberIds: ['user-1', 'user-2'],
    memberNames: {
      'user-1': 'Alice Owner',
      'user-2': 'Bob Designer',
    },
    memberProfiles: [
      {
        uid: 'user-1',
        email: 'alice@test.com',
        displayName: 'Alice Owner',
        jobTitle: 'Project Manager',
        role: 'owner',
        addedAt: '2026-11-01',
      },
      {
        uid: 'user-2',
        email: 'bob@test.com',
        displayName: 'Bob Designer',
        jobTitle: 'UI/UX Designer',
        role: 'member',
        addedAt: '2026-11-01',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasks: Task[] = [
    {
      id: 't-101',
      projectId: 'proj-1',
      title: 'Review Wireframes',
      description: 'Review UI designs',
      status: 'in_progress',
      priority: 'high',
      assigneeId: 'user-2',
      createdBy: 'user-1',
      dueDate: '2026-11-10',
      checklist: [],
      labels: ['design'],
      recurrence: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders chat drawer with messages, channel selector, and task mentions', () => {
    renderWithProviders(
      <ProjectChatDrawer
        isOpen={true}
        onClose={vi.fn()}
        project={mockProject}
        currentUserId="user-1"
        currentUserName="Alice Owner"
        currentUserRole="owner"
        isOwner={true}
        tasks={mockTasks}
      />
    );

    expect(screen.getByTestId('project-chat-drawer')).toBeInTheDocument();
    expect(screen.getByText('Hello team, the new Figma design is ready!')).toBeInTheDocument();
    expect(screen.getByText('Review Wireframes')).toBeInTheDocument();
  });

  it('allows switching between General and Direct Messages', () => {
    renderWithProviders(
      <ProjectChatDrawer
        isOpen={true}
        onClose={vi.fn()}
        project={mockProject}
        currentUserId="user-1"
        currentUserName="Alice Owner"
        currentUserRole="owner"
        isOwner={true}
        tasks={mockTasks}
      />
    );

    const dmTab = screen.getByTestId('chat-tab-dm');
    fireEvent.click(dmTab);

    expect(screen.getByTestId('dm-member-select')).toBeInTheDocument();
  });

  it('triggers onJoinHuddle callback when clicking the call button', () => {
    const handleJoinHuddle = vi.fn();

    renderWithProviders(
      <ProjectChatDrawer
        isOpen={true}
        onClose={vi.fn()}
        project={mockProject}
        currentUserId="user-1"
        currentUserName="Alice Owner"
        currentUserRole="owner"
        isOwner={true}
        onJoinHuddle={handleJoinHuddle}
      />
    );

    const callBtn = screen.getByTestId('drawer-join-huddle-btn');
    fireEvent.click(callBtn);

    expect(handleJoinHuddle).toHaveBeenCalledOnce();
  });
});
