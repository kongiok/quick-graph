import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectsStore } from '../core/projects/projects.store';
import { ProfileStore } from '../core/profile/profile.store';
import { db } from '../core/db';
import { ulid } from 'ulid';
import { CardKind } from '../types/card.type';

@Component({
  selector: 'app-projects',
  imports: [DatePipe, FormsModule],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects implements OnInit {
  protected readonly projectsStore = inject(ProjectsStore);
  private readonly profileStore = inject(ProfileStore);
  private readonly router = inject(Router);

  protected newProjectName = '';
  protected isCreating = false;
  protected errorMessage = '';

  protected get userName(): string {
    return this.profileStore.name() || '使用者';
  }

  ngOnInit(): void {
    this.projectsStore.loadAll();
  }

  protected async onCreateProject(kind: CardKind): Promise<void> {
    const enteredName = this.newProjectName.trim();
    const defaultName = kind === 'weekly' ? '未命名專案 - 一週大事' : '未命名專案 - 專題圖卡';
    const finalName = enteredName || defaultName;

    this.isCreating = true;
    this.errorMessage = '';

    const result = await this.projectsStore.create(finalName);

    if (result.ok) {
      const newProject = result.value!;
      
      // Initialize the first card for this project based on selected template kind
      const nowStr = new Date().toISOString().substring(0, 19);
      const defaultContent: any = kind === 'single'
        ? {
            reportTime: new Date().toISOString().substring(0, 10),
            kicker: '專題圖卡',
            titlePrefix: '探索世界',
            titleMain: '精彩瞬間',
            summary: '這是一份預設的專題圖卡內容摘要，長度介於十個字到一百個字之間。',
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

      try {
        const newCard: any = {
          id: ulid(),
          projectId: newProject.id,
          kind,
          createdAt: nowStr,
          updatedAt: nowStr,
          revision: 0,
          content: defaultContent
        };
        await db.cards.add(newCard);
        
        this.newProjectName = '';
        this.router.navigate(['/app', newProject.id, 1]);
      } catch (err) {
        this.errorMessage = err instanceof Error ? err.message : '建立圖卡失敗';
      } finally {
        this.isCreating = false;
      }
    } else {
      this.errorMessage = result.error?.message || '建立專案失敗';
      this.isCreating = false;
    }
  }

  protected async onDeleteProject(event: Event, projectId: string): Promise<void> {
    event.stopPropagation();
    if (confirm('確定要刪除此專案嗎？此動作無法復原。')) {
      await this.projectsStore.delete(projectId);
    }
  }

  protected onOpenProject(projectId: string): void {
    this.router.navigate(['/app', projectId, 1]);
  }
}
