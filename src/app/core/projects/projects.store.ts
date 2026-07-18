import { computed, inject, Service, Signal, signal, WritableSignal } from '@angular/core';
import { AsyncResult, Result } from 'typescript-result';
import { ProjectRecord } from '../../types/project.type';
import { db } from '../db';
import { ProfileStore } from '../profile/profile.store';
import { safeParseAsync } from 'valibot';
import { ulid } from 'ulid';

@Service()
export class ProjectsStore {
  private readonly profileStore = inject(ProfileStore);
  private readonly _projects: WritableSignal<ProjectRecord[]> = signal([]);
  public readonly projects = this._projects.asReadonly();

  public loadAll = (): AsyncResult<ProjectRecord[], Error> => {
    return Result.fromAsyncCatching(async () => {
      const userId = this.profileStore.id();
      if (!userId) {
        return Result.error(new Error('No active profile found'));
      }

      const projects = await db.projects.where('userId').equals(userId).toArray();
      // Sort by updatedAt descending
      projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      this._projects.set(projects);
      return Result.ok(projects);
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  public create = (name: string): AsyncResult<ProjectRecord, Error> => {
    return Result.fromAsyncCatching(async () => {
      const userId = this.profileStore.id();
      if (!userId) {
        return Result.error(new Error('No active profile found'));
      }

      const nowStr = new Date().toISOString().substring(0, 19);
      const parsed = await safeParseAsync(ProjectRecord, {
        id: ulid(),
        name,
        userId,
        createdAt: nowStr,
        updatedAt: nowStr
      });

      if (!parsed.success) {
        const message = parsed.issues.map((i) => i.message).join(', ');
        return Result.error(new Error(message));
      }

      const project = parsed.output;
      await db.projects.add(project);

      // Reload/update the store
      const current = this._projects();
      this._projects.set([project, ...current]);

      return Result.ok(project);
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  public delete = (projectId: string): AsyncResult<void, Error> => {
    return Result.fromAsyncCatching(async () => {
      // 1. Delete all cards belonging to this project
      await db.cards.where('projectId').equals(projectId).delete();
      // 2. Delete the project itself
      await db.projects.delete(projectId);

      // Update the store
      const current = this._projects();
      this._projects.set(current.filter((p) => p.id !== projectId));

      return Result.ok();
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };
}


