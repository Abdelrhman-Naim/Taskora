import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ProjectHuddleDock } from '@/components/chat/ProjectHuddleDock';
import { HuddleParticipant } from '@/types/chat';
import { renderWithProviders } from '../helpers/render';

describe('ProjectHuddleDock Component', () => {
  const mockParticipants: HuddleParticipant[] = [
    {
      uid: 'user-1',
      displayName: 'Alice Owner',
      role: 'Project Manager',
      joinedAt: '2026-11-04T12:00:00Z',
      audioEnabled: true,
      videoEnabled: false,
      screenSharing: false,
      isAudioEnabled: true,
      isVideoEnabled: false,
      isScreenSharing: false,
    },
    {
      uid: 'user-2',
      displayName: 'Bob Designer',
      role: 'UI/UX Designer',
      joinedAt: '2026-11-04T12:01:00Z',
      audioEnabled: false,
      videoEnabled: true,
      screenSharing: false,
      isAudioEnabled: false,
      isVideoEnabled: true,
      isScreenSharing: false,
    },
  ];

  it('renders expanded huddle dock with participants and media controls', () => {
    renderWithProviders(
      <ProjectHuddleDock
        isOpen={true}
        projectName="E-Commerce Platform"
        currentUserId="user-1"
        participants={mockParticipants}
        isAudioEnabled={true}
        isVideoEnabled={false}
        isScreenSharing={false}
        onToggleAudio={vi.fn()}
        onToggleVideo={vi.fn()}
        onToggleScreenShare={vi.fn()}
        onLeave={vi.fn()}
      />
    );

    expect(screen.getByTestId('project-huddle-dock')).toBeInTheDocument();
    expect(screen.getAllByText('Alice Owner').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob Designer').length).toBeGreaterThan(0);
    expect(screen.getByTestId('huddle-mute-mic-btn')).toBeInTheDocument();
    expect(screen.getByTestId('huddle-toggle-cam-btn')).toBeInTheDocument();
    expect(screen.getByTestId('huddle-screen-share-btn')).toBeInTheDocument();
    expect(screen.getByTestId('huddle-leave-btn')).toBeInTheDocument();
  });

  it('handles media control toggle callbacks', () => {
    const handleToggleAudio = vi.fn();
    const handleToggleVideo = vi.fn();
    const handleToggleScreenShare = vi.fn();
    const handleLeave = vi.fn();

    renderWithProviders(
      <ProjectHuddleDock
        isOpen={true}
        projectName="E-Commerce Platform"
        currentUserId="user-1"
        participants={mockParticipants}
        isAudioEnabled={true}
        isVideoEnabled={false}
        isScreenSharing={false}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onLeave={handleLeave}
      />
    );

    fireEvent.click(screen.getByTestId('huddle-mute-mic-btn'));
    expect(handleToggleAudio).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByTestId('huddle-toggle-cam-btn'));
    expect(handleToggleVideo).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByTestId('huddle-screen-share-btn'));
    expect(handleToggleScreenShare).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByTestId('huddle-leave-btn'));
    expect(handleLeave).toHaveBeenCalledOnce();
  });

  it('can minimize to compact PiP dock and restore to full view', () => {
    renderWithProviders(
      <ProjectHuddleDock
        isOpen={true}
        projectName="E-Commerce Platform"
        currentUserId="user-1"
        participants={mockParticipants}
        isAudioEnabled={true}
        isVideoEnabled={false}
        isScreenSharing={false}
        onToggleAudio={vi.fn()}
        onToggleVideo={vi.fn()}
        onToggleScreenShare={vi.fn()}
        onLeave={vi.fn()}
      />
    );

    const minimizeBtn = screen.getByTestId('huddle-minimize-btn');
    fireEvent.click(minimizeBtn);

    // In minimized state, the compact bar is shown
    expect(screen.getByTestId('huddle-pip-bar')).toBeInTheDocument();

    // Clicking restore expands it back
    const restoreBtn = screen.getByTestId('huddle-restore-btn');
    fireEvent.click(restoreBtn);

    expect(screen.getByTestId('huddle-full-dock')).toBeInTheDocument();
  });

  it('displays screen share prominent view when screen sharing is active', () => {
    const participantsWithScreenShare: HuddleParticipant[] = [
      {
        ...mockParticipants[0],
        screenSharing: true,
        isScreenSharing: true,
      },
      mockParticipants[1],
    ];

    renderWithProviders(
      <ProjectHuddleDock
        isOpen={true}
        projectName="E-Commerce Platform"
        currentUserId="user-1"
        participants={participantsWithScreenShare}
        isAudioEnabled={true}
        isVideoEnabled={false}
        isScreenSharing={true}
        onToggleAudio={vi.fn()}
        onToggleVideo={vi.fn()}
        onToggleScreenShare={vi.fn()}
        onLeave={vi.fn()}
      />
    );

    expect(screen.getByTestId('huddle-screen-share-view')).toBeInTheDocument();
  });
});
