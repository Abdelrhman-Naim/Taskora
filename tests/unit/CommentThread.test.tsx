import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { renderWithProviders } from '../helpers/render';
import { CommentThread } from '@/components/tasks/CommentThread';
import { Task, Project, TaskComment } from '@/types';
import * as commentsService from '@/services/comments';
import { AppError } from '@/lib/errors';

vi.mock('@/services/comments', () => ({
  listComments: vi.fn(),
  addComment: vi.fn(),
  deleteComment: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  getDb: vi.fn(() => ({})),
}));

describe('CommentThread Component (Task 57)', () => {
  const project: Project = {
    id: 'proj-1',
    name: 'Sample Project',
    description: '',
    ownerId: 'user-owner',
    memberIds: ['user-owner', 'user-creator', 'user-assignee', 'user-other'],
    memberNames: {
      'user-owner': 'Alice Owner',
      'user-creator': 'Bob Creator',
      'user-assignee': 'Charlie Assignee',
      'user-other': 'David Other',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const task: Task = {
    id: 'task-1',
    projectId: 'proj-1',
    title: 'Sample Task',
    description: 'Task desc',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'user-assignee',
    createdBy: 'user-creator',
    dueDate: '2026-10-30',
    checklist: [],
    labels: [],
    recurrence: 'none',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockComments: TaskComment[] = [
    {
      id: 'c-oldest',
      projectId: 'proj-1',
      taskId: 'task-1',
      authorId: 'user-creator',
      authorName: 'Bob Creator',
      text: 'First old comment',
      createdAt: new Date('2026-10-18T10:00:00Z'),
    },
    {
      id: 'c-newest',
      projectId: 'proj-1',
      taskId: 'task-1',
      authorId: 'user-other',
      authorName: 'David Other',
      text: 'Second newer comment',
      createdAt: new Date('2026-10-18T11:00:00Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders comments oldest first, author name inside bdi, or empty state if none', async () => {
    vi.mocked(commentsService.listComments).mockResolvedValue(mockComments);

    renderWithProviders(
      <CommentThread
        project={project}
        task={task}
        currentUserId="user-creator"
        currentUserName="Bob Creator"
        isOwner={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('task-comments-thread')).toBeInTheDocument();
    });

    const commentElements = screen.getAllByTestId(/^comment-item-/);
    expect(commentElements).toHaveLength(2);
    // Oldest first
    expect(commentElements[0]).toHaveTextContent('First old comment');
    expect(commentElements[1]).toHaveTextContent('Second newer comment');

    // Author names in <bdi>
    const authorBdi = screen.getByText('Bob Creator');
    expect(authorBdi.tagName.toLowerCase()).toBe('bdi');
  });

  it('submit button is disabled for empty or whitespace-only input', async () => {
    vi.mocked(commentsService.listComments).mockResolvedValue([]);

    renderWithProviders(
      <CommentThread
        project={project}
        task={task}
        currentUserId="user-creator"
        currentUserName="Bob Creator"
        isOwner={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('comment-submit-btn')).toBeDisabled();
    });

    const input = screen.getByTestId('comment-input');
    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.getByTestId('comment-submit-btn')).toBeDisabled();
  });

  it('sends comment on Ctrl+Enter, clears input and displays comment immediately', async () => {
    vi.mocked(commentsService.listComments).mockResolvedValue([]);
    vi.mocked(commentsService.addComment).mockResolvedValue('c-new-id');

    renderWithProviders(
      <CommentThread
        project={project}
        task={task}
        currentUserId="user-creator"
        currentUserName="Bob Creator"
        isOwner={false}
      />
    );

    await screen.findByText('No comments yet');
    const input = screen.getByTestId('comment-input');
    fireEvent.change(input, { target: { value: 'Awesome update!' } });

    // Press Ctrl+Enter
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(commentsService.addComment).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Awesome update!')).toBeInTheDocument();
    });
    expect((input as HTMLTextAreaElement).value).toBe('');
  });

  it('restores input text and shows error if addComment fails', async () => {
    vi.mocked(commentsService.listComments).mockResolvedValue([]);
    vi.mocked(commentsService.addComment).mockRejectedValue(
      new AppError('network', 'Network timeout')
    );

    renderWithProviders(
      <CommentThread
        project={project}
        task={task}
        currentUserId="user-creator"
        currentUserName="Bob Creator"
        isOwner={false}
      />
    );

    const input = await screen.findByTestId('comment-input');
    fireEvent.change(input, { target: { value: 'Will fail comment' } });

    const submitBtn = screen.getByTestId('comment-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Input text restored
    expect((input as HTMLTextAreaElement).value).toBe('Will fail comment');
  });

  it('delete button appears only for author, owner, or task creator', async () => {
    vi.mocked(commentsService.listComments).mockResolvedValue(mockComments);
    vi.mocked(commentsService.deleteComment).mockResolvedValue(undefined);

    // Render as user-creator (who created task-1 and created c-oldest, but NOT c-newest)
    // Because user-creator created task-1, they have delete permission on BOTH comments!
    const { rerender } = renderWithProviders(
      <CommentThread
        project={project}
        task={task}
        currentUserId="user-creator"
        currentUserName="Bob Creator"
        isOwner={false}
      />
    );

    await screen.findByTestId('task-comments-thread');
    expect(screen.getByTestId('comment-delete-c-oldest')).toBeInTheDocument();
    expect(screen.getByTestId('comment-delete-c-newest')).toBeInTheDocument();

    // Render as user-other (who authored c-newest, but did NOT create task-1 and is not owner)
    rerender(
      <CommentThread
        project={project}
        task={task}
        currentUserId="user-other"
        currentUserName="David Other"
        isOwner={false}
      />
    );

    // user-other can delete their own comment c-newest, but CANNOT delete c-oldest
    expect(screen.queryByTestId('comment-delete-c-oldest')).not.toBeInTheDocument();
    expect(screen.getByTestId('comment-delete-c-newest')).toBeInTheDocument();
  });
});
