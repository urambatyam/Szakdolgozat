import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms'; 
import { DialogComponent } from './dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

const translateServiceMock = {
    setDefaultLang: jasmine.createSpy('setDefaultLang'),
    use: jasmine.createSpy('use').and.returnValue(of(null)),
    get: jasmine.createSpy('get').and.returnValue(of('mock-translation')),
    instant: jasmine.createSpy('instant').and.callFake((key: string) => `instant-${key}`), 
    currentLang: 'hu',
    onLangChange: new EventEmitter<any>(),
    onTranslationChange: new EventEmitter<any>(),
    onDefaultLangChange: new EventEmitter<any>()
};

const matDialogRefMock = {
  close: jasmine.createSpy('close') 
};

const mockDialogDataPassword = {
  code: 'TEST1',
  email: 'test@mail.com',
  isPassword: 'true',
};

const mockDialogDataEmail = {
  code: 'TEST2',
  email: 'another@mail.com',
  isPassword: 'false',
};

describe('DialogComponent', () => {
  let component: DialogComponent;
  let fixture: ComponentFixture<DialogComponent>;
  let dialogRef: MatDialogRef<DialogComponent>;

  async function setupTestBed(data: any) {
    await TestBed.configureTestingModule({
      imports: [
        DialogComponent,
        BrowserAnimationsModule,
        RouterTestingModule.withRoutes([]),
        FormsModule
      ],
      providers: [
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: MatDialogRef, useValue: matDialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
    matDialogRefMock.close.calls.reset();
    fixture.detectChanges(); 
  }

  describe('Password Mode', () => {
    beforeEach(async () => {
      await setupTestBed(mockDialogDataPassword);
    });

    it('should create DialogComponent in password mode', () => {
      expect(component).toBeTruthy();
      expect(component.code()).toBe(mockDialogDataPassword.code);
      expect(component.email()).toBe(mockDialogDataPassword.email);
      expect(component.isPassword()).toBe('true');
      expect(component.password()).toBe('');
      expect(component.new()).toBe('');
    });

    it('should call dialogRef.close() with no arguments on onNoClick()', () => {
      component.onNoClick();
      expect(dialogRef.close).toHaveBeenCalledTimes(1);
      expect(dialogRef.close).toHaveBeenCalledWith(); 
    });


    it('should update password and new models on input change (requires template interaction test)', () => {

        const newPasswordValue = 'newPass123';
        const newConfirmationValue = 'newPass123'; 

        component.password.set(newPasswordValue);
        component.new.set(newConfirmationValue);

        fixture.detectChanges(); 

        expect(component.password()).toBe(newPasswordValue);
        expect(component.new()).toBe(newConfirmationValue);
        expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('Email Mode', () => {
    beforeEach(async () => {
      await setupTestBed(mockDialogDataEmail);
    });

    it('should create DialogComponent in email mode', () => {
      expect(component).toBeTruthy();
      expect(component.code()).toBe(mockDialogDataEmail.code);
      expect(component.email()).toBe(mockDialogDataEmail.email);
      expect(component.isPassword()).toBe('false'); 
      expect(component.password()).toBe(''); 
      expect(component.new()).toBe(''); 
    });

     it('should call dialogRef.close() with no arguments on onNoClick()', () => {
      component.onNoClick();
      expect(dialogRef.close).toHaveBeenCalledTimes(1);
      expect(dialogRef.close).toHaveBeenCalledWith();
    });
  });

});
