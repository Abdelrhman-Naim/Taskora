'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { HuddleParticipant } from '@/types/chat';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';

// ============================================================================
// 2. CONFIGURATION & STYLES (EASY EDIT ZONE)
// ============================================================================
const HUDDLE_STYLES = {
  containerExpanded:
    'fixed inset-4 sm:inset-10 z-50 bg-surface/95 border border-line rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden animate-scale-in text-text',
  containerPip:
    'fixed bottom-5 inset-inline-end-5 z-50 bg-surface border border-accent/40 rounded-xl shadow-2xl p-3 flex items-center gap-3 animate-fade-in text-text min-w-[280px]',
  header: 'flex items-center justify-between px-6 py-4 border-b border-line bg-surface/80 shrink-0',
  stageArea: 'flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4',
  screenShareContainer:
    'w-full flex-1 min-h-[320px] max-h-[60vh] bg-black/90 rounded-xl border border-line flex items-center justify-center relative overflow-hidden',
  participantsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full auto-rows-fr',
  participantCard:
    'relative bg-bg/80 border rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 min-h-[180px] transition-all',
  activeSpeakerBorder: 'border-accent shadow-lg shadow-accent/30',
  normalBorder: 'border-line',
  controlsBar:
    'flex items-center justify-center gap-3 sm:gap-4 p-4 border-t border-line bg-surface/90 shrink-0',
  controlBtn:
    'w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md min-w-[44px] min-h-[44px]',
  controlBtnNormal: 'bg-bg border border-line text-text hover:bg-surface hover:border-accent',
  controlBtnActive: 'bg-accent text-on-accent hover:opacity-90',
  controlBtnDanger: 'bg-error text-white hover:opacity-90',
  controlBtnWarning: 'bg-amber-600 text-white hover:opacity-90',
};

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface ProjectHuddleDockProps {
  isOpen: boolean;
  projectName: string;
  currentUserId: string;
  participants: HuddleParticipant[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  localStream?: MediaStream | null;
  screenStream?: MediaStream | null;
  remoteStreams?: Record<string, MediaStream>;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
  onToggleChat?: () => void;
}

// ============================================================================
// 4. ERROR BOUNDARY
// ============================================================================
export class HuddleErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void; isAr?: boolean },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('ProjectHuddleDock error caught by HuddleErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const isAr = this.props.isAr ?? true;
      return (
        <div
          data-testid="huddle-error-fallback"
          className="fixed bottom-5 inset-inline-end-5 z-50 bg-surface border border-accent/40 rounded-xl shadow-2xl p-4 flex flex-col gap-2 max-w-sm text-text animate-fade-in"
        >
          <div className="flex items-center gap-2 text-accent font-semibold text-xs">
            <Icon name="alert" size={16} />
            <span>{isAr ? 'تنبيه اتصال المكالمة' : 'Call Connection Notice'}</span>
          </div>
          <p className="text-xs text-text-2">
            {isAr
              ? 'حدث استثناء أثناء تهيئة وسائط المكالمة. يمكنك إغلاق النافذة والمحاولة ثانية.'
              : 'An issue occurred initializing call media. You can close and retry.'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
            className="self-end px-3 py-1 bg-accent text-on-accent text-xs font-semibold rounded hover:opacity-90 transition-opacity cursor-pointer"
          >
            {isAr ? 'إغلاق المكالمة' : 'Close Call'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 5. SUB-COMPONENTS: AUDIO & VIDEO FEED
// ============================================================================

/**
 * Dedicated unmuted audio receiver for remote streams.
 * Guarantees incoming audio tracks from peer connections always play,
 * whether video is enabled or disabled, in full view or in PiP mode.
 */
function RemoteAudioPlayer({ stream }: { stream: MediaStream }): React.ReactElement {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !stream) return;

    try {
      audio.srcObject = stream;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('RemoteAudioPlayer auto-play prevented by browser policy:', err);
        });
      }
    } catch (err) {
      console.warn('RemoteAudioPlayer srcObject attachment notice:', err);
    }

    // Touch/click gesture unlock for mobile browsers (iOS Safari, Android Chrome)
    const unlockAudio = () => {
      if (audio && audio.paused && audio.srcObject) {
        audio.play().catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      if (audio) {
        try {
          audio.srcObject = null;
        } catch {}
      }
    };
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

interface VideoFeedProps {
  stream?: MediaStream | null;
  isMuted?: boolean;
  objectFit?: 'cover' | 'contain';
}

function VideoFeed({
  stream,
  isMuted = true,
  objectFit = 'cover',
}: VideoFeedProps): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    video.defaultMuted = isMuted;

    if (
      stream &&
      typeof window !== 'undefined' &&
      typeof stream === 'object' &&
      'getVideoTracks' in stream &&
      Array.isArray((stream as MediaStream).getVideoTracks()) &&
      (stream as MediaStream).getVideoTracks().length > 0
    ) {
      try {
        video.srcObject = stream;
        video.play().catch(() => {
          // Autoplay fallback
        });
      } catch (err) {
        console.warn('VideoFeed srcObject assignment notice:', err);
      }
    } else {
      video.srcObject = null;
    }

    const unlockVideo = () => {
      if (video && video.paused && video.srcObject) {
        video.play().catch(() => {});
      }
    };
    window.addEventListener('click', unlockVideo, { passive: true });
    window.addEventListener('touchstart', unlockVideo, { passive: true });

    return () => {
      window.removeEventListener('click', unlockVideo);
      window.removeEventListener('touchstart', unlockVideo);
      if (video) {
        try {
          video.srcObject = null;
        } catch {
          // ignore
        }
      }
    };
  }, [stream, isMuted]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className={`w-full h-full ${
        objectFit === 'contain' ? 'object-contain bg-black' : 'object-cover'
      }`}
    />
  );
}

// ============================================================================
// 6. INTERNAL DOCK CONTENT COMPONENT
// ============================================================================
function ProjectHuddleDockContent({
  isOpen,
  projectName,
  currentUserId,
  participants,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  localStream,
  screenStream,
  remoteStreams = {},
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
  onToggleChat,
}: ProjectHuddleDockProps): React.ReactElement | null {
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  const safeParticipants = useMemo(() => {
    if (!Array.isArray(participants)) return [];
    return participants.filter((p): p is HuddleParticipant => Boolean(p && typeof p === 'object' && p.uid));
  }, [participants]);

  const screenSharingParticipant = safeParticipants.find((p) => p.screenSharing || p.isScreenSharing);
  const isAnyScreenSharing = Boolean(screenSharingParticipant) || isScreenSharing;

  // Remote screen stream (if another participant is sharing)
  const remoteScreenStream = screenSharingParticipant ? remoteStreams[screenSharingParticipant.uid] : null;
  const hasRemoteScreenVideo = Boolean(
    remoteScreenStream &&
      typeof remoteScreenStream.getVideoTracks === 'function' &&
      remoteScreenStream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live')
  );

  // Ensure current user is always included in the participants list
  const effectiveParticipants = useMemo(() => {
    if (safeParticipants.some((p) => p.uid === currentUserId)) {
      return safeParticipants;
    }
    const selfParticipant: HuddleParticipant = {
      uid: currentUserId,
      displayName: isAr ? 'أنت' : 'You',
      role: 'Participant',
      audioEnabled: isAudioEnabled,
      videoEnabled: isVideoEnabled,
      screenSharing: isScreenSharing,
      isAudioEnabled,
      isVideoEnabled,
      isScreenSharing,
      joinedAt: new Date().toISOString(),
    };
    return [selfParticipant, ...safeParticipants];
  }, [safeParticipants, currentUserId, isAudioEnabled, isVideoEnabled, isScreenSharing, isAr]);

  // Audio receivers container (rendered off-screen unconditionally to guarantee audio playback on all mobile/desktop browsers)
  const remoteAudioElements = (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: -9999,
        left: -9999,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      {Object.entries(remoteStreams).map(([peerUid, rStream]) => (
        <RemoteAudioPlayer key={peerUid} stream={rStream} />
      ))}
    </div>
  );

  // Render PiP Bar
  if (isMinimized) {
    return (
      <>
        {remoteAudioElements}
        <div
          data-testid="huddle-pip-bar"
          className={HUDDLE_STYLES.containerPip}
          role="region"
          aria-label={isAr ? 'مكالمة الفريق المصغرة' : 'Minimized team huddle'}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-text truncate">{projectName}</span>
              <span className="text-[11px] text-text-2">
                {effectiveParticipants.length} {isAr ? 'أعضاء في المكالمة' : 'members in call'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="huddle-pip-mic-btn"
              onClick={onToggleAudio}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors min-h-[36px] min-w-[36px] ${
                isAudioEnabled ? 'bg-bg text-text hover:bg-surface' : 'bg-error/20 text-error'
              }`}
              aria-label={isAudioEnabled ? (isAr ? 'كتم الصوت' : 'Mute') : (isAr ? 'تشغيل الصوت' : 'Unmute')}
            >
              <Icon name={isAudioEnabled ? 'mic' : 'mic-off'} size={16} />
            </button>

            <button
              type="button"
              data-testid="huddle-restore-btn"
              onClick={() => setIsMinimized(false)}
              className="w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center hover:opacity-90 min-h-[36px] min-w-[36px]"
              aria-label={isAr ? 'تكبير المكالمة' : 'Expand call'}
            >
              <Icon name="maximize" size={16} />
            </button>

            <button
              type="button"
              onClick={onLeave}
              className="w-9 h-9 rounded-full bg-error text-white flex items-center justify-center hover:opacity-90 min-h-[36px] min-w-[36px]"
              aria-label={isAr ? 'مغادرة المكالمة' : 'Leave call'}
            >
              <Icon name="phone-off" size={16} />
            </button>
          </div>
        </div>
      </>
    );
  }

  // Render Full Dock
  return (
    <>
      {remoteAudioElements}
      <div
        data-testid="project-huddle-dock"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? 'غرفة مكالمة المشروع' : 'Project Huddle Room'}
      >
        <div data-testid="huddle-full-dock" className={HUDDLE_STYLES.containerExpanded}>
          {/* Header */}
          <div className={HUDDLE_STYLES.header}>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-accent/15 text-accent">
                <Icon name="video" size={20} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text">{projectName}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/20 text-accent">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent me-1.5 animate-pulse" />
                    {isAr ? 'مكالمة حية' : 'Live Huddle'}
                  </span>
                </div>
                <p className="text-xs text-text-2">
                  {effectiveParticipants.length} {isAr ? 'مشاركين حالياً' : 'participants active'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="huddle-minimize-btn"
                onClick={() => setIsMinimized(true)}
                className="p-2.5 rounded-lg text-text-2 hover:text-text hover:bg-bg border border-line min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
                aria-label={isAr ? 'تصغير إلى نافذة عائمة' : 'Minimize to PiP'}
                title={isAr ? 'تصغير لتصفح المشروع' : 'Minimize to browse project'}
              >
                <Icon name="minimize" size={18} />
              </button>
            </div>
          </div>

          {/* Stage Area */}
          <div className={HUDDLE_STYLES.stageArea}>
            {/* Prominent Screen Share View if active */}
            {isAnyScreenSharing && (
              <div data-testid="huddle-screen-share-view" className={HUDDLE_STYLES.screenShareContainer}>
                {isScreenSharing && (screenStream || localStream) ? (
                  <VideoFeed stream={screenStream || localStream} isMuted={true} objectFit="contain" />
                ) : hasRemoteScreenVideo && remoteScreenStream ? (
                  <VideoFeed stream={remoteScreenStream} isMuted={true} objectFit="contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 text-white/80">
                    <Icon name="monitor" size={48} className="text-accent mb-2 animate-bounce" />
                    <p className="text-sm font-semibold">
                      {screenSharingParticipant
                        ? isAr
                          ? `${
                              typeof screenSharingParticipant.displayName === 'string' &&
                              screenSharingParticipant.displayName.trim()
                                ? screenSharingParticipant.displayName
                                : 'مشارك'
                            } يشارك الشاشة حالياً`
                          : `${
                              typeof screenSharingParticipant.displayName === 'string' &&
                              screenSharingParticipant.displayName.trim()
                                ? screenSharingParticipant.displayName
                                : 'Participant'
                            } is sharing screen`
                        : isAr
                        ? 'جاري بث مشاركة الشاشة...'
                        : 'Streaming screen share...'}
                    </p>
                  </div>
                )}
                <div className="absolute top-3 inset-inline-start-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 text-xs text-white flex items-center gap-2">
                  <Icon name="monitor" size={14} className="text-accent" />
                  <span>{isAr ? 'مشاركة شاشة حية' : 'Live Screen Share'}</span>
                </div>
              </div>
            )}

            {/* Participants Grid */}
            <div className={HUDDLE_STYLES.participantsGrid}>
              {effectiveParticipants.map((participant) => {
                const isSelf = participant.uid === currentUserId;
                const participantStream = isSelf ? localStream : remoteStreams[participant.uid];

                // Detect active camera video track presence
                const hasLocalVideo = Boolean(
                  isSelf &&
                    isVideoEnabled &&
                    localStream &&
                    typeof localStream.getVideoTracks === 'function' &&
                    localStream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live')
                );
                const hasRemoteVideo = Boolean(
                  !isSelf &&
                    (participant.videoEnabled ||
                      (participantStream &&
                        typeof participantStream.getVideoTracks === 'function' &&
                        participantStream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live')))
                );
                const hasVideo = hasLocalVideo || hasRemoteVideo;

                const hasAudio = isSelf
                  ? isAudioEnabled
                  : Boolean(participant.audioEnabled ?? participant.isAudioEnabled);
                const isParticipantSharing = Boolean(
                  participant.screenSharing || participant.isScreenSharing
                );
                const safeDisplayName =
                  typeof participant.displayName === 'string' && participant.displayName.trim()
                    ? participant.displayName.trim()
                    : isSelf
                    ? isAr
                      ? 'أنت'
                      : 'You'
                    : isAr
                    ? 'مشارك'
                    : 'Participant';
                const safeRole =
                  typeof participant.role === 'string' && participant.role.trim()
                    ? participant.role.trim()
                    : Array.isArray(participant.role)
                    ? (participant.role as string[]).join(', ')
                    : '';

                return (
                  <div
                    key={participant.uid}
                    data-testid={`huddle-participant-tile-${participant.uid}`}
                    className={`${HUDDLE_STYLES.participantCard} ${
                      hasAudio ? HUDDLE_STYLES.activeSpeakerBorder : HUDDLE_STYLES.normalBorder
                    }`}
                  >
                    {hasVideo && participantStream ? (
                      <div className="absolute inset-0 w-full h-full">
                        <VideoFeed stream={participantStream} isMuted={true} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <Avatar
                          name={safeDisplayName}
                          size="md"
                          className="w-14 h-14 mb-3 border-2 border-accent/40 shadow-lg text-sm"
                        />
                        <span className="text-sm font-semibold text-text truncate max-w-[180px]">
                          {safeDisplayName} {isSelf && (isAr ? '(أنت)' : '(You)')}
                        </span>
                        {safeRole ? (
                          <span className="text-[11px] text-text-3 truncate max-w-[160px] mt-0.5">
                            {safeRole}
                          </span>
                        ) : null}
                      </div>
                    )}

                    {/* Status Overlay Badges */}
                    <div className="absolute bottom-2.5 inset-inline-start-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[11px] text-white">
                      <span className="truncate max-w-[120px] font-medium">{safeDisplayName}</span>
                      <Icon
                        name={hasAudio ? 'mic' : 'mic-off'}
                        size={13}
                        className={hasAudio ? 'text-accent' : 'text-error'}
                      />
                    </div>

                    {isParticipantSharing && (
                      <div className="absolute top-2.5 inset-inline-end-2.5 bg-accent text-on-accent px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                        <Icon name="monitor" size={11} />
                        <span>{isAr ? 'مشاركة' : 'Sharing'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Media Controls Bar */}
          <div className={HUDDLE_STYLES.controlsBar}>
            {/* Audio Toggle */}
            <button
              type="button"
              data-testid="huddle-mute-mic-btn"
              onClick={onToggleAudio}
              className={`${HUDDLE_STYLES.controlBtn} ${
                isAudioEnabled ? HUDDLE_STYLES.controlBtnNormal : HUDDLE_STYLES.controlBtnDanger
              }`}
              aria-label={
                isAudioEnabled
                  ? isAr
                    ? 'كتم الميكروفون'
                    : 'Mute mic'
                  : isAr
                  ? 'تشغيل الميكروفون'
                  : 'Unmute mic'
              }
              title={
                isAudioEnabled
                  ? isAr
                    ? 'كتم الميكروفون'
                    : 'Mute'
                  : isAr
                  ? 'تشغيل الميكروفون'
                  : 'Unmute'
              }
            >
              <Icon name={isAudioEnabled ? 'mic' : 'mic-off'} size={20} />
            </button>

            {/* Video Toggle */}
            <button
              type="button"
              data-testid="huddle-toggle-cam-btn"
              onClick={onToggleVideo}
              className={`${HUDDLE_STYLES.controlBtn} ${
                isVideoEnabled ? HUDDLE_STYLES.controlBtnActive : HUDDLE_STYLES.controlBtnNormal
              }`}
              aria-label={
                isVideoEnabled
                  ? isAr
                    ? 'إيقاف الكاميرا'
                    : 'Stop video'
                  : isAr
                  ? 'تشغيل الكاميرا'
                  : 'Start video'
              }
              title={
                isVideoEnabled
                  ? isAr
                    ? 'إيقاف الكاميرا'
                    : 'Stop video'
                  : isAr
                  ? 'تشغيل الكاميرا'
                  : 'Start video'
              }
            >
              <Icon name={isVideoEnabled ? 'video' : 'video-off'} size={20} />
            </button>

            {/* Screen Share Toggle */}
            <button
              type="button"
              data-testid="huddle-screen-share-btn"
              onClick={onToggleScreenShare}
              className={`${HUDDLE_STYLES.controlBtn} ${
                isScreenSharing ? HUDDLE_STYLES.controlBtnActive : HUDDLE_STYLES.controlBtnNormal
              }`}
              aria-label={
                isScreenSharing
                  ? isAr
                    ? 'إيقاف مشاركة الشاشة'
                    : 'Stop screen share'
                  : isAr
                  ? 'مشاركة الشاشة'
                  : 'Share screen'
              }
              title={
                isScreenSharing
                  ? isAr
                    ? 'إيقاف مشاركة الشاشة'
                    : 'Stop share'
                  : isAr
                  ? 'مشاركة الشاشة'
                  : 'Share screen'
              }
            >
              <Icon name="monitor" size={20} />
            </button>

            {/* Chat Drawer Toggle (Optional) */}
            {onToggleChat && (
              <button
                type="button"
                data-testid="huddle-toggle-chat-btn"
                onClick={onToggleChat}
                className={`${HUDDLE_STYLES.controlBtn} ${HUDDLE_STYLES.controlBtnNormal}`}
                aria-label={isAr ? 'فتح المحادثة' : 'Open chat'}
                title={isAr ? 'فتح المحادثة' : 'Open chat'}
              >
                <Icon name="message" size={20} />
              </button>
            )}

            {/* Leave Call */}
            <button
              type="button"
              data-testid="huddle-leave-btn"
              onClick={onLeave}
              className={`${HUDDLE_STYLES.controlBtn} ${HUDDLE_STYLES.controlBtnDanger}`}
              aria-label={isAr ? 'مغادرة المكالمة' : 'Leave call'}
              title={isAr ? 'مغادرة المكالمة' : 'Leave call'}
            >
              <Icon name="phone-off" size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// 7. MAIN EXPORTED COMPONENT (WRAPPED WITH ERROR BOUNDARY)
// ============================================================================
export function ProjectHuddleDock(props: ProjectHuddleDockProps): React.ReactElement | null {
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  if (!props.isOpen) return null;

  return (
    <HuddleErrorBoundary onReset={props.onLeave} isAr={isAr}>
      <ProjectHuddleDockContent {...props} />
    </HuddleErrorBoundary>
  );
}
