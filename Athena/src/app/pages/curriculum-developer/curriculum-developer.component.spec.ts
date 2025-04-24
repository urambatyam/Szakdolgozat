import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CourseService } from '../../services/mysql/course.service';
import { CurriculumService } from '../../services/mysql/curriculum.service';
import { CurriculumDeveloperComponent } from './curriculum-developer.component';
import { TranslateService } from '@ngx-translate/core';
import { EventEmitter } from '@angular/core';
import { EMPTY, of, throwError } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormArray, FormControl } from '@angular/forms';
import { Curriculum } from '../../models/curriculum';
import { Course } from '../../models/course';
import { Name } from '../../models/curriculumNames';
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

const mockCurriculumNames: Name[] = [
    { id: 1, name: 'Tanterv 1' },
    { id: 2, name: 'Tanterv 2' }
];

const mockCourses: Course[] = [
    { id: 101, name: 'Kurzus 101', kredit: 5, recommendedSemester: 1, subjectResponsible: 'Teszt Tanár', subjectMatter: '', user_code: null, sezon: null },
    { id: 102, name: 'Kurzus 102', kredit: 4, recommendedSemester: 2, subjectResponsible: 'Teszt Tanár', subjectMatter: '', user_code: null, sezon: null }
];

const mockFullCurriculum: Curriculum = {
    id: 1,
    name: 'Teljes Tanterv',
    specializations: [
        {
            id: 11, name: 'Spec 1', required: true, categories: [
                {
                    id: 111, name: 'Kat 1.1', min: 5, courses: [
                        { id: 101, name: 'Kurzus 101', kredit: 5, recommendedSemester: 1, subjectResponsible: 'Teszt Tanár', subjectMatter: '', user_code: null, sezon: null }
                    ]
                }
            ]
        },
        {
            id: 12, name: 'Spec 2', required: false, categories: [
                {
                    id: 121, name: 'Kat 2.1', min: 4, courses: [
                        { id: 102, name: 'Kurzus 102', kredit: 4, recommendedSemester: 2, subjectResponsible: 'Teszt Tanár', subjectMatter: '', user_code: null, sezon: null }
                    ]
                }
            ]
        }
    ]
};
const { id, ...restOfMock } = mockFullCurriculum;
const CurriculumServiceMock = {
  getAllCurriculumNames: jasmine.createSpy('getAllCurriculumNames').and.returnValue(of(mockCurriculumNames)),
  getCurriculum: jasmine.createSpy('getCurriculum').and.returnValue(of(mockFullCurriculum)),
  createCurriculum: jasmine.createSpy('createCurriculum').and.returnValue(of({ id: 3, ...restOfMock })), 
  updateCurriculum: jasmine.createSpy('updateCurriculum').and.returnValue(of(mockFullCurriculum)),
  deleteCurriculum: jasmine.createSpy('deleteCurriculum').and.returnValue(of({ message: 'Sikeres törlés' }))
};

const CourseServiceMock = {
  getAllCoursesNames: jasmine.createSpy('getAllCoursesNames').and.returnValue(of(mockCourses))
};

describe('CurriculumDeveloperComponent', () => {
  let component: CurriculumDeveloperComponent;
  let fixture: ComponentFixture<CurriculumDeveloperComponent>;
  let curriculumService: CurriculumService;
  let courseService: CourseService;

  beforeEach(async () => {
    CourseServiceMock.getAllCoursesNames.calls.reset()
    CourseServiceMock.getAllCoursesNames.and.returnValue(of(mockCourses));
    CurriculumServiceMock.getAllCurriculumNames.calls.reset()
    CurriculumServiceMock.getAllCurriculumNames.and.returnValue(of(mockCurriculumNames));
    CurriculumServiceMock.getCurriculum.calls.reset()
    CurriculumServiceMock.getCurriculum.and.returnValue(of(mockFullCurriculum));
    CurriculumServiceMock.createCurriculum.calls.reset()
    CurriculumServiceMock.createCurriculum.and.returnValue(of({ id: 3, ...restOfMock  }));
    CurriculumServiceMock.updateCurriculum.calls.reset()
    CurriculumServiceMock.updateCurriculum.and.returnValue(of(mockFullCurriculum));
    CurriculumServiceMock.deleteCurriculum.calls.reset()
    CurriculumServiceMock.deleteCurriculum.and.returnValue(of({ message: 'Sikeres törlés' }));

    await TestBed.configureTestingModule({
      imports: [CurriculumDeveloperComponent, BrowserAnimationsModule], 
      providers: [
          { provide: TranslateService, useValue: translateServiceMock },
          { provide: CurriculumService, useValue:  CurriculumServiceMock},
          { provide:  CourseService, useValue: CourseServiceMock },
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(CurriculumDeveloperComponent);
    component = fixture.componentInstance;
    curriculumService = TestBed.inject(CurriculumService);
    courseService = TestBed.inject(CourseService);
  });

  it('should create', () => {
    fixture.detectChanges(); 
    expect(component).toBeTruthy();
  });

  describe('Initialization (ngOnInit)', () => {
    it('should call getAllCoursesNames and loadCurriculumNames on init', fakeAsync(() => {
        spyOn(component, 'loadCurriculumNames'); 
        fixture.detectChanges(); 
        tick(); 
        expect(courseService.getAllCoursesNames).toHaveBeenCalled();
        expect(component.loadCurriculumNames).toHaveBeenCalled();
        expect(component['AllCourseNames']).toEqual(mockCourses);
    }));

    it('should set formVs to false on init', () => {
        fixture.detectChanges();
        expect(component['formVs']).toBeFalse();
    });
  });

  describe('loadCurriculumNames', () => {
    it('should call getAllCurriculumNames and update tantervNevek.data', fakeAsync(() => {
        component.loadCurriculumNames(); 
        tick();
        expect(curriculumService.getAllCurriculumNames).toHaveBeenCalled();
        expect(component['tantervNevek'].data).toEqual(mockCurriculumNames);
    }));


  });

  describe('Form Generation', () => {
    it('generateSpecialization should return a valid specialization FormGroup', () => {
        const specGroup = component.generateSpecialization();
        expect(specGroup).toBeTruthy();
        expect(specGroup.controls.id).toBeDefined();
        expect(specGroup.controls.spName).toBeDefined();
        expect(specGroup.controls.required).toBeDefined();
        expect(specGroup.controls.categories).toBeInstanceOf(FormArray);
        expect(specGroup.controls.required.value).toBe(-1); 
    });

    it('generateCategory should return a valid category FormGroup', () => {
        const catGroup = component.generateCategory();
        expect(catGroup).toBeTruthy();
        expect(catGroup.controls.id).toBeDefined();
        expect(catGroup.controls.catName).toBeDefined();
        expect(catGroup.controls.min).toBeDefined();
        expect(catGroup.controls.courses).toBeInstanceOf(FormArray);
    });

    it('generateCourse should return a valid course FormGroup', () => {
        const courseGroup = component.generateCourse();
        expect(courseGroup).toBeTruthy();
        expect(courseGroup.controls.id).toBeDefined();
        expect(courseGroup.controls.name).toBeDefined();
    });
  });

  describe('Form Manipulation', () => {
    beforeEach(() => {
        fixture.detectChanges(); 
        component.addSpecialization();
        component.addCategory(0);
    });

    it('addSpecialization should add a specialization to the form', () => {
        const initialLength = component['tantervForm'].controls.specializations.length;
        component.addSpecialization();
        expect(component['tantervForm'].controls.specializations.length).toBe(initialLength + 1);
    });

    it('removeSpecialization should remove a specialization from the form', () => {
        const initialLength = component['tantervForm'].controls.specializations.length;
        component.removeSpecialization(0);
        expect(component['tantervForm'].controls.specializations.length).toBe(initialLength - 1);
    });

    it('addCategory should add a category to the specified specialization', () => {
        const specIndex = 0;
        const initialLength = component['tantervForm'].controls.specializations.at(specIndex).controls.categories.length;
        component.addCategory(specIndex);
        expect(component['tantervForm'].controls.specializations.at(specIndex).controls.categories.length).toBe(initialLength + 1);
    });

    it('removeCategory should remove a category from the specified specialization', () => {
        const specIndex = 0;
        const catIndex = 0;
        const initialLength = component['tantervForm'].controls.specializations.at(specIndex).controls.categories.length;
        component.removeCategory(specIndex, catIndex);
        expect(component['tantervForm'].controls.specializations.at(specIndex).controls.categories.length).toBe(initialLength - 1);
    });

    it('addCourses should add a course to the specified category if not duplicate', () => {
        const specIndex = 0;
        const catIndex = 0;
        const courseToAdd = mockCourses[0]; 
        const coursesArray = component['tantervForm'].controls.specializations.at(specIndex).controls.categories.at(catIndex).controls.courses;

        component.addCourses(specIndex, catIndex, courseToAdd.id!);
        expect(coursesArray.length).toBe(1);
        expect(coursesArray.at(0).value.id).toBe(courseToAdd.id);
        expect(coursesArray.at(0).value.name).toBe(courseToAdd.name);
        component.addCourses(specIndex, catIndex, courseToAdd.id!);
        expect(coursesArray.length).toBe(1); 
    });

     it('addCourses should not add a non-existent course', () => {
        const specIndex = 0;
        const catIndex = 0;
        const nonExistentCourseId = 999;
        const coursesArray = component['tantervForm'].controls.specializations.at(specIndex).controls.categories.at(catIndex).controls.courses;
        const initialLength = coursesArray.length;
        component.addCourses(specIndex, catIndex, nonExistentCourseId);
        expect(coursesArray.length).toBe(initialLength);
    });

    it('onCourseSelect should call addCourses and reset select value', () => {
        const specIndex = 0;
        const catIndex = 0;
        const courseToAdd = mockCourses[1]; 
        const mockEvent = {
            target: { value: courseToAdd.id!.toString() }
        } as unknown as Event;
        spyOn(component, 'addCourses');
        component.onCourseSelect(mockEvent, specIndex, catIndex);
        expect(component.addCourses).toHaveBeenCalledWith(specIndex, catIndex, courseToAdd.id!);
        expect((mockEvent.target as HTMLSelectElement).value).toBe('');
    });



    it('removeCourses should remove a course from the specified category', () => {
        const specIndex = 0;
        const catIndex = 0;
        const courseIndex = 0;
        const courseToAdd = mockCourses[0];
        component.addCourses(specIndex, catIndex, courseToAdd.id!); 
        const coursesArray = component['tantervForm'].controls.specializations.at(specIndex).controls.categories.at(catIndex).controls.courses;
        const initialLength = coursesArray.length;
        component.removeCourses(specIndex, catIndex, courseIndex);
        expect(coursesArray.length).toBe(initialLength - 1);
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
        fixture.detectChanges(); 
    });

    it('create should set formVs to true, update to false and reset form', () => {
        component['formVs'] = false;
        component['update'] = true;
        component['tantervForm'].controls.tName.setValue('Régi név');
        component.addSpecialization();
        component.create();
        expect(component['formVs']).toBeTrue();
        expect(component['update']).toBeFalse();
        expect(component['tantervForm'].controls.id.value).toBeNull();
        expect(component['tantervForm'].controls.tName.value).toBe('');
        expect(component['tantervForm'].controls.specializations.length).toBe(0);
    });

    it('close should set formVs and update to false and reset form', () => {
        component['formVs'] = true;
        component['update'] = true;
        component['tantervForm'].controls.tName.setValue('Régi név');
        component.addSpecialization();
        component.close();
        expect(component['formVs']).toBeFalse();
        expect(component['update']).toBeFalse();
        expect(component['tantervForm'].controls.id.value).toBeNull();
        expect(component['tantervForm'].controls.tName.value).toBe('');
        expect(component['tantervForm'].controls.specializations.length).toBe(0);
    });

    it('todelete should call deleteCurriculum and loadCurriculumNames on success after confirm', fakeAsync(() => {
        const curriculumToDelete: Curriculum = { id: 1, name: 'Tanterv 1', specializations: [] };
        spyOn(window, 'confirm').and.returnValue(true); 
        spyOn(component, 'loadCurriculumNames');
        component.todelete(curriculumToDelete);
        tick(); 
        expect(window.confirm).toHaveBeenCalledWith(`Biztosan törölni szeretné a(z) "${curriculumToDelete.name}" tantervet?`);
        expect(curriculumService.deleteCurriculum).toHaveBeenCalledWith(curriculumToDelete.id!);
        expect(component.loadCurriculumNames).toHaveBeenCalled();
    }));

    it('todelete should NOT call deleteCurriculum if confirm is false', fakeAsync(() => {
        const curriculumToDelete: Curriculum = { id: 1, name: 'Tanterv 1', specializations: [] };
        spyOn(window, 'confirm').and.returnValue(false); 
        spyOn(component, 'loadCurriculumNames');
        component.todelete(curriculumToDelete);
        tick();
        expect(window.confirm).toHaveBeenCalled();
        expect(curriculumService.deleteCurriculum).not.toHaveBeenCalled();
        expect(component.loadCurriculumNames).not.toHaveBeenCalled();
    }));



     it('todelete should log error if curriculum id is missing', () => {
        const curriculumToDelete: Curriculum = { id: null, name: 'Tanterv ID nélkül', specializations: [] };
        spyOn(console, 'error');
        component.todelete(curriculumToDelete);
        expect(curriculumService.deleteCurriculum).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith("A törlendő tantervnek nincs ID-ja!");
    });

    it('toupdate should set flags, call getCurriculum, clear array and patch form', fakeAsync(() => {
        const curriculumToUpdate: Curriculum = { id: 1, name: 'Tanterv 1', specializations: [] }; 
        spyOn(component['tantervForm'].controls.specializations, 'clear').and.callThrough();
        component.toupdate(curriculumToUpdate);
        tick(); 
        expect(component['update']).toBeTrue();
        expect(component['formVs']).toBeTrue();
        expect(curriculumService.getCurriculum).toHaveBeenCalledWith(curriculumToUpdate.id!);
        expect(component['tantervForm'].controls.specializations.clear).toHaveBeenCalled();
        expect(component['tantervForm'].value.id).toBe(mockFullCurriculum.id);
        expect(component['tantervForm'].value.tName).toBe(mockFullCurriculum.name);
        expect(component['tantervForm'].controls.specializations.length).toBe(mockFullCurriculum.specializations.length);
        const requiredSpecIndex = mockFullCurriculum.specializations.findIndex(s => s.required);
        const notRequiredSpecIndex = mockFullCurriculum.specializations.findIndex(s => !s.required);
        if (requiredSpecIndex !== -1) {
            expect(component['tantervForm'].controls.specializations.at(requiredSpecIndex).value.required).toBe(requiredSpecIndex);
        }
        if (notRequiredSpecIndex !== -1) {
             expect(component['tantervForm'].controls.specializations.at(notRequiredSpecIndex).value.required).toBe(-1);
        }
        const firstSpecForm = component['tantervForm'].controls.specializations.at(0);
        expect(firstSpecForm.value.spName).toBe(mockFullCurriculum.specializations[0].name);
        const firstCatForm = firstSpecForm.controls.categories.at(0);
        expect(firstCatForm.value.catName).toBe(mockFullCurriculum.specializations[0].categories[0].name);
        const firstCourseForm = firstCatForm.controls.courses.at(0);
        expect(firstCourseForm.value.id).toBe(mockFullCurriculum.specializations[0].categories[0].courses[0].id);
    }));



     it('toupdate should log error and close if curriculum id is missing', () => {
        const curriculumToUpdate: Curriculum = { id: null, name: 'Tanterv ID nélkül', specializations: [] };
        spyOn(console, 'error');
        spyOn(component, 'close');
        component.toupdate(curriculumToUpdate);
        expect(curriculumService.getCurriculum).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith("A szerkesztendő tantervnek nincs ID-ja!");
        expect(component.close).toHaveBeenCalled();
    });

  });

  describe('onSubmit', () => {
    beforeEach(() => {
        fixture.detectChanges(); 
        spyOn(component, 'loadCurriculumNames');
        spyOn(component, 'close');
    });

    it('should not call service if form is invalid', () => {
        component.create(); 
        component['tantervForm'].controls.tName.setErrors({ required: true }); 
        component.onSubmit();
        expect(CurriculumServiceMock.createCurriculum).not.toHaveBeenCalled();
        expect(CurriculumServiceMock.updateCurriculum).not.toHaveBeenCalled();
        expect(component.loadCurriculumNames).not.toHaveBeenCalled();
        expect(component.close).not.toHaveBeenCalled();
    });

    it('should call createCurriculum if update is false', fakeAsync(() => {
        component.create(); 
        component['tantervForm'].patchValue({ tName: 'Új Tanterv' });
        component.addSpecialization();
        component['tantervForm'].controls.specializations.at(0).patchValue({ spName: 'Új Spec', required: 0 }); 
        component.addCategory(0);
        component['tantervForm'].controls.specializations.at(0).controls.categories.at(0).patchValue({ catName: 'Új Kat', min: 3 });
        component.addCourses(0, 0, mockCourses[0].id!);
        component.onSubmit();
        tick();
        expect(CurriculumServiceMock.createCurriculum).toHaveBeenCalled();
        const sentData = CurriculumServiceMock.createCurriculum.calls.mostRecent().args[0] as Curriculum;
        expect(sentData.name).toBe('Új Tanterv');
        expect(sentData.specializations[0].name).toBe('Új Spec');
        expect(sentData.specializations[0].required).toBeTrue(); 
        expect(sentData.specializations[0].categories[0].name).toBe('Új Kat');
        expect(sentData.specializations[0].categories[0].courses[0].id).toBe(mockCourses[0].id);
        expect(component.loadCurriculumNames).toHaveBeenCalled();
        expect(component.close).toHaveBeenCalled();
    }));

    it('should call updateCurriculum if update is true', fakeAsync(() => {
        component.toupdate({ id: 1, name: 'Régi', specializations: [] }); 
        tick(); 
        component['tantervForm'].patchValue({ tName: 'Frissített Tanterv' });
        if (component['tantervForm'].controls.specializations.length > 1) {
            component['tantervForm'].controls.specializations.at(1).controls.required.setValue(1);
            component['tantervForm'].controls.specializations.at(0).controls.required.setValue(-1); 
        }
        component.onSubmit();
        tick();
        expect(CurriculumServiceMock.updateCurriculum).toHaveBeenCalled();
        const sentData = CurriculumServiceMock.updateCurriculum.calls.mostRecent().args[0] as Curriculum;
        expect(sentData.id).toBe(1); 
        expect(sentData.name).toBe('Frissített Tanterv');
        if (sentData.specializations.length > 1) {
             expect(sentData.specializations[1].required).toBeTrue();
             expect(sentData.specializations[0].required).toBeFalse();
        }
        expect(component.loadCurriculumNames).toHaveBeenCalled();
        expect(component.close).toHaveBeenCalled();
    }));
  });

  it('should have destroy subjects defined', () => {
     fixture.detectChanges();
     expect(component['curriculumNames$']).toBeDefined();
     expect(component['courseNames$']).toBeDefined();
  });
});
