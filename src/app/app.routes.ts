import { Routes } from '@angular/router';
import { Onboarding } from './onboarding/onboarding';
import { Projects } from './projects/projects';
import { profileGuard } from './core/profile/profile.guard';

export const routes: Routes = [
  { path: 'onboarding', component: Onboarding, canActivate: [profileGuard] },
  { path: 'app', component: Projects, canActivate: [profileGuard] },
  { path: '**', redirectTo: '/app' },
];


