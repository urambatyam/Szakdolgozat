import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { ForumComponent } from './forum.component';
import { TranslateService } from '@ngx-translate/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
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
describe('ForumComponent', () => {
  let component: ForumComponent;
  let fixture: ComponentFixture<ForumComponent>;
  let translateService: TranslateService;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForumComponent,BrowserAnimationsModule],
      providers: [
        { provide: TranslateService, useValue: translateServiceMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /*it('should create', () => {
    expect(component).toBeTruthy();
  });*/
});
