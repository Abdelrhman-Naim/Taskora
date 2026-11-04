'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { Firestore } from 'firebase/firestore';
import {
  updateMediaState,
} from '@/services/huddle';

// ============================================================================
// 2. CONFIGURATION & CONSTANTS (EASY EDIT ZONE)
// ============================================================================
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================
export interface UseWebRTCOptions {
  projectId?: string;
  myUid?: string;
  db?: Firestore | null;
  onRemoteStream?: (uid: string, stream: MediaStream) => void;
  onRemoteLeave?: (uid: string) => void;
}

export interface UseWebRTCResult {
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  mediaError: string | null;
  startMedia: (options?: { audio?: boolean; video?: boolean }) => Promise<MediaStream | null>;
  stopMedia: () => void;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
}

// ============================================================================
// 4. MAIN HOOK
// ============================================================================
export function useWebRTC(options: UseWebRTCOptions = {}): UseWebRTCResult {
  const {
    projectId = '',
    myUid = '',
    db,
  } = options;
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});

  // Clean all tracks helper
  const stopTracks = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    try {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    } catch {
      // ignore
    }
  }, []);

  /**
   * Starts local user media (Mic and optional Camera)
   */
  const startMedia = useCallback(
    async (options: { audio?: boolean; video?: boolean } = { audio: true, video: false }) => {
      setMediaError(null);
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setMediaError('Audio/Video media is not supported in this browser.');
        return null;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: options.audio !== false,
          video: Boolean(options.video),
        });

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsAudioEnabled(options.audio !== false);
        setIsVideoEnabled(Boolean(options.video));
        return stream;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Permission denied to camera/microphone';
        setMediaError(msg);
        return null;
      }
    },
    []
  );

  /**
   * Completely stops all local media streams & peer connections
   */
  const stopMedia = useCallback(() => {
    stopTracks(localStreamRef.current);
    stopTracks(screenStreamRef.current);
    localStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    setIsScreenSharing(false);
    setIsVideoEnabled(false);

    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch {
        // ignore
      }
    });
    peerConnectionsRef.current = {};
    setRemoteStreams({});
  }, [stopTracks]);

  /**
   * Toggles audio track enabled state
   */
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const tracks = localStreamRef.current.getAudioTracks();
    if (tracks.length === 0) return;

    const nextState = !tracks[0].enabled;
    tracks.forEach((t) => {
      t.enabled = nextState;
    });
    setIsAudioEnabled(nextState);

    if (db && projectId && myUid) {
      updateMediaState(db, projectId, myUid, { audioEnabled: nextState }).catch(() => {});
    }
  }, [db, projectId, myUid]);

  /**
   * Toggles video track enabled state or requests video track
   */
  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) {
      await startMedia({ audio: isAudioEnabled, video: true });
      return;
    }

    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const nextState = !videoTracks[0].enabled;
      videoTracks.forEach((t) => {
        t.enabled = nextState;
      });
      setIsVideoEnabled(nextState);

      if (db && projectId && myUid) {
        updateMediaState(db, projectId, myUid, { videoEnabled: nextState }).catch(() => {});
      }
    } else {
      // Add video track if not already present
      try {
        const streamWithVideo = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = streamWithVideo.getVideoTracks()[0];
        localStreamRef.current.addTrack(newTrack);
        setIsVideoEnabled(true);

        if (db && projectId && myUid) {
          updateMediaState(db, projectId, myUid, { videoEnabled: true }).catch(() => {});
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Cannot access camera';
        setMediaError(msg);
      }
    }
  }, [db, projectId, myUid, isAudioEnabled, startMedia]);

  /**
   * Toggles screen sharing
   */
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopTracks(screenStreamRef.current);
      screenStreamRef.current = null;
      setIsScreenSharing(false);

      if (db && projectId && myUid) {
        updateMediaState(db, projectId, myUid, { screenSharing: false }).catch(() => {});
      }
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      setMediaError('Screen sharing is not supported on this device.');
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      const screenTrack = screenStream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.addEventListener('ended', () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          if (db && projectId && myUid) {
            updateMediaState(db, projectId, myUid, { screenSharing: false }).catch(() => {});
          }
        });
      }

      if (db && projectId && myUid) {
        updateMediaState(db, projectId, myUid, { screenSharing: true }).catch(() => {});
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Screen sharing cancelled or failed';
      setMediaError(msg);
    }
  }, [db, projectId, myUid, isScreenSharing, stopTracks]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  return {
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    mediaError,
    startMedia,
    stopMedia,
    endCall: stopMedia,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  };
}
