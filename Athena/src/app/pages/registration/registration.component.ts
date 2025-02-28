import { Component, inject, ChangeDetectionStrategy, OnDestroy, OnInit} from '@angular/core';
//import { AuthService } from '../../services/auth.service';
import { AuthService } from '../../services/mysql/auth.service';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
//import { UsersService } from '../../services/mysql/users.service';
import { User } from '../../models/user';
import { BehaviorSubject, catchError, EMPTY, finalize, firstValueFrom, from, map, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { AsyncPipe } from '@angular/common'; 
import { MatSelectModule } from '@angular/material/select';
import { Name } from '../../models/curriculumNames';
import { CurriculumService } from '../../services/mysql/curriculum.service';

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
    AsyncPipe,
    MatSelectModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss'
})
export class RegistrationComponent implements OnDestroy, OnInit {
  async ngOnInit() {
    await firstValueFrom(
      from(this.curriculumData.getAllCurriculumNames()).pipe(
        map(c =>{
          this.curriculums = c;
        }),
        catchError(error => {
          console.log('Hiba: '+error)
          return EMPTY;
        }),
      )
    )
  }
  private kikapcs$ = new Subject<void>();
  ngOnDestroy(): void {
    this.kikapcs$.next();
    this.kikapcs$.complete();
    this.loadingSubject.complete();
  }
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private curriculumData = inject(CurriculumService);
  protected curriculums: Name[] = [];
  private snackBar = inject(MatSnackBar)
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable().pipe(
    takeUntil(this.kikapcs$)
  );



  registForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(12)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{6,12}$/)]],
    password_confirmation: ['', [Validators.required]],
    role: this.fb.nonNullable.control<"student" | "teacher" | "admin">("student", Validators.required),
    curriculum_id: this.fb.nonNullable.control<number|null>(null, Validators.required),
  },
  {
    validators: this.confirmed
  }
);

private confirmed(control:AbstractControl): ValidationErrors | null{
  return control.get('password')?.value ===
    control.get('password_confirmation')?.value
    ? null
    : {notConfirmed:true}
}




  onSubmit(): void {
    console.log(this.registForm);
    if (this.registForm.invalid) {
      this.registForm.markAllAsTouched();
      return;
    }
    this.register();
  };

register() {
  this.loadingSubject.next(true);
  const rawValues = this.registForm.getRawValue();
  
  this.auth.register(rawValues).pipe(
    takeUntil(this.kikapcs$),
    tap(() => {
      this.snackBar.open('Successful registration!', 'OK', {duration: 3000});
      // Navigate to login or dashboard
    }),
    catchError(error => {
      this.snackBar.open(error.error.message || 'Registration failed!', 'OK', {
        duration: 3000
      });
      return EMPTY;
    }),
    finalize(() => this.loadingSubject.next(false))
  ).subscribe();
}
}