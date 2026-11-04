import { describe, it, expect, vi } from 'vitest';
import {
  getDmChannelId,
  getGeneralChannelId,
  formatTaskMentionFromTask,
  sendMessage,
} from '@/services/chat';
import {
  joinHuddleSession,
  leaveHuddleSession,
  updateMediaState,
} from '@/services/huddle';
import { HuddleParticipant } from '@/types/chat';

describe('Chat Service & Helpers', () => {
  it('generates consistent DM channel IDs regardless of argument order', () => {
    const id1 = getDmChannelId('user_alpha', 'user_beta');
    const id2 = getDmChannelId('user_beta', 'user_alpha');

    expect(id1).toBe('dm_user_alpha_user_beta');
    expect(id2).toBe('dm_user_alpha_user_beta');
    expect(id1).toBe(id2);
  });

  it('returns "general" for project general channel', () => {
    expect(getGeneralChannelId()).toBe('general');
  });

  it('formats task mention object accurately from task', () => {
    const mention = formatTaskMentionFromTask({
      id: 'task-101',
      title: 'Design Dark Mode UI',
      status: 'in_progress',
    });

    expect(mention).toEqual({
      taskId: 'task-101',
      taskTitle: 'Design Dark Mode UI',
      taskStatus: 'in_progress',
    });
  });

  it('creates and sends a chat message to Firestore', async () => {
    const mockSetDoc = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({ id: 'msg-auto-id' });
    const mockCollection = vi.fn().mockReturnValue({});

    const mockDb = {} as any;

    const sent = await sendMessage(
      mockDb,
      {
        projectId: 'proj-1',
        channelId: 'general',
        senderId: 'user-1',
        senderName: 'Alice',
        senderRole: 'owner',
        text: 'Hello team, let us review the sprint!',
      },
      {
        collectionFn: mockCollection,
        docFn: mockDoc,
        setDocFn: mockSetDoc,
        nowFn: () => new Date('2026-11-04T12:00:00Z'),
      }
    );

    expect(sent.id).toBe('msg-auto-id');
    expect(sent.text).toBe('Hello team, let us review the sprint!');
    expect(sent.senderName).toBe('Alice');
    expect(sent.createdAt).toBe('2026-11-04T12:00:00.000Z');
    expect(mockSetDoc).toHaveBeenCalledOnce();
  });
});

describe('Huddle Service', () => {
  const mockParticipant: HuddleParticipant = {
    uid: 'user-1',
    displayName: 'Alice',
    audioEnabled: true,
    videoEnabled: false,
    screenSharing: false,
    joinedAt: '2026-11-04T12:00:00Z',
  };

  it('joins a huddle and records participant state in Firestore', async () => {
    const mockSetDoc = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({});

    const mockDb = {} as any;

    await joinHuddleSession(
      mockDb,
      'proj-1',
      mockParticipant,
      {
        docFn: mockDoc,
        setDocFn: mockSetDoc,
        nowFn: () => new Date('2026-11-04T12:00:00Z'),
      }
    );

    expect(mockSetDoc).toHaveBeenCalledOnce();
    const payload = mockSetDoc.mock.calls[0][1];
    expect(payload.active).toBe(true);
    expect(payload['participants.user-1'].displayName).toBe('Alice');
    expect(payload['participants.user-1'].audioEnabled).toBe(true);
  });

  it('updates participant media state in an active huddle', async () => {
    const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
    const mockDoc = vi.fn().mockReturnValue({});

    const mockDb = {} as any;

    await updateMediaState(
      mockDb,
      'proj-1',
      'user-1',
      { audioEnabled: false, screenSharing: true },
      {
        docFn: mockDoc,
        updateDocFn: mockUpdateDoc,
      }
    );

    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const patch = mockUpdateDoc.mock.calls[0][1];
    expect(patch['participants.user-1.audioEnabled']).toBe(false);
    expect(patch['participants.user-1.screenSharing']).toBe(true);
  });

  it('leaves a huddle session by removing the participant', async () => {
    const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
    const mockDeleteField = vi.fn().mockReturnValue('DELETE_SENTINEL');
    const mockDoc = vi.fn().mockReturnValue({});

    const mockDb = {} as any;

    await leaveHuddleSession(
      mockDb,
      'proj-1',
      'user-1',
      {
        docFn: mockDoc,
        updateDocFn: mockUpdateDoc,
        deleteFieldFn: mockDeleteField,
      }
    );

    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const patch = mockUpdateDoc.mock.calls[0][1];
    expect(patch['participants.user-1']).toBe('DELETE_SENTINEL');
  });
});
