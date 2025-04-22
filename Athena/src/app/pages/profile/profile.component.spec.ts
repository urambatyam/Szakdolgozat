import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of,  BehaviorSubject, Subject } from 'rxjs'; 
import { EventEmitter } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '../../services/mysql/auth.service';
import { TranslateService} from '@ngx-translate/core'; 
import { MatDialog } from '@angular/material/dialog'; 
import { MatSnackBar } from '@angular/material/snack-bar'; 
import { ProfileComponent } from './profile.component';
import { DialogComponent } from './dialog/dialog.component'; 

const snackBarMock = {
  open: jasmine.createSpy('open')
};

const dialogRefMock = {
  _afterClosedSubject: new Subject<any>(),
  afterClosed() {
    return this._afterClosedSubject.asObservable();
  },
  closeDialog(result?: any) {
    this._afterClosedSubject.next(result);
    this._afterClosedSubject.complete(); 
  },
  reset() {
    this._afterClosedSubject = new Subject<any>();
  }
};

const dialogMock = {
  open: jasmine.createSpy('open').and.returnValue(dialogRefMock)
};

const testUser = { code: 'TEST1', name: 'Test User', email: 'test@example.com', role: 'student' as const };

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

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: AuthService;
  let dialog: MatDialog;
  let snackBar: MatSnackBar;
  let translateService: TranslateService;

  beforeEach(fakeAsync(() => { 
    authServiceMock.resetUserSubject();
    TestBed.configureTestingModule({
      imports: [
        ProfileComponent, 
        BrowserAnimationsModule, 
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: MatDialog, useValue: dialogMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;

    authService = TestBed.inject(AuthService);
    dialog = TestBed.inject(MatDialog);
    snackBar = TestBed.inject(MatSnackBar);
    translateService = TestBed.inject(TranslateService);

    authServiceMock.updatePassword.calls.reset();
    authServiceMock.updateEmail.calls.reset();
    dialogMock.open.calls.reset();
    dialogRefMock.reset(); 
    snackBarMock.open.calls.reset();
    translateServiceMock.get.calls.reset();
    translateServiceMock.instant.calls.reset();
    authServiceMock.setUser(testUser);


    fixture.detectChanges(); 
    tick(); 
  }));

  it('should create ProfileComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should populate form with user data on init', () => {
    expect(component['profilForm'].getRawValue()).toEqual({
        code: testUser.code,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
    });
    expect(component['profilForm'].controls.code.disabled).toBeTrue();
    expect(component['profilForm'].controls.name.disabled).toBeTrue();
    expect(component['profilForm'].controls.email.disabled).toBeTrue();
    expect(component['profilForm'].controls.role.disabled).toBeTrue();
  });

  describe('openDialog', () => {
    it('should open dialog for password change with correct data', () => {
        component.openDialog(true); 
        expect(dialog.open).toHaveBeenCalledOnceWith(DialogComponent, {
            data: {
                code: testUser.code, 
                email: testUser.email, 
                isPassword: true, 
            }
        });
    });

    it('should open dialog for email change with correct data', () => {
        component.openDialog(false); 
        expect(dialog.open).toHaveBeenCalledOnceWith(DialogComponent, {
            data: {
                code: testUser.code,
                email: testUser.email,
                isPassword: false, 
            }
        });
    });

     it('should not call update service if dialog closes without result (Cancel)', fakeAsync(() => {
        component.openDialog(true);
        dialogRefMock.closeDialog(undefined); 
        tick(); 

        expect(authService.updatePassword).not.toHaveBeenCalled();
        expect(authService.updateEmail).not.toHaveBeenCalled();
        expect(snackBar.open).not.toHaveBeenCalled();
    }));

  });

  it('should complete destroy$ subject on ngOnDestroy', () => {
    const nextSpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(completeSpy).toHaveBeenCalledTimes(1);
  });
});
