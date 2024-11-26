import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElectronicControllerComponent } from './electronic-controller.component';

describe('ElectronicControllerComponent', () => {
  let component: ElectronicControllerComponent;
  let fixture: ComponentFixture<ElectronicControllerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElectronicControllerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElectronicControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
