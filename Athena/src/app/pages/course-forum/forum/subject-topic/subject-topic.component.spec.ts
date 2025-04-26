import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EventEmitter } from '@angular/core';
import { TranslateService} from '@ngx-translate/core'; 
import { SubjectTopicComponent } from './subject-topic.component';
import { of } from 'rxjs';
import { SubjectMatterService } from '../../../../services/mysql/subject-matter.service';
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
const subjectMatterServiceMock = {
  getSebjectMatter: jasmine.createSpy('getSebjectMatter').and.returnValue(of({})),
  updateSebjectMatter: jasmine.createSpy('updateSebjectMatter').and.returnValue(of({})),
}
describe('SubjectTopicComponent', () => {
  let component: SubjectTopicComponent;
  let fixture: ComponentFixture<SubjectTopicComponent>;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SubjectTopicComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: SubjectMatterService , useValue: subjectMatterServiceMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectTopicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
