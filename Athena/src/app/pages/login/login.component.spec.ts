import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'; 
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/mysql/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs'; 
import { EventEmitter } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router'; 
import { RouterTestingModule } from '@angular/router/testing'; 
import { HttpErrorResponse } from '@angular/common/http'; 
//import 'jasmine';
const authServiceMock = {
    login: jasmine.createSpy('login').and.returnValue(of({ user: { code: 'TEST1' }, token: 'test-token' })),
    user$: of({ role: 'student' }),
    logout: jasmine.createSpy('logout').and.returnValue(of(null))
};

const translateServiceMock = {
    setDefaultLang: jasmine.createSpy('setDefaultLang'),
    use: jasmine.createSpy('use').and.returnValue(of(null)),
    get: jasmine.createSpy('get').and.returnValue(of('mock-translation')),
    currentLang: 'hu',
    onLangChange: new EventEmitter<any>(),
    onTranslationChange: new EventEmitter<any>(),
    onDefaultLangChange: new EventEmitter<any>()
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router; 

  beforeEach(fakeAsync(() => { 
    TestBed.configureTestingModule({
      imports: [LoginComponent, BrowserAnimationsModule, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: TranslateService, useValue: translateServiceMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router); 

    spyOn(router, 'navigateByUrl').and.stub();

    authServiceMock.login.calls.reset();
    (router.navigateByUrl as jasmine.Spy).calls.reset();


    fixture.detectChanges(); 
    tick(); 
  }));

  it('should create LoginComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle hidePassword signal on togglePasswordVisibility call', () => {
    const initialValue = component['hidePassword']();
    const mockEvent = new MouseEvent('click');
    spyOn(mockEvent, 'stopPropagation'); 

    component['togglePasswordVisibility'](mockEvent);

    expect(component['hidePassword']()).toBe(!initialValue); 
    expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1); 
  });

  it('should mark form as touched and not call login if form is invalid', () => {
    spyOn(component['loginForm'], 'markAllAsTouched'); 

    component['onSubmit'](); 

    expect(component['loginForm'].markAllAsTouched).toHaveBeenCalledTimes(1);
    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should call authService.login and navigate on successful submit', fakeAsync(() => {
    component['loginForm'].setValue({ code: 'TEST1', password: 'password123' });
    authServiceMock.login.and.returnValue(of({ user: { code: 'TEST1' }, token: 'test-token' }));

    component['onSubmit']();
    tick(); 

    expect(authServiceMock.login).toHaveBeenCalledOnceWith('TEST1', 'password123');
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('curriculum');
    expect(component['errorMessage']()).toBe(''); 
  }));

  it('should set INVALID_CREDENTIALS error message on 401 error', fakeAsync(() => {
    component['loginForm'].setValue({ code: 'WRON1', password: 'password123' });
    const errorResponse = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    authServiceMock.login.and.returnValue(throwError(() => errorResponse));

    component['onSubmit']();
    tick(); 

    expect(authServiceMock.login).toHaveBeenCalledOnceWith('WRON1', 'password123');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component['errorMessage']()).toBe('login.INVALID_CREDENTIALS'); 
  }));

  it('should set GENERIC_ERROR error message on other errors', fakeAsync(() => {
    component['loginForm'].setValue({ code: 'TEST1', password: 'password123' });
    const errorResponse = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    authServiceMock.login.and.returnValue(throwError(() => errorResponse));

    component['onSubmit']();
    tick(); 

    expect(authServiceMock.login).toHaveBeenCalledOnceWith('TEST1', 'password123');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component['errorMessage']()).toBe('login.GENERIC_ERROR'); 
  }));

});
