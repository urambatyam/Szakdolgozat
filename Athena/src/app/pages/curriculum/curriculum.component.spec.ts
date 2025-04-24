import { ComponentFixture, TestBed, fakeAsync,  flush } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { CurriculumComponent } from './curriculum.component';
import { CurriculumService } from '../../services/mysql/curriculum.service';
import { GradeService } from '../../services/mysql/grade.service';
import { AuthService } from '../../services/mysql/auth.service';
import { EventEmitter } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSelectChange } from '@angular/material/select';
import { Curriculum } from '../../models/curriculum'; 
import { Course } from '../../models/course';
import { Name } from '../../models/curriculumNames';
import { HttpErrorResponse } from '@angular/common/http';
//import 'jasmine';
import { Category } from '../../models/category';
import { Specialization } from '../../models/special';

const mockUserStudent = { id: 1, code: 'STUDENT', name: 'Test Student', email: 'student@test.com', role: 'student' as const, curriculum_id: 10 };
const mockUserOther = { id: 2, code: 'TEACHER', name: 'Test Teacher', email: 'teacher@test.com', role: 'teacher' as const, curriculum_id: null };

const authServiceMock = {
    user$: new BehaviorSubject<any>(null),
    setUser(user: any) {
        this.user$.next(user);
    },
    setError(error: any) {
        this.user$.error(error);
    },
    reset() {
        this.user$ = new BehaviorSubject<any>(null);
    }
};

const mockCurriculumNames: Name[] = [
    { id: 1, name: 'Curriculum 1' },
    { id: 2, name: 'Curriculum 2' }
];
/**Tavasz */
const mockCourse1: Course = { id: 101, subjectMatter:null, user_code:null, name: 'Math 101', kredit: 5, recommendedSemester: 1, subjectResponsible: '1234X', sezon: false, applied: false, completed: false };
/**Őssz */
const mockCourse2: Course = { id: 102, subjectMatter:null, user_code:null, name: 'Physics 101', kredit: 4, recommendedSemester: 1, subjectResponsible: '1234Y', sezon: true, applied: false, completed: false };
const mockCourse3: Course = { id: 103, subjectMatter:null, user_code:null, name: 'CompSci 101', kredit: 6, recommendedSemester: 2, subjectResponsible: '1234Z', sezon: null, applied: false, completed: true };

const mockCategory1: Category = { id:1, min:20, name: 'Mandatory', courses: [mockCourse1] };
const mockCategory2: Category = { id:1, min:20, name: 'Elective', courses: [mockCourse2, mockCourse3] };

const mockSpecialization1: Specialization = { required:true, id:1,name: 'General', categories: [mockCategory1] };
const mockSpecialization2: Specialization = { required:false, id:2,name: 'Advanced', categories: [mockCategory2] };

const mockCurriculum: Curriculum = {
    id: 10,
    name: 'Test Curriculum',
    specializations: [mockSpecialization1, mockSpecialization2]
};


const CurriculumServiceMock = {
    getAllCurriculumNames: jasmine.createSpy('getAllCurriculumNames').and.returnValue(of(mockCurriculumNames)),
    getCurriculum: jasmine.createSpy('getCurriculum').and.returnValue(of(mockCurriculum)),
};

const GradeServiceMock = {
    createGrade: jasmine.createSpy('createGrade').and.returnValue(of({ success: true, reason: '' })),
};

const translateServiceMock = {
  setDefaultLang: jasmine.createSpy('setDefaultLang'),
  use: jasmine.createSpy('use').and.returnValue(of(null)),
  get: jasmine.createSpy('get').and.callFake((key: string | string[], interpolateParams?: object) => {
      if (typeof key === 'string') {
          return of(`translated-${key}`);
      }
      const translations: { [key: string]: string } = {};
      key.forEach(k => translations[k] = `translated-${k}`);
      return of(translations);
  }),
  instant: jasmine.createSpy('instant').and.callFake((key: string) => `instant-${key}`),
  currentLang: 'hu',
  onLangChange: new EventEmitter<any>(),
  onTranslationChange: new EventEmitter<any>(),
  onDefaultLangChange: new EventEmitter<any>()
};

const snackBarMock = {
    open: jasmine.createSpy('open')
};

const routerMock = {
    navigate: jasmine.createSpy('navigate')
};

const breakpointObserverMock = {
    observe: jasmine.createSpy('observe').and.returnValue(of({ matches: false, breakpoints: {} })) 
};


describe('CurriculumComponent', () => {
    let component: CurriculumComponent;
    let fixture: ComponentFixture<CurriculumComponent>;
    let authService: AuthService;
    let curriculumService: CurriculumService;
    let gradeService: GradeService;
    let router: Router;
    let breakpointObserver: BreakpointObserver;

    beforeEach(fakeAsync(() => {
        authServiceMock.reset();
        CurriculumServiceMock.getAllCurriculumNames.calls.reset();
        CurriculumServiceMock.getCurriculum.calls.reset();
        GradeServiceMock.createGrade.calls.reset();
        translateServiceMock.instant.calls.reset();
        snackBarMock.open.calls.reset();
        routerMock.navigate.calls.reset();
        breakpointObserverMock.observe.calls.reset()
        breakpointObserverMock.observe.and.returnValue(of({ matches: false, breakpoints: {} })); 

        TestBed.configureTestingModule({
            imports: [CurriculumComponent, BrowserAnimationsModule],
            providers: [
                { provide: TranslateService, useValue: translateServiceMock },
                { provide: CurriculumService, useValue: CurriculumServiceMock },
                { provide: GradeService, useValue: GradeServiceMock },
                { provide: AuthService, useValue: authServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: MatSnackBar, useValue: snackBarMock },
                { provide: BreakpointObserver, useValue: breakpointObserverMock }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CurriculumComponent);
        component = fixture.componentInstance;

        authService = TestBed.inject(AuthService);
        curriculumService = TestBed.inject(CurriculumService);
        gradeService = TestBed.inject(GradeService);
        router = TestBed.inject(Router);
        breakpointObserver = TestBed.inject(BreakpointObserver);
    }));

    it('should create CurriculumComponent', () => {
      fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    describe('Initialization (ngOnInit)', () => {
  


        it('should handle error during user data initialization', fakeAsync(() => {
            const error = new Error('User fetch failed');
            authServiceMock.setError(error); 
            spyOn(console, 'error');

            component.ngOnInit();
            flush();

            expect(console.error).toHaveBeenCalledWith('Hiba a felhasználói adatok lekérésekor: ', error);
            expect(component['viewMode']).toBe('other'); 
            expect(component['mycurriculum']).toBeNull();
            expect(CurriculumServiceMock.getAllCurriculumNames).toHaveBeenCalled();
        }));

        it('should handle error during loading available curriculum names', fakeAsync(() => {
            const error = new Error('Names fetch failed');
            CurriculumServiceMock.getAllCurriculumNames.and.returnValue(throwError(() => error));
            authServiceMock.setUser(mockUserOther); 
            spyOn(console, 'error');
            fixture.detectChanges();
            flush();
            expect(component['viewMode']).toBe('other');
            expect(CurriculumServiceMock.getAllCurriculumNames).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith('Hiba a tantervek nevének lekérésekor: ', error);
            expect(component['curs']).toEqual([]); 
            expect(CurriculumServiceMock.getCurriculum).not.toHaveBeenCalled(); 
        }));

        it('should handle error during LoadCurriculum', fakeAsync(() => {
            const error = new HttpErrorResponse({ error: { reason: 'Curriculum not found' }, status: 404 });
            CurriculumServiceMock.getCurriculum.and.returnValue(throwError(() => error));
            authServiceMock.setUser(mockUserStudent); 
            spyOn(console, 'error');
            component.ngOnInit();
            flush();
            expect(CurriculumServiceMock.getCurriculum).toHaveBeenCalledWith(mockUserStudent.curriculum_id, undefined);
            expect(console.error).toHaveBeenCalledWith(`Hiba a(z) ${mockUserStudent.curriculum_id} ID-jű tanterv betöltésekor: `, error);
            expect(component['tanterv']).toBeNull();
            expect(component['curriculumName']).toBe("");
            expect(component['specialsVis'].size).toBe(1);
            expect(component['specialsVis'].get('összes')).toBeTrue();
            expect(component['katsVis'].size).toBe(1);
            expect(component['katsVis'].get('összes')).toBeTrue();
            expect(component['coursesVis'].size).toBe(1);
            expect(component['coursesVis'].get('összes')).toBe(-1);
        }));

        it('should initialize displayed columns based on screen size (wide)', fakeAsync(() => {
            breakpointObserverMock.observe.and.returnValue(of({ matches: false, breakpoints: {} })); 
            authServiceMock.setUser(mockUserStudent);
            component.ngOnInit();
            flush();
            const expectedColumns = ['name', 'id', 'kredit', 'recommendedSemester', 'subjectResponsible', 'sezon', 'apply', 'course'];
            expect(component['displayedColumns']).toEqual(expectedColumns);
        }));

        it('should initialize displayed columns based on screen size (narrow)', fakeAsync(() => {
            breakpointObserverMock.observe.and.returnValue(of({ matches: true, breakpoints: {} })); 
            authServiceMock.setUser(mockUserStudent);
            component.ngOnInit();
            flush();

            const expectedColumns = ['name', 'apply', 'course'];
            expect(component['displayedColumns']).toEqual(expectedColumns);
        }));
    });

    describe('Navigation', () => {
        it('should navigate to course forum with course data', () => {
            component['toCourseForm'](mockCourse1);
            expect(routerMock.navigate).toHaveBeenCalledWith(
                ['/forum'],
                { state: { course: mockCourse1 } }
            );
        });
    });

    describe('Applying for Course', () => {
        beforeEach(() => {
            jasmine.clock().install();
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it('should successfully apply for a course in the correct semester (autumn)', fakeAsync(() => {
            jasmine.clock().mockDate(new Date(2024, 9, 15)); 

            component['apply'](mockCourse2);
            flush();

            expect(GradeServiceMock.createGrade).toHaveBeenCalledWith(mockCourse2.id);
            expect(mockCourse2.applied).toBeTrue();
            expect(mockCourse2.completed).toBeFalse(); 
        }));

        it('should successfully apply for a course in the correct semester (spring)', fakeAsync(() => {
            jasmine.clock().mockDate(new Date(2024, 3, 15)); 

            component['apply'](mockCourse1);
            flush();

            expect(GradeServiceMock.createGrade).toHaveBeenCalledWith(mockCourse1.id);
            expect(mockCourse1.applied).toBeTrue();
        }));

        it('should successfully apply for a course with null sezon (any semester)', fakeAsync(() => {
            const courseToApply = { ...mockCourse3, sezon: null }; 
            jasmine.clock().mockDate(new Date(2024, 9, 15)); 

            component['apply'](courseToApply);
            flush();

            expect(GradeServiceMock.createGrade).toHaveBeenCalledWith(courseToApply.id);
            expect(courseToApply.applied).toBeTrue();
        }));

        it('should NOT apply for a course in the wrong semester (autumn course in spring)', fakeAsync(() => {
            const courseToTest = { ...mockCourse2, applied: false };
            jasmine.clock().mockDate(new Date(2024, 3, 15)); 
            component['apply'](courseToTest);
            flush();
            expect(GradeServiceMock.createGrade).not.toHaveBeenCalled();
            expect(courseToTest.applied).toBeFalse(); 
        }));
        it('should NOT apply for a course in the wrong semester (spring course in autumn)', fakeAsync(() => {
          const courseToTest = { ...mockCourse1, applied: false };
          jasmine.clock().mockDate(new Date(2024, 11, 15)); 
          component['apply'](courseToTest);
          flush();
          expect(GradeServiceMock.createGrade).not.toHaveBeenCalled();
          expect(courseToTest.applied).toBeFalse(); 
        }));
        it('should not apply if course ID is missing', fakeAsync(() => {
            const courseWithoutId = { ...mockCourse1, id: undefined, sezon: 0 };
            spyOn(console, 'warn');
            jasmine.clock().mockDate(new Date(2024, 9, 15));

            component['apply'](courseWithoutId as any); 
            flush();

            expect(console.warn).toHaveBeenCalledWith("Cannot apply for course: Course ID is missing.");
            expect(GradeServiceMock.createGrade).not.toHaveBeenCalled();
        }));
    });

    describe('Filtering', () => {
        beforeEach(fakeAsync(() => {
            authServiceMock.setUser(mockUserStudent); 
            CurriculumServiceMock.getCurriculum.and.returnValue(of(mockCurriculum));
            component.ngOnInit();
            flush();
            expect(component['tanterv']).toEqual(mockCurriculum);
        }));

        it('should filter by category (KatonSelectionChange)', () => {
            expect(component['katsVis'].get('Mandatory')).toBeTrue();
            expect(component['katsVis'].get('Elective')).toBeTrue();
            expect(component['katsVis'].get('összes')).toBeTrue();

            const event = { value: 'Mandatory' } as MatSelectChange;
            component.KatonSelectionChange(event);

            expect(component['katsVis'].get('Mandatory')).toBeTrue();
            expect(component['katsVis'].get('Elective')).toBeFalse();
            expect(component['katsVis'].get('összes')).toBeTrue(); 

            const eventAll = { value: 'összes' } as MatSelectChange;
            component.KatonSelectionChange(eventAll);

            expect(component['katsVis'].get('Mandatory')).toBeTrue();
            expect(component['katsVis'].get('Elective')).toBeTrue();
            expect(component['katsVis'].get('összes')).toBeTrue();
        });

        it('should filter by specialization (SpeconSelectionChange)', () => {
            expect(component['specialsVis'].get('General')).toBeTrue();
            expect(component['specialsVis'].get('Advanced')).toBeTrue();
            expect(component['katsVis'].has('Mandatory')).toBeTrue(); 
            expect(component['katsVis'].has('Elective')).toBeTrue();
            expect(component['visKat']).toBeFalse(); 
            const event = { value: 'Advanced' } as MatSelectChange;
            component.SpeconSelectionChange(event);
            expect(component['specialsVis'].get('General')).toBeFalse();
            expect(component['specialsVis'].get('Advanced')).toBeTrue();
            expect(component['specialsVis'].get('összes')).toBeTrue();
            expect(component['katsVis'].has('Mandatory')).toBeFalse();
            expect(component['katsVis'].has('Elective')).toBeTrue(); 
            expect(component['katsVis'].get('összes')).toBeTrue();
            expect(component['visKat']).toBeTrue(); 
            const eventAll = { value: 'összes' } as MatSelectChange;
            component.SpeconSelectionChange(eventAll);
            expect(component['specialsVis'].get('General')).toBeTrue();
            expect(component['specialsVis'].get('Advanced')).toBeTrue();
            expect(component['katsVis'].has('Mandatory')).toBeTrue();
            expect(component['katsVis'].has('Elective')).toBeTrue();
            expect(component['visKat']).toBeFalse();
        });

        it('should reload curriculum on curriculum change (CuronSelectionChange)', fakeAsync(() => {
            const newCurriculumId = 2; 
            const event = { value: newCurriculumId } as MatSelectChange;
            CurriculumServiceMock.getCurriculum.calls.reset(); 
            component.CuronSelectionChange(event);
            flush();
            expect(CurriculumServiceMock.getCurriculum).toHaveBeenCalledOnceWith(newCurriculumId, undefined);
        }));

        it('should reload curriculum with course filter (CouronSelectionChange)', fakeAsync(() => {
            const currentCurriculumId = component['tanterv']?.id;
            const selectedCourseId = mockCourse2.id; 
            const event = { value: selectedCourseId } as MatSelectChange;
            CurriculumServiceMock.getCurriculum.calls.reset();
            component.CouronSelectionChange(event);
            flush();
            expect(CurriculumServiceMock.getCurriculum).toHaveBeenCalledOnceWith(currentCurriculumId, selectedCourseId);
        }));

        it('should reload curriculum without course filter if "összes" is selected (CouronSelectionChange)', fakeAsync(() => {
            const currentCurriculumId = component['tanterv']?.id;
            const selectedCourseId = -1; 
            const event = { value: selectedCourseId } as MatSelectChange;
            CurriculumServiceMock.getCurriculum.calls.reset();
            component.CouronSelectionChange(event);
            flush();
            expect(CurriculumServiceMock.getCurriculum).toHaveBeenCalledOnceWith(currentCurriculumId, null); 
        }));

        it('should not filter courses if no curriculum is loaded (CouronSelectionChange)', fakeAsync(() => {
            component['tanterv'] = null; 
            const selectedCourseId = mockCourse2.id;
            const event = { value: selectedCourseId } as MatSelectChange;
            CurriculumServiceMock.getCurriculum.calls.reset();
            spyOn(console, 'warn');
            component.CouronSelectionChange(event);
            flush();
            expect(CurriculumServiceMock.getCurriculum).not.toHaveBeenCalled();
            expect(console.warn).toHaveBeenCalledWith("Cannot filter courses, no curriculum loaded.");
        }));
    });

    describe('Column Management', () => {
      beforeEach(fakeAsync(() => {
          authServiceMock.setUser(mockUserStudent); 
          fixture.detectChanges();
          flush(); 
      }));

      it('should update task signal and displayed columns on column selection change', fakeAsync(() => { 
          const initialAvailableOptions = component['availableColumnOptions']();
          const initialColumns = initialAvailableOptions.map(opt => opt.name);
          expect(initialAvailableOptions.length).toBeGreaterThan(0); 
          expect(initialColumns.length).toEqual(initialAvailableOptions.length);
          component['selectedColumnNames'] = initialColumns; 
          component['updateDisplayedColumns'](); 
          const initialDisplayed = [...component['displayedColumns']];
          expect(initialDisplayed.length).toEqual(initialAvailableOptions.length); 
          const kreditOptionName = translateServiceMock.instant('curriculum.KREDIT');
          const kreditOption = initialAvailableOptions.find(opt => opt.name === kreditOptionName);
          expect(kreditOption).toBeDefined(); 
          const newSelection = initialColumns.filter(name => name !== kreditOptionName);
          const event = { value: newSelection } as MatSelectChange;
          component.onColumnSelectionChange(event);
          const taskAfterChange = component['task']();
          const kreditSubtask = taskAfterChange.subtasks?.find(st => st.key === 'kredit');
          expect(kreditSubtask).withContext("Subtask with key 'kredit' should exist").toBeDefined();
          expect(kreditSubtask?.completed).withContext("Subtask 'kredit' should be marked as not completed").toBeFalse();
          expect(component['selectedColumnNames']).toEqual(newSelection);
          expect(component['displayedColumns']).not.toContain('kredit');
          expect(component['displayedColumns'].length).withContext("Displayed columns length should decrease by 1").toBe(initialDisplayed.length - 1);
      }));
  });
    describe('Cleanup (ngOnDestroy)', () => {
        it('should complete the destroy$ subject', () => {
            const destroySubject = component['destroy$'];
            spyOn(destroySubject, 'next');
            spyOn(destroySubject, 'complete');
            component.ngOnDestroy();
            expect(destroySubject.next).toHaveBeenCalledTimes(1);
            expect(destroySubject.complete).toHaveBeenCalledTimes(1);
        });
    });
});
