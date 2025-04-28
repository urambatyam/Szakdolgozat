import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { of } from 'rxjs';
//import 'jasmine';

describe('AppComponent', () => {
  beforeEach(async () => {
    const translateServiceMock = {
      setDefaultLang: () => {},
      use: () => of(null),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, HttpClientModule, TranslateModule.forRoot(), BrowserAnimationsModule], 
      providers: [{ provide: TranslateService, useValue: translateServiceMock }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
