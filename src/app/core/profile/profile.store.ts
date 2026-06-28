import { computed, Service, signal } from '@angular/core';
import { Result } from 'typescript-result';
import { ProfileName } from '../../types/common.type';
import * as v from 'valibot';

@Service()
export class ProfileStore {
  private readonly _name = signal('');
  readonly name = this._name.asReadonly();
  readonly hasName = computed(() => this._name().trim().length > 0);
  setName(name: string): Result<void, Error> {
    const trimmed = v.safeParse(ProfileName, name);
    if (!trimmed.success) {
      const errMsg = trimmed.issues.map((issue) => issue.message).join(', ');
      return Result.error(new Error(errMsg));
    }

    if (trimmed.output.length <= 0) {
      return Result.error(new Error('Unable to set name'));
    }

    this._name.set(trimmed.output);
    return Result.ok(undefined);
  }
  clear() {
    this._name.set('');
    return Result.ok();
  }
}
