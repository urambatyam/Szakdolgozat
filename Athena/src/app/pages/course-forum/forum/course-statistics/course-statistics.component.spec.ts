import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseStatisticsComponent } from './course-statistics.component';

describe('CourseStatisticsComponent', () => {
  let component: CourseStatisticsComponent;
  let fixture: ComponentFixture<CourseStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseStatisticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
