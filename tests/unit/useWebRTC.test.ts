import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebRTC } from '@/hooks/useWebRTC';

describe('useWebRTC Hook', () => {
  let mockAudioTrack: any;
  let mockVideoTrack: any;
  let mockScreenTrack: any;
  let mockLocalStream: any;
  let mockScreenStream: any;

  beforeEach(() => {
    mockAudioTrack = {
      kind: 'audio',
      enabled: true,
      stop: vi.fn(),
    };
    mockVideoTrack = {
      kind: 'video',
      enabled: true,
      stop: vi.fn(),
    };
    mockScreenTrack = {
      kind: 'video',
      enabled: true,
      stop: vi.fn(),
      addEventListener: vi.fn(),
    };

    mockLocalStream = {
      getTracks: vi.fn().mockReturnValue([mockAudioTrack, mockVideoTrack]),
      getAudioTracks: vi.fn().mockReturnValue([mockAudioTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockVideoTrack]),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
    };

    mockScreenStream = {
      getTracks: vi.fn().mockReturnValue([mockScreenTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockScreenTrack]),
    };

    // Mock navigator.mediaDevices
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockLocalStream),
        getDisplayMedia: vi.fn().mockResolvedValue(mockScreenStream),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default media state', () => {
    const { result } = renderHook(() =>
      useWebRTC({
        projectId: 'proj-1',
        myUid: 'user-1',
        db: {} as any,
      })
    );

    expect(result.current.isAudioEnabled).toBe(true);
    expect(result.current.isVideoEnabled).toBe(false);
    expect(result.current.isScreenSharing).toBe(false);
    expect(result.current.localStream).toBeNull();
    expect(result.current.mediaError).toBeNull();
  });

  it('starts media stream with user permissions', async () => {
    const { result } = renderHook(() =>
      useWebRTC({
        projectId: 'proj-1',
        myUid: 'user-1',
        db: {} as any,
      })
    );

    await act(async () => {
      await result.current.startMedia({ audio: true, video: true });
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true,
      video: true,
    });
    expect(result.current.localStream).toBe(mockLocalStream);
    expect(result.current.isAudioEnabled).toBe(true);
    expect(result.current.isVideoEnabled).toBe(true);
  });

  it('toggles audio track mute state', async () => {
    const { result } = renderHook(() =>
      useWebRTC({
        projectId: 'proj-1',
        myUid: 'user-1',
        db: {} as any,
      })
    );

    await act(async () => {
      await result.current.startMedia({ audio: true, video: false });
    });

    act(() => {
      result.current.toggleAudio();
    });

    expect(mockAudioTrack.enabled).toBe(false);
    expect(result.current.isAudioEnabled).toBe(false);

    act(() => {
      result.current.toggleAudio();
    });

    expect(mockAudioTrack.enabled).toBe(true);
    expect(result.current.isAudioEnabled).toBe(true);
  });

  it('toggles screen sharing stream and handles graceful stop', async () => {
    const { result } = renderHook(() =>
      useWebRTC({
        projectId: 'proj-1',
        myUid: 'user-1',
        db: {} as any,
      })
    );

    await act(async () => {
      await result.current.startMedia({ audio: true, video: false });
    });

    await act(async () => {
      await result.current.toggleScreenShare();
    });

    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
      video: true,
    });
    expect(result.current.isScreenSharing).toBe(true);

    await act(async () => {
      await result.current.toggleScreenShare();
    });

    expect(result.current.isScreenSharing).toBe(false);
  });

  it('handles permission denied gracefully without crashing', async () => {
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
        getDisplayMedia: vi.fn(),
      },
    });

    const { result } = renderHook(() =>
      useWebRTC({
        projectId: 'proj-1',
        myUid: 'user-1',
        db: {} as any,
      })
    );

    await act(async () => {
      await result.current.startMedia({ audio: true, video: true });
    });

    expect(result.current.localStream).toBeNull();
    expect(result.current.mediaError).toContain('Permission denied');
  });
});
