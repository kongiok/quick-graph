import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EditorStore } from '../core/projects/editor.store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-editor',
  imports: [CommonModule, RouterModule],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor implements OnInit, OnDestroy {
  protected readonly store = inject(EditorStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(async (params) => {
      const projectId = params['projectId'];
      const page = parseInt(params['page'], 10) || 1;

      if (projectId) {
        const loadResult = await this.store.loadProject(projectId);
        if (!loadResult.ok) {
          alert(loadResult.error?.message || '載入專案失敗');
          this.router.navigate(['/app']);
          return;
        }
        
        // Ensure index is within range of loaded cards
        const cardsCount = this.store.cards().length;
        if (cardsCount > 0 && (page < 1 || page > cardsCount)) {
          // Adjust back to a valid page within bounds
          const validPage = Math.max(1, Math.min(page, cardsCount));
          this.router.navigate(['/app', projectId, validPage]);
          return;
        }

        this.store.currentPageIndex.set(page - 1);
      }
    });
  }

  protected onBack(): void {
    this.router.navigate(['/app']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
