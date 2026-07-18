import { Routes } from '@angular/router';
import { Onboarding } from './onboarding/onboarding';
import { Projects } from './projects/projects';
import { Editor } from './editor/editor';
import { profileGuard } from './core/profile/profile.guard';

export const routes: Routes = [
  { path: 'onboarding', component: Onboarding, canActivate: [profileGuard] },
  { path: 'app', component: Projects, canActivate: [profileGuard] },
  { path: 'app/:projectId/:page', component: Editor, canActivate: [profileGuard] },
  { path: '**', redirectTo: '/app' },
];



