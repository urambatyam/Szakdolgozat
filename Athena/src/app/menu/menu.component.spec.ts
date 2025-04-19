import { EventEmitter } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed ,tick } from '@angular/core/testing';
import { MenuComponent } from './menu.component';
import { AuthService } from '../services/mysql/auth.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router'; 
import { MatSelectChange } from '@angular/material/select'; 
//import 'jasmine';

const authServiceMock = {
    user$: of({ role: 'student' }),
    logout: jasmine.createSpy('logout').and.returnValue(of(null))
};

const translateServiceMock = {
    setDefaultLang: jasmine.createSpy('setDefaultLang'),
    use: jasmine.createSpy('use').and.returnValue(of(null)),
    get: jasmine.createSpy('get').and.returnValue(of('mock-translation')),
    currentLang: 'hu',
    onLangChange: new EventEmitter<LangChangeEvent>(),
    onTranslationChange: new EventEmitter<any>(),
    onDefaultLangChange: new EventEmitter<any>()
};

const breakpointObserverMock = {
    observe: jasmine.createSpy('observe').and.returnValue(of({ matches: false }))
};

const matSidenavMock = {
    close: jasmine.createSpy('close').and.resolveTo('closed'), 
    open: jasmine.createSpy('open').and.resolveTo('opened'),
    opened: false
};

describe('MenuComponent', () => {
    let component: MenuComponent;
    let fixture: ComponentFixture<MenuComponent>;
    let router: Router; 

    beforeEach(fakeAsync(() => {
      authServiceMock.logout.calls.reset();
      translateServiceMock.setDefaultLang.calls.reset();
      translateServiceMock.use.calls.reset();
      translateServiceMock.get.calls.reset();
      breakpointObserverMock.observe.calls.reset();
      matSidenavMock.close.calls.reset();

      TestBed.configureTestingModule({
          imports: [
              MenuComponent,
              NoopAnimationsModule,
              RouterTestingModule.withRoutes([]), 
          ],
          providers: [
              { provide: AuthService, useValue: authServiceMock },
              { provide: TranslateService, useValue: translateServiceMock },
              { provide: BreakpointObserver, useValue: breakpointObserverMock },
          ]
      }).compileComponents();

      fixture = TestBed.createComponent(MenuComponent);
      component = fixture.componentInstance;
      router = TestBed.inject(Router);
      spyOn(router, 'navigateByUrl').and.stub();
      (component as any).drawer = matSidenavMock;
      fixture.detectChanges(); 
      (component as any).drawer = matSidenavMock;
      tick(); 
      fixture.detectChanges(); 
    }));

    it('should create MenuComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should change language and update selectedLang on changeLang call', () => {
        const mockEvent = { value: 'en' } as MatSelectChange;
        translateServiceMock.use.calls.reset(); 
        component['changeLang'](mockEvent); 

        expect(translateServiceMock.use).toHaveBeenCalledOnceWith('en');
        expect(component['selectedLang']).toBe('en');
    });

    it('should call drawer.close when closeSidenav is called', () => {
        matSidenavMock.close.calls.reset(); 
        component['closeSidenav'](); 

        expect(matSidenavMock.close).toHaveBeenCalledTimes(1);
    });

    it('should call authService.logout, navigate to login and close sidenav on logOut', fakeAsync(() => {
        authServiceMock.logout.calls.reset();
        (router.navigateByUrl as jasmine.Spy).calls.reset();
        matSidenavMock.close.calls.reset();
        component['logOut'](); 
        tick(); 

        expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
        expect(router.navigateByUrl).toHaveBeenCalledOnceWith('login');
        expect(matSidenavMock.close).toHaveBeenCalledTimes(1);
    }));

    it('should set the role on init', () => {
        expect(component['role']).toBe('student');
    });

    it('should set the default language on init', () => {
        expect(translateServiceMock.setDefaultLang).toHaveBeenCalledWith('hu');
        expect(translateServiceMock.use).toHaveBeenCalledWith('hu');
    });

    it('should observe breakpoints on init', () => {
        expect(breakpointObserverMock.observe).toHaveBeenCalled();
    });
});