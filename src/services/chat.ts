// ============================================================================
// 1. IMPORTS
// ============================================================================
import {
  Firestore,
  collection,
  doc,
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { ChatMessage, SendMessageInput, TaskMention } from '@/types/chat';
import { TaskStatus } from '@/types';

// ============================================================================
// 2. CONFIG & HELPERS (EASY EDIT ZONE)
// ============================================================================
export const CHAT_LIMIT = 100;

export function getGeneralChannelId(): string {
  return 'general';
}

/**
 * Returns a deterministic DM channel id sorted by uid.
 * E.g. getDmChannelId('userB', 'userA') => 'dm_userA_userB'
 */
export function getDmChannelId(uidA: string, uidB: string): string {
  const [first, second] = [uidA, uidB].sort();
  return `dm_${first}_${second}`;
}

export function formatTaskMentionFromTask(task: {
  id: string;
  title: string;
  status: TaskStatus;
}): TaskMention {
  return {
    taskId: task.id,
    taskTitle: task.title,
    taskStatus: task.status,
  };
}

// ============================================================================
// 3. SERVICE FUNCTIONS
// ============================================================================

interface SendMessageInjections {
  collectionFn?: typeof collection;
  docFn?: typeof doc;
  setDocFn?: typeof setDoc;
  nowFn?: () => Date;
}

/**
 * Sends a chat message to a specific project channel in Firestore.
 */
export async function sendMessage(
  db: Firestore,
  input: SendMessageInput,
  injections: SendMessageInjections = {}
): Promise<ChatMessage> {
  const collectionFn = injections.collectionFn || collection;
  const docFn = injections.docFn || doc;
  const setDocFn = injections.setDocFn || setDoc;
  const nowFn = injections.nowFn || (() => new Date());

  const messagesCol = collectionFn(
    db,
    'projects',
    input.projectId,
    'channels',
    input.channelId,
    'messages'
  );

  const newDocRef = docFn(messagesCol);
  const now = nowFn();

  const message: ChatMessage = {
    id: newDocRef.id,
    channelId: input.channelId,
    projectId: input.projectId,
    senderId: input.senderId,
    senderName: input.senderName,
    senderRole: input.senderRole || 'member',
    text: input.text.trim(),
    taskMention: input.taskMention || null,
    createdAt: now.toISOString(),
  };

  await setDocFn(newDocRef, message);
  return message;
}

/**
 * Subscribes to real-time chat messages for a project channel.
 */
export function subscribeToMessages(
  db: Firestore,
  projectId: string,
  channelId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const messagesCol = collection(
    db,
    'projects',
    projectId,
    'channels',
    channelId,
    'messages'
  );

  const q = query(messagesCol, orderBy('createdAt', 'asc'), limit(CHAT_LIMIT));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((d) => {
        messages.push(d.data() as ChatMessage);
      });
      onUpdate(messages);
    },
    (err) => {
      onError?.(err);
    }
  );
}
