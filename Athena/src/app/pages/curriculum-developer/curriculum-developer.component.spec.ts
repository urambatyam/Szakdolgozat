import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurriculumDeveloperComponent } from './curriculum-developer.component';

describe('CurriculumDeveloperComponent', () => {
  let component: CurriculumDeveloperComponent;
  let fixture: ComponentFixture<CurriculumDeveloperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurriculumDeveloperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurriculumDeveloperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
