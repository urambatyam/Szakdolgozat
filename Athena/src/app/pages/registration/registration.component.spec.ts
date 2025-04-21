import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'; // Import fakeAsync and tick
import { of, throwError } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { AuthService } from '../../services/mysql/auth.service';
import { CurriculumService } from '../../services/mysql/curriculum.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { RegistrationComponent } from './registration.component';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Import MatSnackBar and MatSnackBarModule
import { Name } from '../../models/curriculumNames'; // Import Name type
import { Validators } from '@angular/forms'; // Import Validators
//import 'jasmine';
// Mocks
const authServiceMock = {
  register: jasmine.createSpy('register').and.returnValue(of({}))
};

const mockCurricula: Name[] = [ // Mock data for curricula
    { id: 1, name: 'Tanterv 1' },
    { id: 2, name: 'Tanterv 2' }
];

const curriculumServiceMock = {
    getAllCurriculumNames: jasmine.createSpy('getAllCurriculumNames').and.returnValue(of(mockCurricula)) // Return mock data
};

const translateServiceMock = {
    setDefaultLang: jasmine.createSpy('setDefaultLang'),
    use: jasmine.createSpy('use').and.returnValue(of(null)),
    get: jasmine.createSpy('get').and.returnValue(of('mock-translation')),
    currentLang: 'hu',
    onLangChange: new EventEmitter<any>(),
    onTranslationChange: new EventEmitter<any>(),
    onDefaultLangChange: new EventEmitter<any>()
};

const snackBarMock = { // Mock MatSnackBar
    open: jasmine.createSpy('open')
};

describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;
  let snackBar: MatSnackBar; // Declare snackBar variable

  beforeEach(fakeAsync(() => { // Use fakeAsync for async operations
    TestBed.configureTestingModule({
      // Import MatSnackBarModule here because the component uses MatSnackBar
      imports: [RegistrationComponent, BrowserAnimationsModule, RouterTestingModule.withRoutes([]), MatSnackBarModule],
            providers: [
              { provide: AuthService, useValue: authServiceMock },
              { provide: CurriculumService, useValue: curriculumServiceMock },
              { provide: TranslateService, useValue: translateServiceMock },
              { provide: MatSnackBar, useValue: snackBarMock } // Provide the mock snackBar
            ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    snackBar = TestBed.inject(MatSnackBar); // Inject MatSnackBar

    // Reset mocks before each test
    authServiceMock.register.calls.reset();
    curriculumServiceMock.getAllCurriculumNames.calls.reset();
    snackBarMock.open.calls.reset();

    // Spy on component methods *before* detectChanges/ngOnInit runs if needed
    spyOn(component as any, 'loadCurriculums').and.callThrough();
    spyOn(component as any, 'setupRoleValidation').and.callThrough();
    spyOn(component as any, 'register').and.callThrough(); // Spy on register

    fixture.detectChanges(); // This triggers ngOnInit
    tick(); // Complete async operations like loading curricula in ngOnInit
  }));

  it('should create RegistrationComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadCurriculums and setupRoleValidation on init', () => {
    // ngOnInit is called by detectChanges in beforeEach
    expect((component as any).loadCurriculums).toHaveBeenCalledTimes(1);
    expect((component as any).setupRoleValidation).toHaveBeenCalledTimes(1);
  });

  describe('loadCurriculums', () => {
    it('should call getAllCurriculumNames and populate curriculums', fakeAsync(() => {
        // Reset the mock call count as it was called during ngOnInit
        curriculumServiceMock.getAllCurriculumNames.calls.reset();
        // Manually call loadCurriculums again to test it in isolation
        (component as any).loadCurriculums();
        tick(); // Allow the firstValueFrom to resolve

        expect(curriculumServiceMock.getAllCurriculumNames).toHaveBeenCalledTimes(1);
        expect(component['curriculums']).toEqual(mockCurricula);
        expect(snackBarMock.open).not.toHaveBeenCalled();
    }));

    it('should show snackbar on error during loading curricula', fakeAsync(() => {
        curriculumServiceMock.getAllCurriculumNames.and.returnValue(throwError(() => new Error('Failed to load')));
        // Reset the mock call count as it was called during ngOnInit
        curriculumServiceMock.getAllCurriculumNames.calls.reset();

        (component as any).loadCurriculums();
        tick(); // Allow the firstValueFrom to reject

        expect(curriculumServiceMock.getAllCurriculumNames).toHaveBeenCalledTimes(1);
        expect(component['curriculums']).toEqual([]); // Should remain empty or initial value
        expect(snackBarMock.open).toHaveBeenCalledWith('Hiba történt a tantervek betöltésekor!', 'OK', { duration: 3000 });
    }));
  });

  describe('setupRoleValidation', () => {
    it('should set curriculum_id as required when role is student', fakeAsync(() => {
        const roleControl = component['registForm'].get('role');
        const curriculumControl = component['registForm'].get('curriculum_id');

        roleControl?.setValue('student');
        tick(); // Allow valueChanges subscription to trigger

        expect(curriculumControl?.hasValidator(Validators.required)).toBeTrue();
        expect(curriculumControl?.enabled).toBeTrue();
    }));

    it('should clear curriculum_id validators and disable when role is not student', fakeAsync(() => {
        const roleControl = component['registForm'].get('role');
        const curriculumControl = component['registForm'].get('curriculum_id');

        // First set to student to ensure validators are added
        roleControl?.setValue('student');
        tick();
        expect(curriculumControl?.hasValidator(Validators.required)).toBeTrue();

        // Then change to teacher
        roleControl?.setValue('teacher');
        tick(); // Allow valueChanges subscription to trigger

        expect(curriculumControl?.hasValidator(Validators.required)).toBeFalse();
        expect(curriculumControl?.disabled).toBeTrue();
        expect(curriculumControl?.value).toBeNull(); // Should be reset
    }));
  });

  describe('onSubmit', () => {
    it('should mark form as touched and not call register if form is invalid', () => {
        spyOn(component['registForm'], 'markAllAsTouched');
        component['registForm'].controls.name.setValue(''); // Make form invalid

        component['onSubmit']();

        expect(component['registForm'].markAllAsTouched).toHaveBeenCalledTimes(1);
        expect((component as any).register).not.toHaveBeenCalled();
    });

    it('should call register if form is valid', () => {
        component['registForm'].setValue({
            name: 'Teszt Elek',
            email: 'teszt@elek.com',
            role: 'student',
            curriculum_id: 1
        });

        component['onSubmit']();

        expect((component as any).register).toHaveBeenCalledTimes(1);
    });
  });

  describe('register', () => {
    beforeEach(() => {
        // Ensure form is valid before testing register directly or via onSubmit
        component['registForm'].setValue({
            name: 'Teszt Elek',
            email: 'teszt@elek.com',
            role: 'student',
            curriculum_id: 1
        });
    });

    it('should call authService.register with form values and show success snackbar', fakeAsync(() => {
        const expectedData = component['registForm'].getRawValue();
        authServiceMock.register.and.returnValue(of({ message: 'Success' })); // Mock successful response

        component['register']();
        tick(); // Allow firstValueFrom and finalize to complete

        expect(authServiceMock.register).toHaveBeenCalledOnceWith(expectedData);
        expect(snackBarMock.open).toHaveBeenCalledWith('Successful registration!', 'OK', { duration: 3000 });
        expect(component['loadingSubject'].value).toBeFalse(); // Check loading state
    }));

    it('should show error snackbar if authService.register fails', fakeAsync(() => {
        const expectedData = component['registForm'].getRawValue();
        const errorResponse = { error: { message: 'Registration Error' } };
        authServiceMock.register.and.returnValue(throwError(() => errorResponse));

        component['register']();
        tick(); // Allow firstValueFrom, catchError, and finalize to complete

        expect(authServiceMock.register).toHaveBeenCalledOnceWith(expectedData);
        expect(snackBarMock.open).toHaveBeenCalledWith('Registration Error', 'OK', { duration: 3000 });
        expect(component['loadingSubject'].value).toBeFalse(); // Check loading state
    }));

     it('should show generic error snackbar if error message is missing', fakeAsync(() => {
        const expectedData = component['registForm'].getRawValue();
        const errorResponse = { error: {} }; // Error without message property
        authServiceMock.register.and.returnValue(throwError(() => errorResponse));

        component['register']();
        tick(); // Allow firstValueFrom, catchError, and finalize to complete

        expect(authServiceMock.register).toHaveBeenCalledOnceWith(expectedData);
        expect(snackBarMock.open).toHaveBeenCalledWith('Registration failed!', 'OK', { duration: 3000 });
        expect(component['loadingSubject'].value).toBeFalse(); // Check loading state
    }));

    it('should set loading to true during registration and false after', fakeAsync(() => {
        const loadingSpy = spyOn(component['loadingSubject'], 'next').and.callThrough();
        authServiceMock.register.and.returnValue(of({}).pipe()); // Use pipe to delay completion slightly if needed, though tick handles it

        component['register']();

        // Check if loading was set to true
        expect(loadingSpy).toHaveBeenCalledWith(true);

        tick(); // Complete the async operation

        // Check if loading was set back to false in finalize
        expect(loadingSpy).toHaveBeenCalledWith(false);
        expect(component['loadingSubject'].value).toBeFalse();
    }));
  });

});
