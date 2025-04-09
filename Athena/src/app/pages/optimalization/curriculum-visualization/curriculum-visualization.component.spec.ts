import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurriculumVisualizationComponent } from './curriculum-visualization.component';

describe('CurriculumVisualizationComponent', () => {
  let component: CurriculumVisualizationComponent;
  let fixture: ComponentFixture<CurriculumVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurriculumVisualizationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurriculumVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
