import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { EditorStore } from './editor.store';
import { ProjectRecord } from '../../types/project.type';
import { CardRecord } from '../../types/card.type';
import { db } from '../db';
import { ProfileStore } from '../profile/profile.store';

describe('EditorStore', () => {
  let store: EditorStore;
  let mockProjects: ProjectRecord[] = [];
  let mockCards: CardRecord[] = [];
  let mockProfileStore: any;
  const mockUserId = '12345678-1234-4321-abcd-1234567890ab';

  beforeEach(() => {
    mockProjects = [];
    mockCards = [];

    mockProfileStore = {
      id: vi.fn().mockReturnValue(mockUserId)
    };

    // Mock db.projects
    db.projects.get = vi.fn().mockImplementation(async (id: string) => {
      return mockProjects.find((p) => p.id === id) || null;
    });
    db.projects.put = vi.fn().mockImplementation(async (project: ProjectRecord) => {
      const idx = mockProjects.findIndex((p) => p.id === project.id);
      if (idx !== -1) {
        mockProjects[idx] = project;
      } else {
        mockProjects.push(project);
      }
      return project.id;
    });

    // Mock db.cards
    db.cards.put = vi.fn().mockImplementation(async (card: CardRecord) => {
      const idx = mockCards.findIndex((c) => c.id === card.id);
      if (idx !== -1) {
        mockCards[idx] = card;
      } else {
        mockCards.push(card);
      }
      return card.id;
    });
    db.cards.add = vi.fn().mockImplementation(async (card: CardRecord) => {
      mockCards.push(card);
      return card.id;
    });
    db.cards.delete = vi.fn().mockImplementation(async (id: string) => {
      mockCards = mockCards.filter((c) => c.id !== id);
    });

    const mockEquals = vi.fn().mockImplementation((projId: string) => {
      return {
        toArray: vi.fn().mockImplementation(async () => {
          return mockCards.filter((c) => c.projectId === projId);
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
        EditorStore,
        { provide: ProfileStore, useValue: mockProfileStore }
      ]
    });
    store = TestBed.inject(EditorStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('loadProject', () => {
    it('should load project and its sorted cards', async () => {
      const project: ProjectRecord = {
        id: '01ARRW7A212345678901234561',
        userId: mockUserId,
        name: 'My Project',
        createdAt: '2026-07-18T10:00:00',
        updatedAt: '2026-07-18T10:00:00'
      };
      mockProjects.push(project);

      const card1: CardRecord = {
        id: '01ARRW7A212345678901234562',
        projectId: '01ARRW7A212345678901234561',
        kind: 'single',
        createdAt: '2026-07-18T10:05:00',
        updatedAt: '2026-07-18T10:05:00',
        revision: 0,
        content: {
          reportTime: '2026-07-18',
          kicker: 'Kicker',
          titlePrefix: 'Pref',
          titleMain: 'Main',
          summary: 'A very long summary of ten characters.',
          imageSources: ['img']
        }
      };
      const card2: CardRecord = {
        id: '01ARRW7A212345678901234563',
        projectId: '01ARRW7A212345678901234561',
        kind: 'single',
        createdAt: '2026-07-18T10:02:00', // earlier than card1
        updatedAt: '2026-07-18T10:02:00',
        revision: 0,
        content: {
          reportTime: '2026-07-18',
          kicker: 'Kicker2',
          titlePrefix: 'Pref2',
          titleMain: 'Main2',
          summary: 'Another very long summary of ten characters.',
          imageSources: ['img2']
        }
      };
      mockCards.push(card1, card2);

      const result = await store.loadProject('01ARRW7A212345678901234561');
      expect(result.ok).toBe(true);
      expect(store.project()?.name).toBe('My Project');
      expect(store.cards()).toHaveLength(2);
      expect(store.cards()[0].id).toBe('01ARRW7A212345678901234563'); // Sorted by createdAt ascending
      expect(store.currentPageIndex()).toBe(0);
      expect(store.activeCard()?.id).toBe('01ARRW7A212345678901234563');
    });

    it('should return error if project not found', async () => {
      const result = await store.loadProject('non-existent');
      expect(result.ok).toBe(false);
    });

    it('should return error if project belongs to another user', async () => {
      const project: ProjectRecord = {
        id: '01ARRW7A212345678901234561',
        userId: '23456789-2345-5432-bcde-2345678901bc', // different UUID
        name: 'Other Project',
        createdAt: '2026-07-18T10:00:00',
        updatedAt: '2026-07-18T10:00:00'
      };
      mockProjects.push(project);

      const result = await store.loadProject('01ARRW7A212345678901234561');
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('Unauthorized');
    });
  });

  describe('updateProjectName', () => {
    it('should update project name and touch updatedAt', async () => {
      const project: ProjectRecord = {
        id: '01ARRW7A212345678901234561',
        userId: mockUserId,
        name: 'My Project',
        createdAt: '2026-07-18T10:00:00',
        updatedAt: '2026-07-18T10:00:00'
      };
      mockProjects.push(project);
      await store.loadProject('01ARRW7A212345678901234561');

      const result = await store.updateProjectName('Updated Project');
      expect(result.ok).toBe(true);
      expect(store.project()?.name).toBe('Updated Project');
      expect(store.project()?.updatedAt).not.toBe('2026-07-18T10:00:00');
    });
  });

  describe('updateCardContent', () => {
    it('should update card content and increment revision', async () => {
      const project: ProjectRecord = {
        id: '01ARRW7A212345678901234561',
        userId: mockUserId,
        name: 'My Project',
        createdAt: '2026-07-18T10:00:00',
        updatedAt: '2026-07-18T10:00:00'
      };
      mockProjects.push(project);

      const card: CardRecord = {
        id: '01ARRW7A212345678901234562',
        projectId: '01ARRW7A212345678901234561',
        kind: 'single',
        createdAt: '2026-07-18T10:02:00',
        updatedAt: '2026-07-18T10:02:00',
        revision: 3,
        content: {
          reportTime: '2026-07-18',
          kicker: 'Kicker',
          titlePrefix: 'Pref',
          titleMain: 'Main',
          summary: 'A very long summary of ten characters.',
          imageSources: ['img']
        }
      };
      mockCards.push(card);
      await store.loadProject('01ARRW7A212345678901234561');

      const newContent = {
        ...card.content,
        titleMain: 'New Title'
      };

      const result = await store.updateCardContent('01ARRW7A212345678901234562', newContent);
      expect(result.ok).toBe(true);
      expect(result.value!.revision).toBe(4);
      expect((result.value!.content as any).titleMain).toBe('New Title');
      expect((store.activeCard()?.content as any).titleMain).toBe('New Title');
      expect(store.project()?.updatedAt).not.toBe('2026-07-18T10:00:00');
    });
  });

  describe('addCard', () => {
    it('should add a new card and switch to it', async () => {
      const project: ProjectRecord = {
        id: '01ARRW7A212345678901234561',
        userId: mockUserId,
        name: 'My Project',
        createdAt: '2026-07-18T10:00:00',
        updatedAt: '2026-07-18T10:00:00'
      };
      mockProjects.push(project);
      await store.loadProject('01ARRW7A212345678901234561');

      const result = await store.addCard('weekly');
      expect(result.ok).toBe(true);
      expect(store.cards()).toHaveLength(1);
      expect(store.cards()[0].kind).toBe('weekly');
      expect(store.currentPageIndex()).toBe(0);
    });
  });

  describe('deleteCard', () => {
    it('should delete card and update indices', async () => {
      const project: ProjectRecord = {
        id: '01ARRW7A212345678901234561',
        userId: mockUserId,
        name: 'My Project',
        createdAt: '2026-07-18T10:00:00',
        updatedAt: '2026-07-18T10:00:00'
      };
      mockProjects.push(project);

      const card1: CardRecord = {
        id: '01ARRW7A212345678901234562',
        projectId: '01ARRW7A212345678901234561',
        kind: 'single',
        createdAt: '2026-07-18T10:01:00',
        updatedAt: '2026-07-18T10:01:00',
        revision: 0,
        content: {
          reportTime: '2026-07-18', kicker: 'K1', titlePrefix: 'P1', titleMain: 'M1', summary: 'A very long summary 1.', imageSources: ['img1']
        }
      };
      const card2: CardRecord = {
        id: '01ARRW7A212345678901234563',
        projectId: '01ARRW7A212345678901234561',
        kind: 'single',
        createdAt: '2026-07-18T10:02:00',
        updatedAt: '2026-07-18T10:02:00',
        revision: 0,
        content: {
          reportTime: '2026-07-18', kicker: 'K2', titlePrefix: 'P2', titleMain: 'M2', summary: 'A very long summary 2.', imageSources: ['img2']
        }
      };
      mockCards.push(card1, card2);
      await store.loadProject('01ARRW7A212345678901234561');

      // Go to page index 1
      store.currentPageIndex.set(1);

      const result = await store.deleteCard('01ARRW7A212345678901234563');
      expect(result.ok).toBe(true);
      expect(store.cards()).toHaveLength(1);
      expect(store.currentPageIndex()).toBe(0); // Adjusted to 0
    });
  });

  describe('reorderCards', () => {
    it('should reorder cards sequentially and keep sorted order', async () => {
      const project: ProjectRecord = {
        id: '01ARRW7A212345678901234561',
        userId: mockUserId,
        name: 'My Project',
        createdAt: '2026-07-18T10:00:00',
        updatedAt: '2026-07-18T10:00:00'
      };
      mockProjects.push(project);

      const card1: CardRecord = {
        id: '01ARRW7A212345678901234562',
        projectId: '01ARRW7A212345678901234561',
        kind: 'single',
        createdAt: '2026-07-18T10:01:00',
        updatedAt: '2026-07-18T10:01:00',
        revision: 0,
        content: {
          reportTime: '2026-07-18', kicker: 'K1', titlePrefix: 'P1', titleMain: 'M1', summary: 'A very long summary 1.', imageSources: ['img1']
        }
      };
      const card2: CardRecord = {
        id: '01ARRW7A212345678901234563',
        projectId: '01ARRW7A212345678901234561',
        kind: 'single',
        createdAt: '2026-07-18T10:02:00',
        updatedAt: '2026-07-18T10:02:00',
        revision: 0,
        content: {
          reportTime: '2026-07-18', kicker: 'K2', titlePrefix: 'P2', titleMain: 'M2', summary: 'A very long summary 2.', imageSources: ['img2']
        }
      };
      mockCards.push(card1, card2);
      await store.loadProject('01ARRW7A212345678901234561');

      // Reorder: card2 first, then card1
      const reorderResult = await store.reorderCards(['01ARRW7A212345678901234563', '01ARRW7A212345678901234562']);
      expect(reorderResult.ok).toBe(true);
      expect(store.cards()[0].id).toBe('01ARRW7A212345678901234563');
      expect(store.cards()[1].id).toBe('01ARRW7A212345678901234562');
    });
  });
});
