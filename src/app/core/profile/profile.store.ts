import { computed, Service, Signal, signal, WritableSignal } from '@angular/core';
import { AsyncResult, Result } from 'typescript-result';
import { ProfileName, ProfileRecord } from '../../types/common.type';
import { db } from '../db';
import { isDeepEqual } from "remeda";
import { safeParse, safeParseAsync } from 'valibot';
import { v4 as uuidv4 } from "uuid"

@Service()
export class ProfileStore {
  /*
    Profile Fields
  */
  private readonly _profile: WritableSignal<ProfileRecord | null> = signal(null);

  public readonly profile = this._profile.asReadonly();
  public readonly id: Signal<string | undefined> = computed(() => this.profile()?.id);
  public readonly name: Signal<string | undefined> = computed(() => this.profile()?.name);
  public readonly hasProfile: Signal<boolean> = computed(() => this.profile() !== null);

  /*
    Core Functionality
  */
  public create = (name: string): AsyncResult<ProfileRecord, Error> => {
    return Result.fromAsyncCatching(async () => {
      const parsedNewProfile = await safeParseAsync(ProfileRecord, { id: uuidv4(), name });
      if (!parsedNewProfile.success) {
        const message = parsedNewProfile.issues.map((i) => i.message).join(', ');
        return Result.error(new Error(message));
      }

      await db.users.clear();
      await db.users.add(parsedNewProfile.output);
      this.hydrate(parsedNewProfile.output);

      return Result.ok(parsedNewProfile.output);
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  public setName = (name: string): AsyncResult<ProfileRecord, Error> => {
    return this.create(name);
  };

  public reset = (): AsyncResult<void, Error> => {
    return Result.fromAsyncCatching(async () => {
      await db.users.clear();
      this._profile.set(null);
      return Result.ok();
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  public load = (): AsyncResult<ProfileRecord, Error> => {
    return this.loadProfileFromDb().onSuccess((profile) => {
      this.hydrate(profile);
    });
  };

  public updateName = (givenString: string): AsyncResult<void, Error> => {
    return Result.fromAsyncCatching(async () => {
      const currentProfile = this.profile();
      if (!currentProfile) {
        return Result.error(new Error('Profile is not hydrated'));
      }

      const parsedName = safeParse(ProfileName, givenString);
      if (!parsedName.success) {
        const message = parsedName.issues.map((i) => i.message).join(', ');
        return Result.error(new Error(message));
      }

      const newProfile = { ...currentProfile, name: parsedName.output };
      await db.users.put(newProfile);
      this.hydrate(newProfile);
      return Result.ok();
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  public ensureHydrated = (): AsyncResult<void, Error> => {
    if (this.hasProfile()) {
      return Result.fromAsync(async () => Result.ok());
    }
    return this.load().map(() => {});
  };

  /*
    Utils
  */
  private loadProfileFromDb = (): AsyncResult<ProfileRecord, Error> => {
    return Result.fromAsyncCatching(async () => {
      const users = await db.users.toArray();
      if (!users || users.length === 0) {
        return Result.error(new Error('Profile not found'));
      }
      return Result.ok(users[0]);
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  private hydrate = (profile: ProfileRecord): void => {
    if (!isDeepEqual(this._profile(), profile)) {
      this._profile.set(profile);
    }
  };
}

