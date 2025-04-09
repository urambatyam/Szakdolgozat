import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptimalizationComponent } from './optimalization.component';

describe('OptimalizationComponent', () => {
  let component: OptimalizationComponent;
  let fixture: ComponentFixture<OptimalizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptimalizationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptimalizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
