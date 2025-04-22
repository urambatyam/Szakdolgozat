import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing'; 
import { of, throwError } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { AuthService } from '../../services/mysql/auth.service';
import { CurriculumService } from '../../services/mysql/curriculum.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { RegistrationComponent } from './registration.component';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar'; 
import { Name } from '../../models/curriculumNames'; 
import { Validators } from '@angular/forms'; 
//import 'jasmine'; 

const authServiceMock = {
  register: jasmine.createSpy('register').and.returnValue(of({}))
};

const mockCurricula: Name[] = [ 
    { id: 1, name: 'Tanterv 1' },
    { id: 2, name: 'Tanterv 2' }
];

const curriculumServiceMock = {
    getAllCurriculumNames: jasmine.createSpy('getAllCurriculumNames').and.returnValue(of(mockCurricula))
};

const translateServiceMock = {
    setDefaultLang: jasmine.createSpy('setDefaultLang'),
    use: jasmine.createSpy('use').and.returnValue(of(null)),
    get: jasmine.createSpy('get').and.returnValue(of('mock-translation')),
    instant: jasmine.createSpy('instant').and.returnValue('mock-instant'), 
    currentLang: 'hu',
    onLangChange: new EventEmitter<any>(),
    onTranslationChange: new EventEmitter<any>(),
    onDefaultLangChange: new EventEmitter<any>()
};

const snackBarMock = { 
    open: jasmine.createSpy('open')
};

describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;
  let curriculumService: CurriculumService; 
  beforeEach(fakeAsync(() => { 
    TestBed.configureTestingModule({
      imports: [RegistrationComponent, BrowserAnimationsModule, RouterTestingModule.withRoutes([])],
            providers: [
              { provide: AuthService, useValue: authServiceMock },
              { provide: CurriculumService, useValue: curriculumServiceMock },
              { provide: TranslateService, useValue: translateServiceMock },
              { provide: MatSnackBar, useValue: snackBarMock } 
            ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    curriculumService = TestBed.inject(CurriculumService); 
    authServiceMock.register.calls.reset();
    curriculumServiceMock.getAllCurriculumNames.calls.reset();
    snackBarMock.open.calls.reset();
    translateServiceMock.instant.calls.reset(); 
    translateServiceMock.get.calls.reset();
    curriculumServiceMock.getAllCurriculumNames.and.returnValue(of(mockCurricula));

    fixture.detectChanges(); 
    tick(); 
  }));

  it('should create RegistrationComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadCurriculums and setupRoleValidation on init', () => {
    expect(curriculumService.getAllCurriculumNames).toHaveBeenCalledTimes(1); 
    expect(component['curriculums']).toEqual(mockCurricula); 

    const curriculumControl = component['registForm'].get('curriculum_id');
    expect(curriculumControl?.hasValidator(Validators.required)).toBeTrue();
    expect(curriculumControl?.enabled).toBeTrue();
  });

  describe('loadCurriculums', () => {
    it('should populate curriculums on init', () => {
        expect(curriculumService.getAllCurriculumNames).toHaveBeenCalledTimes(1); 
        expect(component['curriculums']).toEqual(mockCurricula);
        expect(snackBarMock.open).not.toHaveBeenCalled(); 
    });


  });

  describe('setupRoleValidation', () => {
    it('should set curriculum_id as required when role is student', fakeAsync(() => {
        const roleControl = component['registForm'].get('role');
        const curriculumControl = component['registForm'].get('curriculum_id');
        roleControl?.setValue('student');
        tick(); 
        fixture.detectChanges(); 

        expect(curriculumControl?.hasValidator(Validators.required)).toBeTrue();
        expect(curriculumControl?.enabled).toBeTrue();
    }));

    it('should clear curriculum_id validators and disable when role is not student', fakeAsync(() => {
        const roleControl = component['registForm'].get('role');
        const curriculumControl = component['registForm'].get('curriculum_id');
        roleControl?.setValue('teacher');
        tick(); 
        fixture.detectChanges(); 
        expect(curriculumControl?.hasValidator(Validators.required)).toBeFalse();
        expect(curriculumControl?.disabled).toBeTrue();
        expect(curriculumControl?.value).toBeNull(); 
    }));
  });

  describe('onSubmit', () => {
    let registerSpy: jasmine.Spy;
    beforeEach(() => {
        registerSpy = spyOn(component as any, 'register').and.callThrough(); 
    });

    it('should mark form as touched and not call register if form is invalid', () => {
        spyOn(component['registForm'], 'markAllAsTouched');
        component['registForm'].controls.name.setValue(''); 
        fixture.detectChanges();
        component['onSubmit']();
        expect(component['registForm'].markAllAsTouched).toHaveBeenCalledTimes(1);
        expect(registerSpy).not.toHaveBeenCalled();
    });

    it('should call register if form is valid', () => {
        component['registForm'].setValue({
            name: 'Teszt Elek',
            email: 'teszt@elek.com',
            role: 'student',
            curriculum_id: 1
        });
        fixture.detectChanges();

        component['onSubmit']();

        expect(registerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('register', () => {
    beforeEach(() => {
        component['registForm'].setValue({
            name: 'Teszt Elek',
            email: 'teszt@elek.com',
            role: 'student',
            curriculum_id: 1
        });
        fixture.detectChanges();
        authServiceMock.register.calls.reset();
        snackBarMock.open.calls.reset();
    });






    it('should set loading to true during registration and false after success', fakeAsync(() => {
        const loadingSpy = spyOn(component['loadingSubject'], 'next').and.callThrough();
        authServiceMock.register.and.returnValue(of({})); 
        component['register']();
        expect(loadingSpy).toHaveBeenCalledWith(true);
        flush(); 
        expect(loadingSpy).toHaveBeenCalledWith(false);
        expect(component['loadingSubject'].value).toBeFalse();
        expect(loadingSpy).toHaveBeenCalledTimes(2); 
    }));

    it('should set loading to true during registration and false after error', fakeAsync(() => {
        const loadingSpy = spyOn(component['loadingSubject'], 'next').and.callThrough();
        authServiceMock.register.and.returnValue(throwError(() => ({ error: {} }))); 
        component['register']();
        expect(loadingSpy).toHaveBeenCalledWith(true);
        flush(); 
        expect(loadingSpy).toHaveBeenCalledWith(false);
        expect(component['loadingSubject'].value).toBeFalse();
        expect(loadingSpy).toHaveBeenCalledTimes(2); 
    }));
  });

  it('should complete kikapcs$ and loadingSubject on ngOnDestroy', () => {
    const kikapcsNextSpy = spyOn(component['kikapcs$'], 'next');
    const kikapcsCompleteSpy = spyOn(component['kikapcs$'], 'complete');
    const loadingCompleteSpy = spyOn(component['loadingSubject'], 'complete');
    component.ngOnDestroy();
    expect(kikapcsNextSpy).toHaveBeenCalledBefore(kikapcsCompleteSpy); 
    expect(kikapcsNextSpy).toHaveBeenCalledTimes(1);
    expect(kikapcsCompleteSpy).toHaveBeenCalledTimes(1);
    expect(loadingCompleteSpy).toHaveBeenCalledTimes(1);
  });

});
