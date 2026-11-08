'use client';

// ============================================================================
// 1. IMPORTS
// ============================================================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { Firestore } from 'firebase/firestore';
import {
  updateMediaState,
  sendWebRTCSignal,
  subscribeToSignals,
} from '@/services/huddle';
import { WebRTCSignalData, HuddleParticipant } from '@/types/chat';

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
  participants?: HuddleParticipant[];
  onRemoteStream?: (uid: string, stream: MediaStream) => void;
  onRemoteLeave?: (uid: string) => void;
}

export interface UseWebRTCResult {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  mediaError: string | null;
  startMedia: (options?: { audio?: boolean; video?: boolean }) => Promise<MediaStream | null>;
  stopMedia: () => void;
  endCall: () => void;
  toggleAudio: () => Promise<void>;
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
    participants = [],
    onRemoteStream,
    onRemoteLeave,
  } = options;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
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
      if (typeof stream.getTracks === 'function') {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // ignore
          }
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Update tracks across all active peer connections
  const syncTracksToPeers = useCallback(() => {
    if (typeof window === 'undefined') return;
    const activeStream = screenStreamRef.current || localStreamRef.current;
    if (!activeStream) return;

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      try {
        const senders = pc.getSenders();
        activeStream.getTracks().forEach((track) => {
          const matchingSender = senders.find((s) => s.track && s.track.kind === track.kind);
          if (matchingSender) {
            matchingSender.replaceTrack(track).catch(() => {});
          } else {
            pc.addTrack(track, activeStream);
          }
        });
      } catch {
        // ignore
      }
    });
  }, []);

  /**
   * Creates or retrieves an existing RTCPeerConnection for a remote peer
   */
  const getOrCreatePeerConnection = useCallback((remoteUid: string): RTCPeerConnection | null => {
    if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') return null;
    if (peerConnectionsRef.current[remoteUid]) {
      return peerConnectionsRef.current[remoteUid];
    }

    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      // Add local tracks if available
      const activeStream = screenStreamRef.current || localStreamRef.current;
      if (activeStream && typeof activeStream.getTracks === 'function') {
        activeStream.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, activeStream);
          } catch {
            // ignore
          }
        });
      }

      // Handle remote incoming tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          setRemoteStreams((prev) => ({
            ...prev,
            [remoteUid]: stream,
          }));
          onRemoteStream?.(remoteUid, stream);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && db && projectId && myUid) {
          sendWebRTCSignal(db, projectId, {
            fromUid: myUid,
            toUid: remoteUid,
            type: 'ice-candidate',
            payload: JSON.stringify(event.candidate),
            timestamp: new Date().toISOString(),
          }).catch(() => {});
        }
      };

      // Handle connection failure / disconnection
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[remoteUid];
            return next;
          });
          onRemoteLeave?.(remoteUid);
        }
      };

      peerConnectionsRef.current[remoteUid] = pc;
      return pc;
    } catch (err) {
      console.warn('Failed to construct RTCPeerConnection:', err);
      return null;
    }
  }, [db, projectId, myUid, onRemoteStream, onRemoteLeave]);

  /**
   * Starts local user media (Mic and optional Camera)
   */
  const startMedia = useCallback(
    async (opts: { audio?: boolean; video?: boolean } = { audio: true, video: false }) => {
      setMediaError(null);
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setMediaError('Audio/Video media is not supported in this browser.');
        return null;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: opts.audio !== false,
          video: Boolean(opts.video),
        });

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsAudioEnabled(opts.audio !== false);
        setIsVideoEnabled(Boolean(opts.video));

        syncTracksToPeers();
        return stream;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Permission denied to camera/microphone';
        setMediaError(msg);
        return null;
      }
    },
    [syncTracksToPeers]
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
    setScreenStream(null);
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
   * Toggles audio track enabled state or requests audio if stream not yet active
   */
  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) {
      await startMedia({ audio: true, video: isVideoEnabled });
      return;
    }
    const tracks = localStreamRef.current.getAudioTracks();
    if (tracks.length === 0) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = audioStream.getAudioTracks()[0];
        localStreamRef.current.addTrack(newTrack);
        const updated = typeof MediaStream !== 'undefined'
          ? new MediaStream(localStreamRef.current.getTracks())
          : localStreamRef.current;
        localStreamRef.current = updated;
        setLocalStream(updated);
        setIsAudioEnabled(true);
        syncTracksToPeers();
        if (db && projectId && myUid) {
          updateMediaState(db, projectId, myUid, { audioEnabled: true }).catch(() => {});
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Cannot access microphone';
        setMediaError(msg);
      }
      return;
    }

    const nextState = !tracks[0].enabled;
    tracks.forEach((t) => {
      t.enabled = nextState;
    });
    setIsAudioEnabled(nextState);

    if (db && projectId && myUid) {
      updateMediaState(db, projectId, myUid, { audioEnabled: nextState }).catch(() => {});
    }
  }, [db, projectId, myUid, isVideoEnabled, startMedia, syncTracksToPeers]);

  /**
   * Toggles video track enabled state or requests camera track with fresh MediaStream instance
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

      const updated = typeof MediaStream !== 'undefined'
        ? new MediaStream(localStreamRef.current.getTracks())
        : localStreamRef.current;
      localStreamRef.current = updated;
      setLocalStream(updated);
      syncTracksToPeers();

      if (db && projectId && myUid) {
        updateMediaState(db, projectId, myUid, { videoEnabled: nextState }).catch(() => {});
      }
    } else {
      // Add video track if not already present
      try {
        const streamWithVideo = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = streamWithVideo.getVideoTracks()[0];
        localStreamRef.current.addTrack(newTrack);

        const updated = typeof MediaStream !== 'undefined'
          ? new MediaStream(localStreamRef.current.getTracks())
          : localStreamRef.current;
        localStreamRef.current = updated;
        setLocalStream(updated);
        setIsVideoEnabled(true);
        syncTracksToPeers();

        if (db && projectId && myUid) {
          updateMediaState(db, projectId, myUid, { videoEnabled: true }).catch(() => {});
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Cannot access camera';
        setMediaError(msg);
      }
    }
  }, [db, projectId, myUid, isAudioEnabled, startMedia, syncTracksToPeers]);

  /**
   * Toggles screen sharing
   */
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopTracks(screenStreamRef.current);
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
      syncTracksToPeers();

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
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = displayStream;
      setScreenStream(displayStream);
      setIsScreenSharing(true);
      syncTracksToPeers();

      const screenTrack = displayStream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.addEventListener('ended', () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          screenStreamRef.current = null;
          syncTracksToPeers();
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
  }, [db, projectId, myUid, isScreenSharing, stopTracks, syncTracksToPeers]);

  // Real-time WebRTC Signaling Listener
  useEffect(() => {
    if (!db || !projectId || !myUid) return;

    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeToSignals(db, projectId, myUid, async (signal: WebRTCSignalData) => {
        try {
          const remoteUid = signal.fromUid;
          const pc = getOrCreatePeerConnection(remoteUid);
          if (!pc) return;

          if (signal.type === 'offer') {
            if (typeof RTCSessionDescription !== 'undefined') {
              const offerDesc = new RTCSessionDescription(JSON.parse(signal.payload));
              await pc.setRemoteDescription(offerDesc);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await sendWebRTCSignal(db, projectId, {
                fromUid: myUid,
                toUid: remoteUid,
                type: 'answer',
                payload: JSON.stringify(answer),
                timestamp: new Date().toISOString(),
              });
            }
          } else if (signal.type === 'answer') {
            if (typeof RTCSessionDescription !== 'undefined' && pc.signalingState !== 'stable') {
              const answerDesc = new RTCSessionDescription(JSON.parse(signal.payload));
              await pc.setRemoteDescription(answerDesc);
            }
          } else if (signal.type === 'ice-candidate') {
            if (typeof RTCIceCandidate !== 'undefined' && pc.remoteDescription) {
              const candidate = new RTCIceCandidate(JSON.parse(signal.payload));
              await pc.addIceCandidate(candidate);
            }
          }
        } catch (signalErr) {
          console.warn('Error handling WebRTC signal notice:', signalErr);
        }
      });
    } catch (subErr) {
      console.warn('Could not subscribe to WebRTC signals:', subErr);
    }

    return () => {
      unsub?.();
    };
  }, [db, projectId, myUid, getOrCreatePeerConnection]);

  // Polite Initiator: Connect to peers who join
  useEffect(() => {
    if (!participants || participants.length === 0 || !myUid || !db || !projectId) return;

    participants.forEach(async (p) => {
      if (p.uid === myUid) return;
      if (myUid < p.uid && !peerConnectionsRef.current[p.uid]) {
        try {
          const pc = getOrCreatePeerConnection(p.uid);
          if (pc && typeof pc.createOffer === 'function') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await sendWebRTCSignal(db, projectId, {
              fromUid: myUid,
              toUid: p.uid,
              type: 'offer',
              payload: JSON.stringify(offer),
              timestamp: new Date().toISOString(),
            });
          }
        } catch (offerErr) {
          console.warn('Could not initiate WebRTC offer notice:', offerErr);
        }
      }
    });
  }, [participants, myUid, db, projectId, getOrCreatePeerConnection]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  return {
    localStream,
    screenStream,
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
