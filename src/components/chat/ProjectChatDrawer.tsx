'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { useErrorMessage } from '@/i18n/useErrorMessage';
import { getDb } from '@/lib/firebase';
import {
  getGeneralChannelId,
  getDmChannelId,
  sendMessage,
  subscribeToMessages,
  formatTaskMentionFromTask,
} from '@/services/chat';
import { Project, Task } from '@/types';
import { ChatMessage, TaskMention } from '@/types/chat';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { MessageToTaskModal } from './MessageToTaskModal';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
const DRAWER_STYLES = {
  backdrop: 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity',
  container: 'fixed inset-y-0 inset-inline-end-0 w-full sm:w-[460px] bg-surface border-inline-start border-line shadow-2xl z-50 flex flex-col text-text animate-slide-in',
  header: 'flex items-center justify-between p-4 border-b border-line bg-surface shrink-0',
  huddleBanner: 'flex items-center justify-between px-4 py-2.5 bg-accent/10 border-b border-accent/20 text-xs shrink-0',
  tabBar: 'flex items-center gap-1 p-2 border-b border-line bg-bg/50 shrink-0',
  tabBtnActive: 'flex-1 py-2 px-3 text-xs font-semibold rounded-md bg-accent text-on-accent transition-colors text-center cursor-pointer min-h-[38px]',
  tabBtnInactive: 'flex-1 py-2 px-3 text-xs font-medium rounded-md text-text-2 hover:bg-surface hover:text-text transition-colors text-center cursor-pointer min-h-[38px]',
  messagesContainer: 'flex-1 overflow-y-auto p-4 space-y-3.5',
  inputArea: 'p-3 border-t border-line bg-surface shrink-0 flex flex-col gap-2',
  inputRow: 'flex items-center gap-2',
  textInput: 'flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-text placeholder:text-text-3 focus:border-accent focus:outline-none transition-colors min-h-[44px]',
  sendBtn: 'px-4 py-2 rounded-lg bg-accent text-on-accent text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity min-h-[44px] cursor-pointer flex items-center gap-1.5',
  actionPill: 'inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-line hover:border-accent hover:text-accent transition-colors bg-bg cursor-pointer',
};

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface ProjectChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentUserId: string;
  currentUserName: string;
  currentUserRole?: 'owner' | 'member';
  isOwner: boolean;
  onJoinHuddle?: () => void;
  isHuddleActive?: boolean;
  huddleParticipantCount?: number;
  tasks?: Task[];
}

// ============================================================================
// 4. MAIN COMPONENT
// ============================================================================
export function ProjectChatDrawer({
  isOpen,
  onClose,
  project,
  currentUserId,
  currentUserName,
  currentUserRole = 'member',
  onJoinHuddle,
  isHuddleActive = false,
  huddleParticipantCount = 0,
  tasks = [],
}: ProjectChatDrawerProps): React.ReactElement | null {
  const { locale } = useI18n();
  const getErrorMessage = useErrorMessage();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'general' | 'dm'>('general');
  const [selectedDmTargetUid, setSelectedDmTargetUid] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTaskMention, setSelectedTaskMention] = useState<TaskMention | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [convertingMessage, setConvertingMessage] = useState<ChatMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Members eligible for DMs (all members except current user)
  const availableMembers = (project.memberProfiles && project.memberProfiles.length > 0)
    ? project.memberProfiles
        .filter((p) => p.uid !== currentUserId)
        .map((p) => ({ uid: p.uid, name: p.displayName, role: p.jobTitle }))
    : project.memberIds
        .filter((uid) => uid !== currentUserId)
        .map((uid) => ({
          uid,
          name: project.memberNames[uid] || 'Member',
          role: uid === project.ownerId ? 'Project Manager' : 'Team Member',
        }));

  // Effective DM target (defaults to first available member)
  const effectiveDmTargetUid = selectedDmTargetUid || (availableMembers.length > 0 ? availableMembers[0].uid : '');

  // Determine current active channel ID
  const channelId =
    activeTab === 'general'
      ? getGeneralChannelId()
      : effectiveDmTargetUid
      ? getDmChannelId(currentUserId, effectiveDmTargetUid)
      : 'general';

  // Real-time subscription to messages
  useEffect(() => {
    if (!isOpen || !project.id || !channelId) return;

    try {
      const db = getDb();
      const unsubscribe = subscribeToMessages(
        db,
        project.id,
        channelId,
        (msgs) => {
          setMessages(msgs);
        },
        (err) => {
          setError(getErrorMessage(err));
        }
      );

      return () => {
        unsubscribe();
      };
    } catch {
      // ignore
    }
  }, [isOpen, project.id, channelId, getErrorMessage]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const db = getDb();
      await sendMessage(db, {
        projectId: project.id,
        channelId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        text: inputText.trim(),
        taskMention: selectedTaskMention,
      });

      setInputText('');
      setSelectedTaskMention(null);
      setShowTaskPicker(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={DRAWER_STYLES.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <div
        className={DRAWER_STYLES.container}
        data-testid="project-chat-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? 'غرفة محادثة واجتماعات المشروع' : 'Project Chat & Huddle'}
      >
        {/* Header */}
        <div className={DRAWER_STYLES.header}>
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-text m-0">
                {isAr ? 'غرفة محادثات المشروع' : 'Project Chat & Hub'}
              </h3>
              <span className="text-xs text-text-3 truncate max-w-[220px]">
                {project.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md hover:bg-surface-hover text-text-2 hover:text-text cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* Live Huddle Banner */}
        <div className={DRAWER_STYLES.huddleBanner}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isHuddleActive ? 'bg-emerald-500 animate-pulse' : 'bg-text-3'}`} />
            <span className="font-medium text-text">
              {isHuddleActive
                ? (isAr ? `المكالمة جارية (${huddleParticipantCount} متصل)` : `Call Active (${huddleParticipantCount} connected)`)
                : (isAr ? 'لا توجد مكالمة جارية حالياً' : 'No active call')}
            </span>
          </div>

          <button
            type="button"
            onClick={onJoinHuddle}
            data-testid="drawer-join-huddle-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-on-accent font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer min-h-[36px]"
          >
            <span>📞</span>
            <span>{isHuddleActive ? (isAr ? 'انضم للمكالمة' : 'Join Call') : (isAr ? 'بدء مكالمة' : 'Start Call')}</span>
          </button>
        </div>

        {/* Channel / DM Tab bar */}
        <div className={DRAWER_STYLES.tabBar}>
          <button
            type="button"
            data-testid="chat-tab-general"
            onClick={() => setActiveTab('general')}
            className={activeTab === 'general' ? DRAWER_STYLES.tabBtnActive : DRAWER_STYLES.tabBtnInactive}
          >
            <span>🌐 {isAr ? 'عامة المشروع' : 'General'}</span>
          </button>

          <button
            type="button"
            data-testid="chat-tab-dm"
            onClick={() => setActiveTab('dm')}
            className={activeTab === 'dm' ? DRAWER_STYLES.tabBtnActive : DRAWER_STYLES.tabBtnInactive}
          >
            <span>💬 {isAr ? 'محادثة خاصة (DM)' : 'Direct Messages'}</span>
          </button>
        </div>

        {/* DM Target Member Selector */}
        {activeTab === 'dm' && (
          <div className="p-3 bg-surface border-b border-line flex items-center gap-2" data-testid="dm-member-select">
            <span className="text-xs text-text-2 shrink-0">{isAr ? 'المحادثة مع:' : 'Chat with:'}</span>
            <Select
              value={effectiveDmTargetUid}
              onChange={(e) => setSelectedDmTargetUid(e.target.value)}
              className="w-full text-xs"
            >
              {availableMembers.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.name} ({m.role})
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 mx-4 mt-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            {error}
          </div>
        )}

        {/* Messages Stream */}
        <div className={DRAWER_STYLES.messagesContainer}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-text-3 gap-2">
              <span className="text-3xl">💬</span>
              <p className="text-xs">
                {isAr
                  ? 'لا توجد رسائل بعد. ابدأ النقاش أو نسّق مع فريقك!'
                  : 'No messages yet. Start the conversation with your team!'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-text-3">
                    <Avatar name={msg.senderName} size="sm" className="w-4 h-4 text-[9px]" />
                    <span className="font-semibold text-text">{msg.senderName}</span>
                    {msg.senderRole === 'owner' && (
                      <span className="text-[9px] uppercase font-bold text-accent bg-accent/15 px-1 rounded">
                        Owner
                      </span>
                    )}
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                      isMine
                        ? 'bg-accent text-on-accent rounded-ee-sm'
                        : 'bg-bg border border-line text-text rounded-es-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap m-0 break-words">{msg.text}</p>

                    {/* Task Mention Badge */}
                    {msg.taskMention && (
                      <div className="mt-2 pt-2 border-t border-line/40 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 font-medium truncate">
                          <span>📌</span>
                          <span className="truncate">{msg.taskMention.taskTitle}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface border border-line shrink-0">
                          {msg.taskMention.taskStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action row (Convert to Task) */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setConvertingMessage(msg)}
                      className="text-[10px] text-text-3 hover:text-accent transition-colors flex items-center gap-1 cursor-pointer"
                      title={isAr ? 'تحويل لمهمة' : 'Convert to Task'}
                    >
                      <span>⚡</span>
                      <span>{isAr ? 'تحويل لمهمة' : 'To Task'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Task Mention Pill Preview */}
        {selectedTaskMention && (
          <div className="px-3 py-1.5 bg-accent/10 border-t border-accent/20 flex items-center justify-between text-xs text-accent">
            <div className="flex items-center gap-1.5 truncate">
              <span>📌</span>
              <span className="truncate">{selectedTaskMention.taskTitle}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTaskMention(null)}
              className="text-text-3 hover:text-red-500 cursor-pointer p-0.5"
            >
              ×
            </button>
          </div>
        )}

        {/* Task Mention Picker Popover */}
        {showTaskPicker && tasks.length > 0 && (
          <div className="p-3 bg-bg border-t border-line max-h-36 overflow-y-auto flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-text-2">
              {isAr ? 'اختر مهمة للإشارة إليها:' : 'Select a task to mention:'}
            </span>
            {tasks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTaskMention(formatTaskMentionFromTask(t));
                  setShowTaskPicker(false);
                }}
                className="text-start px-2 py-1 text-xs rounded hover:bg-surface flex items-center justify-between text-text truncate cursor-pointer"
              >
                <span className="truncate">{t.title}</span>
                <span className="text-[10px] text-text-3 shrink-0 ms-2">{t.status}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className={DRAWER_STYLES.inputArea}>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowTaskPicker(!showTaskPicker)}
              className={DRAWER_STYLES.actionPill}
              title={isAr ? 'الإشارة لمهمة' : 'Mention Task'}
            >
              <span>#</span>
              <span>{isAr ? 'إشارة لمهمة' : 'Task'}</span>
            </button>
          </div>

          <div className={DRAWER_STYLES.inputRow}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message...'}
              className={DRAWER_STYLES.textInput}
            />

            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className={DRAWER_STYLES.sendBtn}
            >
              <span>{isAr ? 'إرسال' : 'Send'}</span>
              <Icon name="arrow" size={14} className="rtl:rotate-180" />
            </button>
          </div>
        </form>
      </div>

      {/* Convert Message to Task Modal */}
      {convertingMessage && (
        <MessageToTaskModal
          isOpen={Boolean(convertingMessage)}
          onClose={() => setConvertingMessage(null)}
          message={convertingMessage}
          project={project}
          currentUserId={currentUserId}
          onTaskCreated={() => {
            setConvertingMessage(null);
          }}
        />
      )}
    </>
  );
}
