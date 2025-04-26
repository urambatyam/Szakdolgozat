import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EventEmitter } from '@angular/core';
import { TranslateService} from '@ngx-translate/core'; 
import { BehaviorSubject, of } from 'rxjs';
import { CourseForumComponent } from './course-forum.component';
import { CourseService } from '../../services/mysql/course.service';
import { AuthService } from '../../services/mysql/auth.service';
//import 'jasmine';
const CourseServiceMock = {
  getAllCoursesOFUser: jasmine.createSpy('getAllCoursesOFUser').and.returnValue(of([])),
  deleteCourse: jasmine.createSpy('deleteCourse').and.returnValue(of({})),
  createCourse: jasmine.createSpy('createCourse').and.returnValue(of({})),
  updateCourse: jasmine.createSpy('updateCourse').and.returnValue(of({})),
};
const authServiceMock = {
    user$: new BehaviorSubject<any>(null),
    updatePassword: jasmine.createSpy('updatePassword').and.returnValue(of({})), 
    updateEmail: jasmine.createSpy('updateEmail').and.returnValue(of({})), 
    setUser(user: any) {
        this.user$.next(user);
    },
    emitUserError(error: any) {
        this.user$.error(error); 
    },
    resetUserSubject() {
        this.user$ = new BehaviorSubject<any>(null);
    }
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
describe('CourseForumComponent', () => {
  let component: CourseForumComponent;
  let fixture: ComponentFixture<CourseForumComponent>;
  let translateService: TranslateService;
  let courseService: CourseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CourseForumComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: CourseService, useValue: CourseServiceMock },
        { provide: AuthService , useValue: authServiceMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseForumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
