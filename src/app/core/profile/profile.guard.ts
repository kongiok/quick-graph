import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ProfileStore } from './profile.store';

export const profileGuard: CanActivateFn = async (_route, state) => {
  const profileStore = inject(ProfileStore);
  const router = inject(Router);

  if (!profileStore.hasProfile()) {
    await profileStore.ensureHydrated();
  }

  const hasProfile = profileStore.hasProfile();
  const isTargetingOnboarding = state.url.includes('/onboarding');

  if (hasProfile) {
    if (isTargetingOnboarding) {
      return router.createUrlTree(['/app']);
    }
    return true;
  } else {
    if (!isTargetingOnboarding) {
      return router.createUrlTree(['/onboarding']);
    }
    return true;
  }
};

