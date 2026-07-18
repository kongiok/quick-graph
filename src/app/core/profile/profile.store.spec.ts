import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ProfileStore } from './profile.store';
import { ProfileRecord } from '../../types/common.type';
import { db } from '../db';

describe('ProfileStore', () => {
  let store: ProfileStore;
  let mockUsersList: ProfileRecord[] = [];

  beforeEach(async () => {
    mockUsersList = [];

    // Mock db.users methods directly to prevent accessing IndexedDB
    db.users.clear = vi.fn().mockImplementation(async () => {
      mockUsersList = [];
    });
    db.users.toArray = vi.fn().mockImplementation(async () => {
      return [...mockUsersList];
    });
    db.users.add = vi.fn().mockImplementation(async (user: ProfileRecord) => {
      mockUsersList.push(user);
      return user.id;
    });
    db.users.put = vi.fn().mockImplementation(async (user: ProfileRecord) => {
      const index = mockUsersList.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        mockUsersList[index] = user;
      } else {
        mockUsersList.push(user);
      }
      return user.id;
    });

    TestBed.configureTestingModule({
      providers: [ProfileStore]
    });
    store = TestBed.inject(ProfileStore);
    await store.reset(); // ensure the store signal is reset
  });

  describe('initial state', () => {
    it('should expose null profile initially', () => {
      expect(store.profile()).toBeNull();
    });
    it('should expose hasProfile as false initially', () => {
      expect(store.hasProfile()).toBe(false);
    });
  });

  describe('hydrate', () => {
    it('should update profile and derived signals after hydration', () => {
      const mockProfile: ProfileRecord = {
        id: '12345678-1234-4321-abcd-1234567890ab',
        name: 'Test Name'
      };
      (store as any).hydrate(mockProfile);

      expect(store.profile()).toEqual(mockProfile);
      expect(store.id()).toBe(mockProfile.id);
      expect(store.name()).toBe(mockProfile.name);
      expect(store.hasProfile()).toBe(true);
    });
  });

  describe('ensureHydrated', () => {
    it('should skip db loading when profile is already hydrated', async () => {
      const mockProfile: ProfileRecord = {
        id: '12345678-1234-4321-abcd-1234567890ab',
        name: 'Test Name'
      };
      (store as any).hydrate(mockProfile);

      const loadSpy = vi.spyOn(store as any, 'loadProfileFromDb');

      const result = await store.ensureHydrated();
      expect(result.ok).toBe(true);
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it('should load from db and hydrate when profile is empty', async () => {
      const mockProfile: ProfileRecord = {
        id: '12345678-1234-4321-abcd-1234567890ab',
        name: 'Test Name'
      };
      mockUsersList.push(mockProfile);

      const result = await store.ensureHydrated();
      expect(result.ok).toBe(true);
      expect(store.profile()).toEqual(mockProfile);
    });
  });

  describe('updateName', () => {
    it('should return an error result when profile is not hydrated', async () => {
      const result = await store.updateName('New Name');
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('Profile is not hydrated');
    });

    it('should update name when profile exists', async () => {
      const mockProfile: ProfileRecord = {
        id: '12345678-1234-4321-abcd-1234567890ab',
        name: 'Old Name'
      };
      mockUsersList.push(mockProfile);
      await store.load();

      const result = await store.updateName('New Name');
      expect(result.ok).toBe(true);
      expect(store.name()).toBe('New Name');
      expect(mockUsersList[0].name).toBe('New Name');
    });
  });
});
