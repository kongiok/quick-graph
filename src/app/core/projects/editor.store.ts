import { computed, inject, Service, Signal, signal, WritableSignal } from '@angular/core';
import { AsyncResult, Result } from 'typescript-result';
import { ProjectRecord } from '../../types/project.type';
import { CardRecord, CardKind } from '../../types/card.type';
import { db } from '../db';
import { ProfileStore } from '../profile/profile.store';
import { safeParseAsync } from 'valibot';
import { ulid } from 'ulid';

@Service()
export class EditorStore {
  private readonly profileStore = inject(ProfileStore);
  private readonly _project: WritableSignal<ProjectRecord | null> = signal(null);
  public readonly project = this._project.asReadonly();

  private readonly _cards: WritableSignal<CardRecord[]> = signal([]);
  public readonly cards = this._cards.asReadonly();

  public readonly currentPageIndex: WritableSignal<number> = signal(0);

  public readonly activeCard: Signal<CardRecord | null> = computed(() => {
    const list = this.cards();
    const idx = this.currentPageIndex();
    return list[idx] || null;
  });

  public loadProject = (projectId: string): AsyncResult<void, Error> => {
    return Result.fromAsyncCatching(async () => {
      const project = await db.projects.get(projectId);
      if (!project) {
        return Result.error(new Error('Project not found'));
      }

      const userId = this.profileStore.id();
      if (project.userId !== userId) {
        return Result.error(new Error('Unauthorized: Project does not belong to active profile'));
      }

      const cards = await db.cards.where('projectId').equals(projectId).toArray();
      // Sort by createdAt ascending to preserve order
      cards.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      this._project.set(project);
      this._cards.set(cards);
      this.currentPageIndex.set(0);

      return Result.ok();
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  public updateProjectName = (name: string): AsyncResult<void, Error> => {
    return Result.fromAsyncCatching(async () => {
      const current = this.project();
      if (!current) {
        return Result.error(new Error('No active project'));
      }

      const nowStr = new Date().toISOString().substring(0, 19);
      const parsed = await safeParseAsync(ProjectRecord, {
        ...current,
        name,
        updatedAt: nowStr
      });

      if (!parsed.success) {
        const message = parsed.issues.map((i) => i.message).join(', ');
        return Result.error(new Error(message));
      }

      const updated = parsed.output;
      await db.projects.put(updated);
      this._project.set(updated);

      return Result.ok();
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  public updateCardContent = (cardId: string, content: any): AsyncResult<CardRecord, Error> => {
    return Result.fromAsyncCatching(async () => {
      const currentCards = this.cards();
      const cardIndex = currentCards.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        return Result.error(new Error('Card not found'));
      }

      const card = currentCards[cardIndex];
      const nowStr = new Date().toISOString().substring(0, 19);

      const parsed = await safeParseAsync(CardRecord, {
        ...card,
        content,
        updatedAt: nowStr,
        revision: card.revision + 1
      });

      if (!parsed.success) {
        const message = parsed.issues.map((i) => i.message).join(', ');
        return Result.error(new Error(message));
      }

      const updatedCard = parsed.output;
      await db.cards.put(updatedCard);

      // Update cards signal
      const nextCards = [...currentCards];
      nextCards[cardIndex] = updatedCard;
      this._cards.set(nextCards);

      // Touch project updatedAt
      await this.touchProject();

      return Result.ok(updatedCard);
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  public addCard = (kind: CardKind): AsyncResult<CardRecord, Error> => {
    return Result.fromAsyncCatching(async () => {
      const currentProject = this.project();
      if (!currentProject) {
        return Result.error(new Error('No active project'));
      }

      const nowStr = new Date().toISOString().substring(0, 19);
      const defaultContent = kind === 'single'
        ? {
            reportTime: new Date().toISOString().substring(0, 10),
            kicker: '單頁圖卡',
            titlePrefix: '探索世界',
            titleMain: '精彩瞬間',
            summary: '這是一份預設的單頁圖卡內容摘要，長度介於十個字到一百個字之間。',
            imageSources: ['https://placehold.co/600x400.png']
          }
        : {
            reportTime: new Date().toISOString().substring(0, 10),
            news: [
              {
                title: '重大新聞',
                subtitle: '本週重要事項',
                summary: '本週重要事項摘要內容，字數必須在二十五個字至五十五個字之間以通過驗證。',
                icon: { kind: 'ng-icon', value: 'featherStar' }
              }
            ]
          };

      const parsed = await safeParseAsync(CardRecord, {
        id: ulid(),
        projectId: currentProject.id,
        kind,
        createdAt: nowStr,
        updatedAt: nowStr,
        revision: 0,
        content: defaultContent
      });

      if (!parsed.success) {
        const message = parsed.issues.map((i) => i.message).join(', ');
        return Result.error(new Error(message));
      }

      const newCard = parsed.output;
      await db.cards.add(newCard);

      // Update cards signal
      const nextCards = [...this.cards(), newCard];
      // Sort to ensure correct rendering order
      nextCards.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      this._cards.set(nextCards);

      // Set current page to the newly added card index
      const newIndex = nextCards.findIndex(c => c.id === newCard.id);
      if (newIndex !== -1) {
        this.currentPageIndex.set(newIndex);
      }

      // Touch project
      await this.touchProject();

      return Result.ok(newCard);
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  public deleteCard = (cardId: string): AsyncResult<void, Error> => {
    return Result.fromAsyncCatching(async () => {
      const currentCards = this.cards();
      const cardIndex = currentCards.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        return Result.error(new Error('Card not found'));
      }

      await db.cards.delete(cardId);

      const nextCards = currentCards.filter((c) => c.id !== cardId);
      this._cards.set(nextCards);

      // Adjust active page index if needed
      const currentIdx = this.currentPageIndex();
      if (currentIdx >= nextCards.length) {
        this.currentPageIndex.set(Math.max(0, nextCards.length - 1));
      }

      // Touch project
      await this.touchProject();

      return Result.ok();
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  public reorderCards = (orderedCardIds: string[]): AsyncResult<void, Error> => {
    return Result.fromAsyncCatching(async () => {
      const currentProject = this.project();
      if (!currentProject) {
        return Result.error(new Error('No active project'));
      }

      const currentCards = this.cards();
      const baseTime = new Date(currentProject.createdAt).getTime();

      const updatedCards: CardRecord[] = [];

      for (let i = 0; i < orderedCardIds.length; i++) {
        const id = orderedCardIds[i];
        const card = currentCards.find((c) => c.id === id);
        if (!card) continue;

        // Assign sequential createdAt values separated by 1 second
        const newCreatedAt = new Date(baseTime + i * 1000).toISOString().substring(0, 19);
        const updatedCard = {
          ...card,
          createdAt: newCreatedAt,
          updatedAt: new Date().toISOString().substring(0, 19)
        };

        await db.cards.put(updatedCard);
        updatedCards.push(updatedCard);
      }

      // Sort by the new createdAt values
      updatedCards.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      this._cards.set(updatedCards);

      // Touch project
      await this.touchProject();

      return Result.ok();
    }, (err) => err instanceof Error ? err : new Error(String(err)));
  };

  private touchProject = async (): Promise<void> => {
    const current = this.project();
    if (!current) return;

    const nowStr = new Date().toISOString().substring(0, 19);
    const updated = {
      ...current,
      updatedAt: nowStr
    };
    await db.projects.put(updated);
    this._project.set(updated);
  };
}

