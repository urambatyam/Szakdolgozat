import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService} from '@ngx-translate/core'; 
import { CurriculumVisualizationComponent } from './curriculum-visualization.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { EventEmitter } from '@angular/core';
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
describe('CurriculumVisualizationComponent', () => {
  let component: CurriculumVisualizationComponent;
  let fixture: ComponentFixture<CurriculumVisualizationComponent>;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurriculumVisualizationComponent,BrowserAnimationsModule],
      providers: [
        { provide: TranslateService, useValue: translateServiceMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurriculumVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
