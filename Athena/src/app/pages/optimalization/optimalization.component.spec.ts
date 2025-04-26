import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CurriculumService } from '../../services/mysql/curriculum.service';
import { OptimalizationService } from '../../services/mysql/optimalization.service';
import { OptimalizationComponent } from './optimalization.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EventEmitter } from '@angular/core';
import { TranslateService} from '@ngx-translate/core'; 
//import 'jasmine';
import { of } from 'rxjs';
const CurriculumServiceMock = {
  getAllCurriculumNames: jasmine.createSpy('getAllCurriculumNames').and.returnValue(of([])),
  getCurriculum: jasmine.createSpy('getCurriculum').and.returnValue(of({})),
};
const OptimalizationServiceMock = {
  optimizeCurriculum: jasmine.createSpy('optimizeCurriculum').and.returnValue(of({})),
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
describe('OptimalizationComponent', () => {
  let component: OptimalizationComponent;
  let fixture: ComponentFixture<OptimalizationComponent>;
  let translateService: TranslateService;
  let curriculumService: CurriculumService;
  let optimalizationService: OptimalizationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OptimalizationComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: CurriculumService, useValue: CurriculumServiceMock },
        { provide: OptimalizationService, useValue: OptimalizationServiceMock },
        { provide: TranslateService, useValue: translateServiceMock },
      ]
    })
    .compileComponents(); 

    fixture = TestBed.createComponent(OptimalizationComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
