import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TeamMembersCard } from '@/components/dashboard/TeamMembersCard';
import { Project } from '@/types';
import { renderWithProviders } from '../helpers/render';

describe('TeamMembersCard Component', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'E-Commerce Platform',
      description: 'Building e-commerce system',
      ownerId: 'owner-uid',
      memberIds: ['owner-uid', 'member-1'],
      memberNames: {
        'owner-uid': 'Alice Owner',
        'member-1': 'Bob Designer',
      },
      memberProfiles: [
        {
          uid: 'owner-uid',
          email: 'alice@test.com',
          displayName: 'Alice Owner',
          jobTitle: 'Project Manager',
          role: 'owner',
          addedAt: '2026-10-31T00:00:00.000Z',
        },
        {
          uid: 'member-1',
          email: 'bob@test.com',
          displayName: 'Bob Designer',
          jobTitle: 'UI/UX Designer',
          role: 'member',
          addedAt: '2026-10-31T00:00:00.000Z',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders team members with names, emails, and job title badges', () => {
    renderWithProviders(
      <TeamMembersCard projects={mockProjects} currentUserId="owner-uid" />
    );

    expect(screen.getByTestId('team-members-card')).toBeInTheDocument();
    expect(screen.getByText('Alice Owner')).toBeInTheDocument();
    expect(screen.getByText('Bob Designer')).toBeInTheDocument();
    expect(screen.getByText('UI/UX Designer')).toBeInTheDocument();
    expect(screen.getByText('Project Manager')).toBeInTheDocument();
  });

  it('opens Add Member modal when clicking add member button', () => {
    renderWithProviders(
      <TeamMembersCard projects={mockProjects} currentUserId="owner-uid" />
    );

    const addBtn = screen.getByTestId('add-team-member-btn');
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);

    expect(screen.getByTestId('add-member-modal')).toBeInTheDocument();
  });

  it('deduplicates members across multiple projects into a single account card', () => {
    const multiProjects: Project[] = [
      ...mockProjects,
      {
        id: 'proj-2',
        name: 'Mobile App',
        description: 'Second project',
        ownerId: 'owner-uid',
        memberIds: ['owner-uid', 'member-1'],
        memberNames: {
          'owner-uid': 'Alice Owner',
          'member-1': 'Bob Designer',
        },
        memberProfiles: [
          {
            uid: 'member-1',
            email: 'bob@test.com',
            displayName: 'Bob Designer',
            jobTitle: 'UI/UX Designer',
            role: 'member',
            addedAt: '2026-10-31T00:00:00.000Z',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    renderWithProviders(
      <TeamMembersCard projects={multiProjects} currentUserId="owner-uid" />
    );

    // Bob Designer must appear exactly once in the list despite being in 2 projects
    const bobElements = screen.getAllByText('Bob Designer');
    expect(bobElements).toHaveLength(1);
  });
});
