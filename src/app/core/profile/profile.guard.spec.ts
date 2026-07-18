import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { vi } from 'vitest';
import { profileGuard } from './profile.guard';
import { ProfileStore } from './profile.store';

describe('profileGuard', () => {
  let mockProfileStore: any;
  let mockRouter: any;

  const executeGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
    TestBed.runInInjectionContext(() => profileGuard(route, state));

  beforeEach(() => {
    mockProfileStore = {
      hasProfile: vi.fn(),
      ensureHydrated: vi.fn().mockResolvedValue({ ok: true })
    };

    mockRouter = {
      createUrlTree: vi.fn().mockImplementation((commands: any[]) => {
        return { toString: () => commands.join('/') } as UrlTree;
      })
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ProfileStore, useValue: mockProfileStore },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should redirect to /app if profile exists and user is visiting /onboarding', async () => {
    mockProfileStore.hasProfile.mockReturnValue(true);

    const result = await executeGuard({} as any, { url: '/onboarding' } as any);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/app']);
    expect((result as UrlTree).toString()).toBe('/app');
  });

  it('should allow navigation to /app if profile exists', async () => {
    mockProfileStore.hasProfile.mockReturnValue(true);

    const result = await executeGuard({} as any, { url: '/app' } as any);
    expect(result).toBe(true);
  });

  it('should allow navigation to /onboarding if profile does not exist', async () => {
    mockProfileStore.hasProfile.mockReturnValue(false);

    const result = await executeGuard({} as any, { url: '/onboarding' } as any);
    expect(result).toBe(true);
  });

  it('should redirect to /onboarding if profile does not exist and user is visiting /app', async () => {
    mockProfileStore.hasProfile.mockReturnValue(false);

    const result = await executeGuard({} as any, { url: '/app' } as any);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/onboarding']);
    expect((result as UrlTree).toString()).toBe('/onboarding');
  });
});
