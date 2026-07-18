import { Component, inject, signal, WritableSignal } from '@angular/core';
import { ProcessSteps } from './onboarding.type';
import { Name } from './name/name';
import { Title } from './title/title';
import { ProfileStore } from '../core/profile/profile.store';
import { Router } from '@angular/router';

@Component({
  selector: 'page-onboarding',
  imports: [Name, Title],
  templateUrl: './onboarding.html',
})
export class Onboarding {
  protected processStep: WritableSignal<ProcessSteps> = signal('TITLE');
  protected profile = inject(ProfileStore);
  private router = inject(Router);

  protected async applyProfileName(input: string) {
    const result = await this.profile.setName(input);
    if (result.ok) {
      this.router.navigate(['/app']);
    }
  }
}
