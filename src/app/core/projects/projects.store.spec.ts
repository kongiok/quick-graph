import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ProjectsStore } from './projects.store';
import { ProjectRecord } from '../../types/project.type';
import { db } from '../db';
import { ProfileStore } from '../profile/profile.store';

describe('ProjectsStore', () => {
  let store: ProjectsStore;
  let mockProjectsList: ProjectRecord[] = [];
  let mockCardsList: any[] = [];
  let mockProfileStore: any;
  const mockUserId = '12345678-1234-4321-abcd-1234567890ab';

  beforeEach(async () => {
    mockProjectsList = [];
    mockCardsList = [];

    mockProfileStore = {
      id: vi.fn().mockReturnValue(mockUserId)
    };

    // Mock db.projects methods
    const mockProjectsEquals = vi.fn().mockImplementation((userId: string) => {
      return {
        toArray: vi.fn().mockImplementation(async () => {
          return mockProjectsList.filter((p) => p.userId === userId);
        })
      };
    });
    db.projects.where = vi.fn().mockImplementation((field: string) => {
      if (field === 'userId') {
        return { equals: mockProjectsEquals };
      }
      return {};
    });
    db.projects.toArray = vi.fn().mockImplementation(async () => {
      return [...mockProjectsList];
    });
    db.projects.add = vi.fn().mockImplementation(async (project: ProjectRecord) => {
      mockProjectsList.push(project);
      return project.id;
    });
    db.projects.delete = vi.fn().mockImplementation(async (id: string) => {
      mockProjectsList = mockProjectsList.filter((p) => p.id !== id);
    });

    // Mock db.cards method chain
    const mockEquals = vi.fn().mockImplementation((id: string) => {
      return {
        delete: vi.fn().mockImplementation(async () => {
          mockCardsList = mockCardsList.filter((c) => c.projectId !== id);
        })
      };
    });
    db.cards.where = vi.fn().mockImplementation((field: string) => {
      if (field === 'projectId') {
        return { equals: mockEquals };
      }
      return {};
    });

    TestBed.configureTestingModule({
      providers: [
        ProjectsStore,
        { provide: ProfileStore, useValue: mockProfileStore }
      ]
    });
    store = TestBed.inject(ProjectsStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('loadAll', () => {
    it('should load all projects from DB and sort by updatedAt descending', async () => {
      mockProjectsList = [
        { id: '01ARRW7A212345678901234561', userId: mockUserId, name: 'Project 1', createdAt: '2026-07-18T10:00:00', updatedAt: '2026-07-18T10:00:00' },
        { id: '01ARRW7A212345678901234562', userId: mockUserId, name: 'Project 2', createdAt: '2026-07-18T11:00:00', updatedAt: '2026-07-18T11:00:00' }
      ];

      const result = await store.loadAll();
      expect(result.ok).toBe(true);
      expect(store.projects()).toHaveLength(2);
      expect(store.projects()[0].id).toBe('01ARRW7A212345678901234562'); // Project 2 has later updatedAt, so should be first
    });
  });

  describe('create', () => {
    it('should create a new project with valid ULID and save to DB', async () => {
      const result = await store.create('New Test Project');
      expect(result.ok).toBe(true);

      const createdProject = result.value!;
      expect(createdProject.name).toBe('New Test Project');
      expect(createdProject.id).toBeDefined();
      expect(createdProject.userId).toBe(mockUserId);
      expect(mockProjectsList).toHaveLength(1);
      expect(mockProjectsList[0].id).toBe(createdProject.id);
      expect(store.projects()).toContainEqual(createdProject);
    });

    it('should fail if project name is empty', async () => {
      const result = await store.create('');
      expect(result.ok).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete project and its cards from DB', async () => {
      const project: ProjectRecord = {
        id: '01ARRW7A212345678901234563',
        userId: mockUserId,
        name: 'Project to Delete',
        createdAt: '2026-07-18T10:00:00',
        updatedAt: '2026-07-18T10:00:00'
      };
      mockProjectsList.push(project);
      mockCardsList.push(
        { id: '01ARRW7A212345678901234564', projectId: '01ARRW7A212345678901234563' },
        { id: '01ARRW7A212345678901234565', projectId: '01ARRW7A212345678901234566' }
      );

      // Load into store first
      await store.loadAll();

      const result = await store.delete('01ARRW7A212345678901234563');
      expect(result.ok).toBe(true);
      expect(mockProjectsList).toHaveLength(0);
      expect(mockCardsList).toHaveLength(1); // Only the other card should remain
      expect(store.projects()).toHaveLength(0);
    });
  });
});
