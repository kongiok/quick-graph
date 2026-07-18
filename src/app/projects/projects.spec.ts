import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Projects } from './projects';
import { ProjectsStore } from '../core/projects/projects.store';
import { ProfileStore } from '../core/profile/profile.store';
import { Router } from '@angular/router';
import { vi } from 'vitest';

describe('Projects', () => {
  let component: Projects;
  let fixture: ComponentFixture<Projects>;
  let mockProjectsStore: any;
  let mockProfileStore: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockProjectsStore = {
      projects: vi.fn().mockReturnValue([]),
      loadAll: vi.fn(),
      create: vi.fn(),
      delete: vi.fn()
    };

    mockProfileStore = {
      name: vi.fn().mockReturnValue('Test User')
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Projects],
      providers: [
        { provide: ProjectsStore, useValue: mockProjectsStore },
        { provide: ProfileStore, useValue: mockProfileStore },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Projects);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
