import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// Removed unused AuthService import
// import { AuthService } from '../../../services/mysql/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel

import { DialogComponent } from './dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// --- Mocks ---
const translateServiceMock = {
    setDefaultLang: jasmine.createSpy('setDefaultLang'),
    use: jasmine.createSpy('use').and.returnValue(of(null)),
    get: jasmine.createSpy('get').and.returnValue(of('mock-translation')),
    instant: jasmine.createSpy('instant').and.callFake((key: string) => `instant-${key}`), // Add instant mock
    currentLang: 'hu',
    onLangChange: new EventEmitter<any>(),
    onTranslationChange: new EventEmitter<any>(),
    onDefaultLangChange: new EventEmitter<any>()
};

// Refined MatDialogRef Mock with a spy
const matDialogRefMock = {
  close: jasmine.createSpy('close') // Use spyOn for the close method
  // Removed componentInstance as it's not typically used this way in tests
};

// Define mock data variations for different test scenarios
const mockDialogDataPassword = {
  code: 'TEST1',
  email: 'test@mail.com',
  isPassword: 'true',
};

const mockDialogDataEmail = {
  code: 'TEST2',
  email: 'another@mail.com',
  isPassword: 'false',
};

describe('DialogComponent', () => {
  let component: DialogComponent;
  let fixture: ComponentFixture<DialogComponent>;
  // Keep a reference to the injected mock for easier access in tests
  let dialogRef: MatDialogRef<DialogComponent>;

  // Helper function to setup TestBed for different data scenarios
  async function setupTestBed(data: any) {
    await TestBed.configureTestingModule({
      // DialogComponent is standalone, it imports its own dependencies
      imports: [
        DialogComponent,
        BrowserAnimationsModule,
        RouterTestingModule.withRoutes([]),
        // FormsModule is needed if template uses [(ngModel)] which is likely
        FormsModule
      ],
      providers: [
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: MatDialogRef, useValue: matDialogRefMock },
        // Provide the specific data for the test scenario
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
    // Inject the mock dialogRef
    dialogRef = TestBed.inject(MatDialogRef);
    // Reset the spy before each test run using this setup
    matDialogRefMock.close.calls.reset();
    fixture.detectChanges(); // Trigger component initialization and data binding
  }

  describe('Password Mode', () => {
    beforeEach(async () => {
      await setupTestBed(mockDialogDataPassword);
    });

    it('should create DialogComponent in password mode', () => {
      expect(component).toBeTruthy();
      // Verify initial data binding from MAT_DIALOG_DATA
      expect(component.code()).toBe(mockDialogDataPassword.code);
      expect(component.email()).toBe(mockDialogDataPassword.email);
      expect(component.isPassword()).toBe('true');
      // Check initial state of input models
      expect(component.password()).toBe('');
      expect(component.new()).toBe('');
    });

    it('should call dialogRef.close() with no arguments on onNoClick()', () => {
      // Act
      component.onNoClick();

      // Assert
      expect(dialogRef.close).toHaveBeenCalledTimes(1);
      expect(dialogRef.close).toHaveBeenCalledWith(); // Ensure it's called with no arguments
    });

    // Note: Testing the "Save" button click requires interacting with the template.
    // A simpler test might be to manually call close with expected data,
    // but that doesn't test the component's direct behavior.
    // We'll stick to testing the existing methods for now.
    it('should update password and new models on input change (requires template interaction test)', () => {
        // This test demonstrates the concept but needs template interaction
        // or manual signal setting to be fully effective in isolation.
        const newPasswordValue = 'newPass123';
        const newConfirmationValue = 'newPass123'; // Assuming confirmation field maps to 'new'

        // Simulate setting signal values (alternative to template interaction)
        component.password.set(newPasswordValue);
        component.new.set(newConfirmationValue);

        fixture.detectChanges(); // Update bindings if template were involved

        expect(component.password()).toBe(newPasswordValue);
        expect(component.new()).toBe(newConfirmationValue);

        // In a real scenario, a "Save" button click would likely trigger:
        // this.dialogRef.close({ password: this.password(), new: this.new() });
        // We can verify the mock was *not* called yet without button interaction.
        expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('Email Mode', () => {
    beforeEach(async () => {
      await setupTestBed(mockDialogDataEmail);
    });

    it('should create DialogComponent in email mode', () => {
      expect(component).toBeTruthy();
      // Verify initial data binding from MAT_DIALOG_DATA
      expect(component.code()).toBe(mockDialogDataEmail.code);
      expect(component.email()).toBe(mockDialogDataEmail.email);
      expect(component.isPassword()).toBe('false'); // Check email mode
      // Check initial state of input models
      expect(component.password()).toBe(''); // Password field might still exist for confirmation
      expect(component.new()).toBe(''); // 'new' field would be for the new email
    });

     it('should call dialogRef.close() with no arguments on onNoClick()', () => {
      // Act
      component.onNoClick();

      // Assert
      expect(dialogRef.close).toHaveBeenCalledTimes(1);
      expect(dialogRef.close).toHaveBeenCalledWith();
    });
  });

});
