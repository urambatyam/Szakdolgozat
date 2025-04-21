import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, BehaviorSubject, Subject } from 'rxjs'; // Import BehaviorSubject and Subject
import { EventEmitter } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '../../services/mysql/auth.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core'; // Import TranslateModule
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog'; // Import MatDialogModule
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Import MatSnackBarModule
import { ReactiveFormsModule } from '@angular/forms'; // Import ReactiveFormsModule

import { ProfileComponent } from './profile.component';
import { DialogComponent } from './dialog/dialog.component'; // Needed for dialog open type check

// --- Mocks ---
const snackBarMock = {
  open: jasmine.createSpy('open')
};

// Mock MatDialogRef - Use Subject for better control over afterClosed emission
const dialogRefMock = {
  _afterClosedSubject: new Subject<any>(),
  afterClosed() {
    return this._afterClosedSubject.asObservable();
  },
  // Helper method to simulate closing the dialog in tests
  closeDialog(result?: any) {
    this._afterClosedSubject.next(result);
    this._afterClosedSubject.complete(); // Complete the observable stream
  },
  // Reset helper for beforeEach
  reset() {
    this._afterClosedSubject = new Subject<any>();
  }
};

// Mock MatDialog
const dialogMock = {
  open: jasmine.createSpy('open').and.returnValue(dialogRefMock)
};

// Define a standard test user
const testUser = { code: 'TEST1', name: 'Test User', email: 'test@example.com', role: 'student' as const };

// Refined AuthService Mock using BehaviorSubject for user$
const authServiceMock = {
    // Use BehaviorSubject to allow emitting initial and subsequent values/errors
    user$: new BehaviorSubject<any>(null),
    updatePassword: jasmine.createSpy('updatePassword').and.returnValue(of({})), // Default success
    updateEmail: jasmine.createSpy('updateEmail').and.returnValue(of({})), // Default success

    // Helper to set user data for tests
    setUser(user: any) {
        this.user$.next(user);
    },
    // Helper to simulate user data error
    emitUserError(error: any) {
        this.user$.error(error); // Emit error on the subject
    },
    // Helper to reset the subject for isolation between tests
    resetUserSubject() {
        this.user$ = new BehaviorSubject<any>(null);
    }
};

// Refined TranslateService Mock
const translateServiceMock = {
    setDefaultLang: jasmine.createSpy('setDefaultLang'),
    use: jasmine.createSpy('use').and.returnValue(of(null)),
    // Simulate translation lookup
    get: jasmine.createSpy('get').and.callFake((key: string | string[], interpolateParams?: object) => {
        if (typeof key === 'string') {
            // Simple mock: return a string indicating the key was "translated"
            return of(`translated-${key}`);
        }
        // Handle array of keys if needed
        const translations: { [key: string]: string } = {};
        key.forEach(k => translations[k] = `translated-${k}`);
        return of(translations);
    }),
    // Simulate instant translation
    instant: jasmine.createSpy('instant').and.callFake((key: string) => `instant-${key}`),
    currentLang: 'hu',
    onLangChange: new EventEmitter<any>(),
    onTranslationChange: new EventEmitter<any>(),
    onDefaultLangChange: new EventEmitter<any>()
};

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  // Inject mocked services for easier access in tests
  let authService: AuthService;
  let dialog: MatDialog;
  let snackBar: MatSnackBar;
  let translateService: TranslateService;

  beforeEach(fakeAsync(() => { // Use fakeAsync for Observables and timers like tick()
    // Reset user$ for each test to avoid state leakage
    authServiceMock.resetUserSubject();

    TestBed.configureTestingModule({
      // Import necessary modules for the component under test and its dependencies
      imports: [
        ProfileComponent, // The component itself is standalone and imports its needs
        BrowserAnimationsModule, // Needed for Material animations
        // No need to import ReactiveFormsModule, MatDialogModule, MatSnackBarModule, TranslateModule here
        // because ProfileComponent imports them as it's standalone.
      ],
      providers: [
        // Provide the mocked services
        { provide: AuthService, useValue: authServiceMock },
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        // No need to provide MatDialogRef here, it's handled by the MatDialog mock
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;

    // Inject services for use in tests
    authService = TestBed.inject(AuthService);
    dialog = TestBed.inject(MatDialog);
    snackBar = TestBed.inject(MatSnackBar);
    translateService = TestBed.inject(TranslateService);

    // Reset mock call counts before each test
    authServiceMock.updatePassword.calls.reset();
    authServiceMock.updateEmail.calls.reset();
    dialogMock.open.calls.reset();
    dialogRefMock.reset(); // Reset the afterClosed subject mock
    snackBarMock.open.calls.reset();
    translateServiceMock.get.calls.reset();
    translateServiceMock.instant.calls.reset();

    // --- Initial State Setup ---
    // Set initial user data *before* detectChanges triggers ngOnInit
    authServiceMock.setUser(testUser);

    // --- Trigger Initialization ---
    fixture.detectChanges(); // Triggers ngOnInit
    tick(); // Complete async operations started in ngOnInit (like the user$ subscription)
  }));

  it('should create ProfileComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should populate form with user data on init', () => {
    // Assert: Check if the form values match the test user data after ngOnInit
    expect(component['profilForm'].getRawValue()).toEqual({
        code: testUser.code,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
    });
    // Check that fields are disabled as expected
    expect(component['profilForm'].controls.code.disabled).toBeTrue();
    expect(component['profilForm'].controls.name.disabled).toBeTrue();
    expect(component['profilForm'].controls.email.disabled).toBeTrue();
    expect(component['profilForm'].controls.role.disabled).toBeTrue();
  });

  it('should show snackbar if loading user data fails on init', fakeAsync(() => {
    // --- Arrange ---
    // Reset component state by recreating it with error scenario
    TestBed.resetTestingModule(); // Clear previous setup
    authServiceMock.resetUserSubject(); // Reset the subject
    const error = new Error('User data fetch failed');
    authServiceMock.emitUserError(error); // Setup error emission *before* component creation

    // Reconfigure TestBed for the error scenario
    TestBed.configureTestingModule({
        imports: [ ProfileComponent, BrowserAnimationsModule ],
        providers: [
            { provide: AuthService, useValue: authServiceMock },
            { provide: TranslateService, useValue: translateServiceMock },
            { provide: MatDialog, useValue: dialogMock },
            { provide: MatSnackBar, useValue: snackBarMock },
        ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    snackBar = TestBed.inject(MatSnackBar); // Re-inject snackBar
    translateService = TestBed.inject(TranslateService); // Re-inject translateService

    // --- Act ---
    fixture.detectChanges(); // ngOnInit runs and subscribes to the erroring observable
    tick(); // Process the error emission and the catchError block in subscribeToUserUpdates

    // --- Assert ---
    // Check if the correct translation key was requested for the snackbar message
    expect(translateService.get).toHaveBeenCalledWith('profile.ERROR_LOADING_USER_DATA', undefined);
    // Need another tick for the translate.get().subscribe() inside showSnackbar to resolve
    tick();
    // Check if snackbar was opened with the translated message and correct class
    expect(snackBar.open).toHaveBeenCalledWith(
        'translated-profile.ERROR_LOADING_USER_DATA', // Expected translated message
        'instant-GENERAL.CLOSE', // Expected translated action text
        jasmine.objectContaining({ panelClass: ['error-snackbar'] }) // Check for correct panel class
    );
    // Check if the form remained empty or was reset due to the error
    expect(component['profilForm'].getRawValue().code).toBeNull();
  }));


  describe('openDialog', () => {
    it('should open dialog for password change with correct data', () => {
        // Act: Call the method to open the dialog for password change
        component.openDialog(true); // isPassword = true

        // Assert: Check if MatDialog.open was called with the correct component and data
        expect(dialog.open).toHaveBeenCalledOnceWith(DialogComponent, {
            data: {
                code: testUser.code, // Should pass the current user's code
                email: testUser.email, // Should pass the current user's email
                isPassword: true, // Should indicate password change mode
            }
        });
    });

    it('should open dialog for email change with correct data', () => {
        // Act: Call the method to open the dialog for email change
        component.openDialog(false); // isPassword = false

        // Assert: Check if MatDialog.open was called with the correct component and data
        expect(dialog.open).toHaveBeenCalledOnceWith(DialogComponent, {
            data: {
                code: testUser.code,
                email: testUser.email,
                isPassword: false, // Should indicate email change mode
            }
        });
    });

     it('should show error snackbar and not open dialog if user code is missing', fakeAsync(() => {
        // Arrange: Set user code to null in the form to simulate missing data
        component['profilForm'].controls.code.setValue('');
        fixture.detectChanges(); // Update component state

        // Act
        component.openDialog(true); // Try to open dialog
        tick(); // Allow async operations like translate.get in showSnackbar

        // Assert
        expect(dialog.open).not.toHaveBeenCalled(); // Dialog should not have been opened
        // Check if the correct error message translation was requested
        expect(translateService.get).toHaveBeenCalledWith('profile.ERROR_USER_CODE_MISSING', undefined);
        tick(); // Allow translate.get().subscribe() to complete
        // Check if the snackbar was shown with the translated error message
        expect(snackBar.open).toHaveBeenCalledWith(
            'translated-profile.ERROR_USER_CODE_MISSING',
            'instant-GENERAL.CLOSE',
            jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
    }));


    it('should call updatePassword and show success snackbar when dialog closes with password data', fakeAsync(() => {
        // Arrange: Define the data returned when the dialog closes
        const dialogResult = { password: 'oldPassword1', new: 'newPassword1' };
        // Mock the authService updatePassword to return success
        authServiceMock.updatePassword.and.returnValue(of({ message: 'Password updated' }));

        // Act: Open the dialog and simulate it closing with the result
        component.openDialog(true); // Open for password change
        dialogRefMock.closeDialog(dialogResult); // Simulate dialog closing
        tick(); // Process the afterClosed observable emission and the subsequent authService call

        // Assert: Check if the updatePassword service method was called correctly
        expect(authService.updatePassword).toHaveBeenCalledOnceWith(testUser.code, dialogResult.password, dialogResult.new);
        // Check if the success message translation was requested
        expect(translateService.get).toHaveBeenCalledWith('profile.SUCCESS_PASSWORD_UPDATE', undefined);
        tick(); // Process translate.get().subscribe() inside showSnackbar
        // Check if the success snackbar was shown
        expect(snackBar.open).toHaveBeenCalledWith(
            'translated-profile.SUCCESS_PASSWORD_UPDATE',
            'instant-GENERAL.CLOSE',
            jasmine.objectContaining({ panelClass: ['success-snackbar'] })
        );
    }));

    it('should call updateEmail and show success snackbar when dialog closes with email data', fakeAsync(() => {
        // Arrange
        const dialogResult = { password: 'passwordForEmail', new: 'new@example.com' };
        authServiceMock.updateEmail.and.returnValue(of({ message: 'Email updated' }));

        // Act
        component.openDialog(false); // Open for email change
        dialogRefMock.closeDialog(dialogResult);
        tick();

        // Assert
        expect(authService.updateEmail).toHaveBeenCalledOnceWith(testUser.code, dialogResult.password, dialogResult.new);
        expect(translateService.get).toHaveBeenCalledWith('profile.SUCCESS_EMAIL_UPDATE', undefined);
        tick();
        expect(snackBar.open).toHaveBeenCalledWith(
            'translated-profile.SUCCESS_EMAIL_UPDATE',
            'instant-GENERAL.CLOSE',
            jasmine.objectContaining({ panelClass: ['success-snackbar'] })
        );
    }));

    it('should show error snackbar if updatePassword fails', fakeAsync(() => {
        // Arrange
        const dialogResult = { password: 'oldPassword1', new: 'newPassword1' };
        const errorResponse = { message: 'Update failed!' };
        // Mock the service to return an error
        authServiceMock.updatePassword.and.returnValue(throwError(() => errorResponse));

        // Act
        component.openDialog(true);
        dialogRefMock.closeDialog(dialogResult);
        tick(); // Process afterClosed, service call, and catchError

        // Assert
        expect(authService.updatePassword).toHaveBeenCalledOnceWith(testUser.code, dialogResult.password, dialogResult.new);
        // Check if the error message translation was requested with interpolation params
        expect(translateService.get).toHaveBeenCalledWith('profile.ERROR_PASSWORD_UPDATE', { message: errorResponse.message });
        tick(); // Process translate.get().subscribe()
        // Check if the error snackbar was shown
        expect(snackBar.open).toHaveBeenCalledWith(
            'translated-profile.ERROR_PASSWORD_UPDATE',
            'instant-GENERAL.CLOSE',
            jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
    }));

     it('should not call update service if dialog closes without result (Cancel)', fakeAsync(() => {
        // Act: Open dialog and simulate closing without data (e.g., clicking Cancel)
        component.openDialog(true);
        dialogRefMock.closeDialog(undefined); // Simulate closing with undefined result
        tick(); // Process afterClosed observable

        // Assert: Ensure no update methods were called and no snackbar appeared
        expect(authService.updatePassword).not.toHaveBeenCalled();
        expect(authService.updateEmail).not.toHaveBeenCalled();
        expect(snackBar.open).not.toHaveBeenCalled();
    }));

  });

  // Optional: Test ngOnDestroy to ensure cleanup happens
  it('should complete destroy$ subject on ngOnDestroy', () => {
    // Arrange: Spy on the Subject's methods
    const nextSpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');

    // Act: Call the ngOnDestroy lifecycle hook
    component.ngOnDestroy();

    // Assert: Check if the Subject was completed
    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(completeSpy).toHaveBeenCalledTimes(1);
  });

});
