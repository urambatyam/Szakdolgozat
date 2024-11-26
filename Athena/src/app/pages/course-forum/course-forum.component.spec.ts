import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseForumComponent } from './course-forum.component';

describe('CourseForumComponent', () => {
  let component: CourseForumComponent;
  let fixture: ComponentFixture<CourseForumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseForumComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseForumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
