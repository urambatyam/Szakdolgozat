import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ElectronicControllerComponent } from './electronic-controller.component';
import { EventEmitter } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { GradeService } from '../../services/mysql/grade.service';
import { AuthService } from '../../services/mysql/auth.service';
import { Location } from '@angular/common';
import { Grade, GradeApiResponse } from '../../models/grade';
import { Semester } from '../../models/semester';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MatSelectChange } from '@angular/material/select';
//import 'jasmine';


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

const mockGradesResponse: GradeApiResponse = {
    grades: {
        current_page: 1,
        data: [
            { id: 1, user_code: 'S123', course_name: 'Test Course 1', grade: 5, course_id: 101 },
            { id: 2, user_code: 'S456', course_name: 'Test Course 1', grade: 4, course_id: 101 },
        ],
        total: 2,
        per_page: 10
    },
    semesters: [
        {  year: 2023, sezon: true, current: true  },
        {  year: 2023, sezon: false, current: false}
    ]
};

const GradeServiceMock = {
    deleteGrade: jasmine.createSpy('deleteGrade').and.returnValue(of(null)),
    updateGrade: jasmine.createSpy('updateGrade').and.returnValue(of(null)),
    getAllGradesInCourse: jasmine.createSpy('getAllGradesInCourse').and.returnValue(of(mockGradesResponse)),
    getAllGradesOFStudent: jasmine.createSpy('getAllGradesOFStudent').and.returnValue(of(mockGradesResponse))
};

const authServiceMock = {
    user$: new BehaviorSubject<any>(null),
    setUser(user: any) {
        this.user$.next(user);
    },
    setError(error: any) {
        this.user$ = new BehaviorSubject<any>(null); 
        spyOn(this.user$, 'pipe').and.returnValue(throwError(() => error));
    },
    reset() {
        this.user$ = new BehaviorSubject<any>(null);
        const spy = this.user$.pipe as jasmine.Spy;
        if (spy && spy.and) {
           spy.and.callThrough(); 
        }
    }
};

const locationMock = {
    back: jasmine.createSpy('back')
};

describe('ElectronicControllerComponent', () => {
    let component: ElectronicControllerComponent;
    let fixture: ComponentFixture<ElectronicControllerComponent>;
    let gradeService: GradeService;
    let authService: AuthService;
    let location: Location;

    const studentUser = { code: 'TEST123', role: 'student' };
    const teacherUser = { code: 'TEACHER', role: 'teacher' }; 

    beforeEach(async () => {
        authServiceMock.reset();
        GradeServiceMock.deleteGrade.calls.reset();
        GradeServiceMock.updateGrade.calls.reset();
        GradeServiceMock.getAllGradesInCourse.calls.reset()
        GradeServiceMock.getAllGradesInCourse.and.returnValue(of(mockGradesResponse)); 
        GradeServiceMock.getAllGradesOFStudent.calls.reset()
        GradeServiceMock.getAllGradesOFStudent.and.returnValue(of(mockGradesResponse));
        locationMock.back.calls.reset();

        await TestBed.configureTestingModule({
            imports: [ElectronicControllerComponent, BrowserAnimationsModule],
            providers: [
                { provide: TranslateService, useValue: translateServiceMock },
                { provide: GradeService, useValue: GradeServiceMock },
                { provide: AuthService, useValue: authServiceMock },
                { provide: Location, useValue: locationMock }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ElectronicControllerComponent);
        component = fixture.componentInstance;
        gradeService = TestBed.inject(GradeService);
        authService = TestBed.inject(AuthService);
        location = TestBed.inject(Location);
        spyOn(history, 'state').and.returnValue({ courseId: 101, courseName: 'Test Course 1' });
    });

    it('should create ElectronicControllerComponent', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should set viewMode to "student" and studentCode for student user', fakeAsync(() => {
            authServiceMock.setUser(studentUser);
            fixture.detectChanges(); 
            tick(); 
            expect(component['viewMode']).toBe('student');
            expect(component['studentCode']).toBe(studentUser.code);
            expect(component['title']).toBe('Ellenőrző');
            expect(component['displayedColumns']).toEqual(['course_name', 'grade']);
            expect(component['columnsToDisplayWithExpand']).toEqual(['course_name', 'grade', 'remove']);
            expect(gradeService.getAllGradesOFStudent).toHaveBeenCalled();
        }));

        it('should handle error during user fetch and default to student view (or handle appropriately)', fakeAsync(() => {
            const error = new Error('Auth failed');
            spyOn(authService.user$, 'pipe').and.returnValue(throwError(() => error));
            fixture.detectChanges();
            tick();
            expect(component['viewMode']).toBe('student'); 
            expect(gradeService.getAllGradesInCourse).not.toHaveBeenCalled();
            expect(gradeService.getAllGradesOFStudent).not.toHaveBeenCalled();
        }));

         it('should call location.back() on general initialization error', fakeAsync(() => {
            authServiceMock.setUser(studentUser);
            spyOn(component as any, 'getGrades').and.throwError('GetGrades failed'); 
            fixture.detectChanges(); 
            tick();
            expect(location.back).toHaveBeenCalled();
        }));
    });

    describe('getGrades', () => {
        beforeEach(fakeAsync(() => {
            authServiceMock.setUser(studentUser);
            fixture.detectChanges();
            tick();
            GradeServiceMock.getAllGradesOFStudent.calls.reset();
            GradeServiceMock.getAllGradesInCourse.calls.reset();
        }));

        it('should call getAllGradesOFStudent for student view', fakeAsync(() => {
            component['viewMode'] = 'student';
            component['studentCode'] = 'S123';
            (component as any).getGrades(); 
            tick();
            expect(gradeService.getAllGradesOFStudent).toHaveBeenCalled();
            expect(gradeService.getAllGradesInCourse).not.toHaveBeenCalled();
        }));

        it('should call getAllGradesInCourse for course view', fakeAsync(() => {
            component['viewMode'] = 'course';
            component['courseId'] = 101;
            (component as any).getGrades();
            tick();
            expect(gradeService.getAllGradesInCourse).toHaveBeenCalled();
            expect(gradeService.getAllGradesOFStudent).not.toHaveBeenCalled();
        }));

        it('should pass correct parameters to grade service', fakeAsync(() => {
            component['viewMode'] = 'student';
            component['studentCode'] = 'S123';
            component['currentPage'] = 1;
            component['pageSize'] = 20;
            component['sortField'] = 'grade';
            component['sortDirection'] = 'desc';
            component['filterValue'] = 'test';
            component['selectedSemester'] = {  year: 2023, sezon: true, current: true };
            (component as any).getGrades();
            tick();
            const expectedParams = {
                page: 2, 
                per_page: 20,
                sort_field: 'grade',
                sort_direction: 'desc',
                filter: 'test',
                year: 2023,
                sezon: true
            };
            expect(gradeService.getAllGradesOFStudent).toHaveBeenCalledWith('S123', expectedParams);
        }));

        it('should update grades, semesters, totalItems, and currentSemester on success', fakeAsync(() => {
            component['viewMode'] = 'student';
            component['studentCode'] = 'S123';
            (component as any).getGrades();
            tick();
            expect(component['grades']).toEqual(mockGradesResponse.grades.data);
            expect(component['semesters']).toEqual(mockGradesResponse.semesters);
            expect(component['totalItems']).toEqual(mockGradesResponse.grades.total);
            expect(component['currentSemester']).toEqual(mockGradesResponse.semesters.find(s => s.current) ?? null);
        }));

   
    });

    describe('User Actions', () => {
        let testGrade: Grade;
        beforeEach(fakeAsync(() => {
            authServiceMock.setUser(teacherUser);
            fixture.detectChanges();
            tick();
            testGrade = { id: 5, user_code: 'S789', course_name: 'Test Course 1', grade: 3, course_id: 101 };
            component['grades'] = [testGrade]; 
            GradeServiceMock.getAllGradesInCourse.calls.reset();
            GradeServiceMock.deleteGrade.calls.reset();
            GradeServiceMock.updateGrade.calls.reset();
            spyOn(component as any, 'getGrades').and.callThrough(); 
        }));

        it('remove() should call deleteGrade and getGrades in course view', fakeAsync(() => {
            component['viewMode'] = 'course'; 
            component['remove'](testGrade);
            tick();
            expect(gradeService.deleteGrade).toHaveBeenCalledWith(testGrade.id ?? 0);
            expect((component as any).getGrades).toHaveBeenCalled();
        }));

        it('remove() should NOT call deleteGrade if viewMode is student', fakeAsync(() => {
            component['viewMode'] = 'student';
            component['remove'](testGrade);
            tick();
            expect(gradeService.deleteGrade).not.toHaveBeenCalled();
            expect((component as any).getGrades).not.toHaveBeenCalled(); 
        }));

        it('update() should call updateGrade with correct data in course view', fakeAsync(() => {
            component['viewMode'] = 'course';
            component['courseId'] = 101;
            component['expandedElement'] = testGrade; 
            const selectedGrade = 5;
            const expectedUpdatedGrade: Grade = { ...testGrade, grade: selectedGrade };
            GradeServiceMock.updateGrade.and.returnValue(of(expectedUpdatedGrade)); 
            component['update'](selectedGrade, testGrade);
            tick();
            expect(gradeService.updateGrade).toHaveBeenCalledWith(expectedUpdatedGrade);
            expect(testGrade.grade).toBe(selectedGrade); 
            expect(component['expandedElement']).toBeNull(); 
        }));

         it('update() should handle "ø" selection correctly', fakeAsync(() => {
            component['viewMode'] = 'course';
            component['courseId'] = 101;
            component['expandedElement'] = testGrade;
            const selectedGrade = 'ø';
            const expectedUpdatedGrade: Grade = { ...testGrade, grade: null }; 
            GradeServiceMock.updateGrade.and.returnValue(of(expectedUpdatedGrade));
            component['update'](selectedGrade, testGrade);
            tick();
            expect(gradeService.updateGrade).toHaveBeenCalledWith(expectedUpdatedGrade);
            expect(testGrade.grade).toBeNull();
            expect(component['expandedElement']).toBeNull();
        }));

        it('update() should NOT call updateGrade if viewMode is student', fakeAsync(() => {
            component['viewMode'] = 'student';
            component['update'](5, testGrade);
            tick();
            expect(gradeService.updateGrade).not.toHaveBeenCalled();
        }));

         it('update() should handle API error during update', fakeAsync(() => {
            component['viewMode'] = 'course';
            component['courseId'] = 101;
            component['expandedElement'] = testGrade; 
            const originalGrade = testGrade.grade;
            const error = new Error('Update failed');
            GradeServiceMock.updateGrade.and.returnValue(throwError(() => error));
            spyOn(console, 'error');
            component['update'](5, testGrade);
            tick(); 
            expect(gradeService.updateGrade).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith('Hiba a jegy frissítésekor (API):', error);
            expect(console.error).toHaveBeenCalledWith('Hiba a jegy frissítésekor:', jasmine.any(Error)); 
            expect(testGrade.grade).toBe(originalGrade); 
            expect(component['expandedElement']).toBe(testGrade); 
        }));

        it('GradeSelectionChange() should call update', () => {
            spyOn(component as any, 'update');
            const mockEvent = { value: 4 } as MatSelectChange;
            component['GradeSelectionChange'](mockEvent, testGrade);
            expect(component['update']).toHaveBeenCalledWith(4, testGrade);
        });

        it('back() should call location.back', () => {
            component['back']();
            expect(location.back).toHaveBeenCalled();
        });
    });

    describe('UI Event Handlers', () => {
        beforeEach(fakeAsync(() => {
            authServiceMock.setUser(studentUser);
            fixture.detectChanges();
            tick();
            spyOn(component as any, 'getGrades').and.callThrough(); 
             component.paginator = { firstPage: jasmine.createSpy('firstPage') } as any;
        }));

        it('handlePageEvent() should update pagination and call getGrades', () => {
            const event: PageEvent = { pageIndex: 2, pageSize: 25, length: 100 };
            component['handlePageEvent'](event);
            expect(component['currentPage']).toBe(2);
            expect(component['pageSize']).toBe(25);
            expect((component as any).getGrades).toHaveBeenCalled();
        });

        it('handleSort() should update sorting and call getGrades', () => {
            const event: Sort = { active: 'course_name', direction: 'desc' };
            component['handleSort'](event);
            expect(component['sortField']).toBe('course_name');
            expect(component['sortDirection']).toBe('desc');
            expect((component as any).getGrades).toHaveBeenCalled();
        });

        it('applyFilterUserCode() should update filter, reset page, and call getGrades', () => {
            const event = { target: { value: 'filter_text' } } as unknown as KeyboardEvent;
            component['currentPage'] = 3; 
            component['applyFilterUserCode'](event);
            expect(component['filterValue']).toBe('filter_text');
            expect(component['currentPage']).toBe(0); 
            expect(component.paginator.firstPage).toHaveBeenCalled();
            expect((component as any).getGrades).toHaveBeenCalled();
        });

        it('filterBySemester() should update selectedSemester, reset page, and call getGrades (with specific semester)', () => {
            const semester: Semester = {  year: 2022, sezon: false, current: false };
            component['currentPage'] = 2;
            component['filterBySemester'](semester);
            expect(component['selectedSemester']).toBe(semester);
            expect(component['selectedSemesterOption']).toBe(semester);
            expect(component['currentPage']).toBe(0);
            expect(component.paginator.firstPage).toHaveBeenCalled();
            expect((component as any).getGrades).toHaveBeenCalled();
        });

        it('filterBySemester() should set selectedSemester to null for "All Semesters", reset page, and call getGrades', () => {
            const semester: Semester = {  year: 2022, sezon: false, current: false };
            component['selectedSemester'] = semester; 
            component['selectedSemesterOption'] = semester;
            component['currentPage'] = 1;
            component['filterBySemester'](component['ALL_SEMESTERS']); 
            expect(component['selectedSemester']).toBeNull();
            expect(component['selectedSemesterOption']).toBe(component['ALL_SEMESTERS']);
            expect(component['currentPage']).toBe(0);
            expect(component.paginator.firstPage).toHaveBeenCalled();
            expect((component as any).getGrades).toHaveBeenCalled();
        });
    });

    describe('Helper Methods', () => {
        it('formatSemester() should format semester correctly', () => {
            const semesterFall: Semester = {  year: 2023, sezon: true, current: true };
            const semesterSpring: Semester = {  year: 2024, sezon: false, current: false };
            expect(component['formatSemester'](semesterFall)).toBe('2023 Ősz');
            expect(component['formatSemester'](semesterSpring)).toBe('2024 Tavasz');
        });

        it('formatSemester() should return default string for null/undefined', () => {
            expect(component['formatSemester'](null as any)).toBe('Összes szemeszter');
            expect(component['formatSemester'](undefined as any)).toBe('Összes szemeszter');
        });
    });
});
