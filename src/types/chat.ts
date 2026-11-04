// ============================================================================
// 1. TYPES & INTERFACES FOR PROJECT CHAT & HUDDLE
// ============================================================================
import { TaskStatus } from '@/types';

export interface TaskMention {
  taskId: string;
  taskTitle: string;
  taskStatus: TaskStatus;
}

export interface ChatMessage {
  id: string;
  channelId: string; // 'general' or 'dm_{uidA}_{uidB}'
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole?: 'owner' | 'member';
  text: string;
  taskMention?: TaskMention | null;
  createdAt: string; // ISO String
}

export interface SendMessageInput {
  channelId: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole?: 'owner' | 'member';
  text: string;
  taskMention?: TaskMention | null;
}

export interface HuddleParticipant {
  uid: string;
  displayName: string;
  role?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
  joinedAt: string;
}

export interface HuddleSession {
  id: string; // 'active-huddle'
  projectId: string;
  active: boolean;
  startedBy: string;
  startedByName: string;
  participants: Record<string, HuddleParticipant>;
  updatedAt: string;
}

export interface UserPresence {
  uid: string;
  displayName: string;
  status: 'online' | 'in_call' | 'offline';
  lastSeen: string;
}

export interface WebRTCSignalData {
  fromUid: string;
  toUid: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: string; // Serialized RTCSessionDescriptionInit or RTCIceCandidateInit
  timestamp: string;
}
