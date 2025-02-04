import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordDialogComponent } from './password-dialog.component';

describe('EmailDialogComponent', () => {
  let component: PasswordDialogComponent;
  let fixture: ComponentFixture<PasswordDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
