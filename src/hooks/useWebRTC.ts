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
// 2. CONFIGURATION & CONSTANTS
// ============================================================================
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:openrelay.metered.ca:80' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
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
  const remoteStreamsRef = useRef<Record<string, MediaStream>>({});
  const iceCandidateQueuesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const isMakingOfferRef = useRef<Record<string, boolean>>({});

  // Helper to stop all tracks in a media stream safely
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

  /**
   * Synchronizes active local tracks (Audio, Video, Screen) to all open peer connections.
   * If a sender already exists, it hot-swaps the track via replaceTrack (zero interruption).
   */
  const syncTracksToPeers = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // Active audio track from microphone
    const audioTrack = localStreamRef.current?.getAudioTracks()[0] || null;

    // Active video track: Screen share takes precedence, otherwise camera if enabled
    const videoTrack =
      screenStreamRef.current?.getVideoTracks()[0] ||
      (localStreamRef.current?.getVideoTracks().find((t) => t.enabled) || null);

    const videoStream = screenStreamRef.current || localStreamRef.current;

    for (const [remoteUid, pc] of Object.entries(peerConnectionsRef.current)) {
      try {
        const senders = pc.getSenders();

        // 1. Audio Sender Management
        const audioSender = senders.find((s) => s.track && s.track.kind === 'audio');
        if (audioSender) {
          if (audioTrack && audioSender.track !== audioTrack) {
            await audioSender.replaceTrack(audioTrack).catch(() => {});
          }
        } else if (audioTrack && localStreamRef.current) {
          try {
            pc.addTrack(audioTrack, localStreamRef.current);
          } catch {
            // ignore if already added
          }
        }

        // 2. Video Sender Management (Hot-swap Camera / Screen Share)
        const videoSender = senders.find(
          (s) => (s.track && s.track.kind === 'video') || (!s.track && (s as any).transport)
        );
        if (videoSender) {
          if (videoTrack) {
            await videoSender.replaceTrack(videoTrack).catch(() => {});
          } else {
            await videoSender.replaceTrack(null).catch(() => {});
          }
        } else if (videoTrack && videoStream) {
          try {
            pc.addTrack(videoTrack, videoStream);
          } catch {
            // ignore if already added
          }
        }
      } catch (err) {
        console.warn('syncTracksToPeers notice for remote peer:', remoteUid, err);
      }
    }
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

      // Pre-populate with all active local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          try {
            pc.addTrack(track, localStreamRef.current!);
          } catch {}
        });
        if (!screenStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach((track) => {
            try {
              pc.addTrack(track, localStreamRef.current!);
            } catch {}
          });
        }
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getVideoTracks().forEach((track) => {
          try {
            pc.addTrack(track, screenStreamRef.current!);
          } catch {}
        });
      }

      // Ensure video transceiver is pre-negotiated so video/screen can be sent/received anytime without renegotiation glare
      const hasVideoTrack =
        (screenStreamRef.current && screenStreamRef.current.getVideoTracks().length > 0) ||
        (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0);
      if (!hasVideoTrack && typeof pc.addTransceiver === 'function') {
        try {
          pc.addTransceiver('video', { direction: 'sendrecv' });
        } catch {}
      }

      // Handle remote incoming tracks (Audio & Video)
      pc.ontrack = (event) => {
        const { track } = event;
        let composite = remoteStreamsRef.current[remoteUid];
        if (!composite || typeof composite.getTracks !== 'function') {
          composite = typeof MediaStream !== 'undefined' ? new MediaStream() : ({} as any);
        }

        if (typeof composite.getTracks === 'function') {
          const currentTracks = composite.getTracks();
          if (!currentTracks.some((t) => t.id === track.id)) {
            // Hot-swap existing track of the same kind (e.g. camera to screen share or vice versa)
            const oldOfKind = currentTracks.filter((t) => t.kind === track.kind);
            oldOfKind.forEach((old) => {
              if (old.id !== track.id) {
                try {
                  composite.removeTrack(old);
                } catch {}
              }
            });
            try {
              composite.addTrack(track);
            } catch {}
          }

          track.onended = () => {
            try {
              composite.removeTrack(track);
              const updated =
                typeof MediaStream !== 'undefined'
                  ? new MediaStream(composite.getTracks())
                  : composite;
              remoteStreamsRef.current[remoteUid] = updated;
              setRemoteStreams((prev) => ({
                ...prev,
                [remoteUid]: updated,
              }));
            } catch {}
          };
        }

        const fresh =
          typeof MediaStream !== 'undefined' && typeof composite.getTracks === 'function'
            ? new MediaStream(composite.getTracks())
            : composite;

        remoteStreamsRef.current[remoteUid] = fresh;
        setRemoteStreams((prev) => ({
          ...prev,
          [remoteUid]: fresh,
        }));
        onRemoteStream?.(remoteUid, fresh);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && db && projectId && myUid) {
          const candidateData = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
          sendWebRTCSignal(db, projectId, {
            fromUid: myUid,
            toUid: remoteUid,
            type: 'ice-candidate',
            payload: JSON.stringify(candidateData),
            timestamp: new Date().toISOString(),
          }).catch(() => {});
        }
      };

      // Perfect Negotiation: browser fires onnegotiationneeded when tracks change
      pc.onnegotiationneeded = async () => {
        try {
          if (pc.signalingState !== 'stable') return;
          isMakingOfferRef.current[remoteUid] = true;
          const offer = await pc.createOffer();
          if (pc.signalingState !== 'stable') return;
          await pc.setLocalDescription(offer);
          if (db && projectId && myUid) {
            await sendWebRTCSignal(db, projectId, {
              fromUid: myUid,
              toUid: remoteUid,
              type: 'offer',
              payload: JSON.stringify(offer),
              timestamp: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn('onnegotiationneeded error:', err);
        } finally {
          isMakingOfferRef.current[remoteUid] = false;
        }
      };

      // Handle connection failure / disconnection
      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[remoteUid];
            return next;
          });
          delete remoteStreamsRef.current[remoteUid];
          delete iceCandidateQueuesRef.current[remoteUid];
          delete isMakingOfferRef.current[remoteUid];
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
   * Starts local user media (Microphone and optional Camera)
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

        await syncTracksToPeers();
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
    remoteStreamsRef.current = {};
    iceCandidateQueuesRef.current = {};
    isMakingOfferRef.current = {};
    setRemoteStreams({});
  }, [stopTracks]);

  /**
   * Toggles audio track mute state or starts audio if not yet active
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
        const updated =
          typeof MediaStream !== 'undefined'
            ? new MediaStream(localStreamRef.current.getTracks())
            : localStreamRef.current;
        localStreamRef.current = updated;
        setLocalStream(updated);
        setIsAudioEnabled(true);
        await syncTracksToPeers();
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
   * Toggles camera track state or requests camera track with fresh MediaStream instance
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

      const updated =
        typeof MediaStream !== 'undefined'
          ? new MediaStream(localStreamRef.current.getTracks())
          : localStreamRef.current;
      localStreamRef.current = updated;
      setLocalStream(updated);
      await syncTracksToPeers();

      if (db && projectId && myUid) {
        updateMediaState(db, projectId, myUid, { videoEnabled: nextState }).catch(() => {});
      }
    } else {
      // Add camera track if not already present in local stream
      try {
        const streamWithVideo = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = streamWithVideo.getVideoTracks()[0];
        localStreamRef.current.addTrack(newTrack);

        const updated =
          typeof MediaStream !== 'undefined'
            ? new MediaStream(localStreamRef.current.getTracks())
            : localStreamRef.current;
        localStreamRef.current = updated;
        setLocalStream(updated);
        setIsVideoEnabled(true);
        await syncTracksToPeers();

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
      await syncTracksToPeers();

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
      await syncTracksToPeers();

      const screenTrack = displayStream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.addEventListener('ended', async () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          screenStreamRef.current = null;
          await syncTracksToPeers();
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

  // Real-time WebRTC Signaling Listener with Perfect Negotiation
  useEffect(() => {
    if (!db || !projectId || !myUid) return;

    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeToSignals(db, projectId, myUid, async (signal: WebRTCSignalData) => {
        try {
          const remoteUid = signal.fromUid;
          const pc = getOrCreatePeerConnection(remoteUid);
          if (!pc) return;

          const isPolite = myUid > remoteUid;

          if (signal.type === 'offer') {
            if (typeof RTCSessionDescription !== 'undefined') {
              const offerDesc = new RTCSessionDescription(JSON.parse(signal.payload));
              const offerCollision =
                isMakingOfferRef.current[remoteUid] || pc.signalingState !== 'stable';

              if (offerCollision) {
                if (!isPolite) {
                  // Impolite peer ignores colliding offer
                  return;
                }
                // Polite peer rolls back local offer ONLY if currently in have-local-offer state
                if (pc.signalingState === 'have-local-offer') {
                  try {
                    await pc.setLocalDescription({ type: 'rollback' });
                  } catch (rbErr) {
                    console.warn('Rollback notice:', rbErr);
                  }
                } else {
                  return;
                }
              }

              await pc.setRemoteDescription(offerDesc);

              // Drain any queued ICE candidates that arrived before the offer
              const queued = iceCandidateQueuesRef.current[remoteUid] || [];
              while (queued.length > 0) {
                const cand = queued.shift();
                if (cand && typeof RTCIceCandidate !== 'undefined') {
                  await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                }
              }

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

              // Drain queued ICE candidates
              const queued = iceCandidateQueuesRef.current[remoteUid] || [];
              while (queued.length > 0) {
                const cand = queued.shift();
                if (cand && typeof RTCIceCandidate !== 'undefined') {
                  await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
                }
              }
            }
          } else if (signal.type === 'ice-candidate') {
            if (typeof RTCIceCandidate !== 'undefined') {
              const candidateInit: RTCIceCandidateInit = JSON.parse(signal.payload);
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch(() => {});
              } else {
                if (!iceCandidateQueuesRef.current[remoteUid]) {
                  iceCandidateQueuesRef.current[remoteUid] = [];
                }
                iceCandidateQueuesRef.current[remoteUid].push(candidateInit);
              }
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

  // Polite Initiator: Connect to peers who join once local media is ready
  useEffect(() => {
    if (!participants || participants.length === 0 || !myUid || !db || !projectId) return;
    // Ensure local stream is initialized before making the initial offer
    if (!localStreamRef.current) return;

    participants.forEach(async (p) => {
      if (p.uid === myUid) return;
      if (myUid < p.uid) {
        const pc = getOrCreatePeerConnection(p.uid);
        if (!pc) return;

        if (pc.signalingState === 'stable' && !isMakingOfferRef.current[p.uid]) {
          isMakingOfferRef.current[p.uid] = true;
          try {
            const offer = await pc.createOffer();
            if (pc.signalingState !== 'stable') return;
            await pc.setLocalDescription(offer);
            await sendWebRTCSignal(db, projectId, {
              fromUid: myUid,
              toUid: p.uid,
              type: 'offer',
              payload: JSON.stringify(offer),
              timestamp: new Date().toISOString(),
            });
          } catch (offerErr) {
            console.warn('Could not initiate WebRTC offer notice:', offerErr);
          } finally {
            isMakingOfferRef.current[p.uid] = false;
          }
        }
      }
    });
  }, [participants, myUid, db, projectId, localStream, getOrCreatePeerConnection]);

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
