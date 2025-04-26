import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { MessagesComponent } from './messages.component';
import { TranslateService } from '@ngx-translate/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CourseForumService } from '../../../../services/mysql/course-forum.service';
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
const CourseForumServiceMock = {
  getAllCourseForumsInCourse: jasmine.createSpy('getAllCourseForumsInCourse').and.returnValue(of([])),
  createCourseForum: jasmine.createSpy('createCourseForum').and.returnValue(of({})),
}
describe('MessagesComponent', () => {
  let component: MessagesComponent;
  let fixture: ComponentFixture<MessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MessagesComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: CourseForumService, useValue: CourseForumServiceMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
