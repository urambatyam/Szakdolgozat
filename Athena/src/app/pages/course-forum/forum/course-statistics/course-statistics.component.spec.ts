import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService} from '@ngx-translate/core'; 
import { CourseStatisticsComponent } from './course-statistics.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EventEmitter } from '@angular/core';
import { of } from 'rxjs';
import { StatisticsService } from '../../../../services/mysql/statistics.service';
//import 'jasmine'
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
const statisticsServiceMock = {
  courseDistribution: jasmine.createSpy('courseDistribution').and.returnValue(of({})),
  courseGradeRate: jasmine.createSpy('courseGradeRate').and.returnValue(of({})),
  courseCompletionRate: jasmine.createSpy('courseCompletionRate').and.returnValue(of({})),
  courseLinearRegression: jasmine.createSpy('courseLinearRegression').and.returnValue(of({})),
  courseBoxplot: jasmine.createSpy('courseBoxplot').and.returnValue(of({}))
};
describe('CourseStatisticsComponent', () => {
  let component: CourseStatisticsComponent;
  let fixture: ComponentFixture<CourseStatisticsComponent>;
  let translateService: TranslateService;
  let statisticsService: StatisticsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseStatisticsComponent,BrowserAnimationsModule],
      providers: [
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: StatisticsService, useValue: statisticsServiceMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /*it('should create', () => {
    expect(component).toBeTruthy();
  });*/
});
