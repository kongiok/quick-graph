import { TestBed } from '@angular/core/testing';

import { ProfileStore } from './profile.store';

describe('ProfileStore', () => {
  let profile: ProfileStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    profile = TestBed.inject(ProfileStore);
  });

  it('should be created', () => {
    expect(profile).toBeTruthy();
  });
  it('should be clear by default', () => {
    expect(profile.name()).toBe('');
    expect(profile.hasName()).toBe(false);
  });
  it('should dump a new name', () => {
    expect(profile.name()).toBe('');
    const hasSetName = profile.setName('Giok');
    expect(hasSetName.ok);
    expect(profile.hasName()).toBe(true);
    expect(profile.name()).toBe('Giok');
  });
});
