import { Component, inject, ChangeDetectionStrategy, OnDestroy} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from '../../services/users.service';
import { User } from '../../models/user';
import { BehaviorSubject, catchError, EMPTY, finalize, from, map, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { AsyncPipe } from '@angular/common'; 

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    MatCardModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatIconModule, 
    MatButtonModule, 
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss'
})
export class RegistrationComponent implements OnDestroy {
  private kikapcs$ = new Subject<void>();
  ngOnDestroy(): void {
    this.kikapcs$.next();
    this.kikapcs$.complete();
    this.loadingSubject.complete();
  }
  fb = inject(FormBuilder);
  user = inject(UsersService);
  authService = inject(AuthService);
  private snackBar = inject(MatSnackBar)
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable().pipe(
    takeUntil(this.kikapcs$)
  );
  registForm = this.fb.nonNullable.group({
    userName: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(12)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{6,12}$/)]],
    tel: ['', [Validators.pattern(/^\+36\d{9}$/)]],
    major: ['', [Validators.required]],
    date: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    rang: ['', [Validators.required]]
  });


  onSubmit(): void {
    console.log(this.registForm);
    if (this.registForm.invalid) {
      this.registForm.markAllAsTouched();
      return;
    }
    this.register();
  };

    register(){
      this.loadingSubject.next(true);
      const rawValues = this.registForm.getRawValue();
      try{
        from(this.authService.register(this.registForm.getRawValue().email, this.registForm.getRawValue().password)).pipe(
          takeUntil(this.kikapcs$),
          map(cred => {
            if(!cred.user?.uid){
              throw new Error('Nem kaptunk vissza felhasználó ID-t a regisztrációból');
            }
            return cred.user.uid;
          }),
          switchMap( userId => {
            const newUser:User = {
              id : userId,
              name : rawValues.userName,
              tel : rawValues.tel,
              major : rawValues.major,
              start : isNaN(Number(rawValues.date)) ? 0 : Number(rawValues.date),
              rang : this.registForm.getRawValue().rang,
            }
            return this.user.add(newUser);
          }),
          tap(savedId => {
            console.log('Regisztráció sikeres:', savedId);
            this.snackBar.open('Sikeres regisztráció!', 'OK', {duration: 3000});
          }),
          catchError(error => {
            console.error('Hiba: ', error);
            this.snackBar.open('Hiba történt a regisztráció során!', 'OK', {
              duration: 3000
            });
            return EMPTY; 
          }),
          finalize(() => {
            this.loadingSubject.next(false);
          })
        ).subscribe();
      }catch(e){
        console.error('Hiba:', e);
        this.loadingSubject.next(false);
        this.snackBar.open('Váratlan hiba történt!', 'OK', {duration: 3000});
      }

    }
}