import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Editor } from './editor';
import { EditorStore } from '../core/projects/editor.store';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Result } from 'typescript-result';

describe('Editor', () => {
  let component: Editor;
  let fixture: ComponentFixture<Editor>;
  let mockEditorStore: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockEditorStore = {
      project: vi.fn().mockReturnValue({ id: 'proj-1', name: 'My Project' }),
      cards: vi.fn().mockReturnValue([]),
      currentPageIndex: signal(0),
      activeCard: vi.fn().mockReturnValue(null),
      loadProject: vi.fn().mockResolvedValue(Result.ok(undefined))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Editor],
      providers: [
        { provide: EditorStore, useValue: mockEditorStore },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ projectId: 'proj-1', page: '1' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Editor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
