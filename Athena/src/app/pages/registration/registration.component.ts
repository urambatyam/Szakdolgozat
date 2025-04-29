import { Component, inject, ChangeDetectionStrategy, OnDestroy, OnInit} from '@angular/core';
import { AuthService } from '../../services/mysql/auth.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, catchError, finalize, firstValueFrom, of, startWith, Subject, takeUntil, tap } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { AsyncPipe } from '@angular/common'; 
import { MatSelectModule } from '@angular/material/select';
import { Name } from '../../models/curriculumNames';
import { CurriculumService } from '../../services/mysql/curriculum.service';
import { TranslateModule } from '@ngx-translate/core';
/**
 * A felhasználó regisztrációját kezelő komponens
 */
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
    MatSelectModule,
    TranslateModule,
    MatSnackBarModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss'
})
export class RegistrationComponent implements OnDestroy, OnInit {
  
  /**
   * A komnpones inicializációja. Meg hihvam a loadCurriculums() és a setupRoleValidation().
   * @return Promise<void>
   */
  public async ngOnInit(): Promise<void> {
    this.loadCurriculums();
    this.setupRoleValidation();
  }
  /**
   * Betölti a tanterv neveket
   * @return Promise<void>
   */
  private async loadCurriculums(): Promise<void> {
    try {
      const curricula = await firstValueFrom(
        this.curriculumData.getAllCurriculumNames().pipe(takeUntil(this.kikapcs$))
      );
      this.curriculums = curricula;
    } catch (error) {
      console.error('Hiba a tantervek lekérésekor: ', error);
      this.snackBar.open('Hiba történt a tantervek betöltésekor!', 'OK', { duration: 3000 });
    }
  }
  /**
   * Dinamikusan álitja tanterv mező Validációját.
   * @returns void
   */
  private setupRoleValidation(): void {
    const roleControl = this.registForm.get('role');
    const curriculumControl = this.registForm.get('curriculum_id');

    if (!roleControl || !curriculumControl) {
      console.error('Form control hiba a validáció beállításakor!');
      return; 
    }

    roleControl.valueChanges.pipe(
      startWith(roleControl.value),
      takeUntil(this.kikapcs$)
    ).subscribe(role => {
      if (role === 'student') {
        curriculumControl.setValidators(Validators.required); 
        curriculumControl.enable();
      } else {
        curriculumControl.clearValidators(); 
        curriculumControl.setValue(null); 
        curriculumControl.disable(); 
      }
      curriculumControl.updateValueAndValidity(); 
    });
  }
  /**
   * Az oldal megsemisülése kor lezárja a szállakat.
   * @return void
   */
  public ngOnDestroy(): void {
    this.kikapcs$.next();
    this.kikapcs$.complete();
    this.loadingSubject.complete();
  }
  private kikapcs$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private curriculumData = inject(CurriculumService);
  protected curriculums: Name[] = [];
  private snackBar = inject(MatSnackBar)
  private loadingSubject = new BehaviorSubject<boolean>(false);
  protected loading$ = this.loadingSubject.asObservable().pipe(
    takeUntil(this.kikapcs$)
  );
  protected registForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(12)]],
    email: ['', [Validators.required, Validators.email]],
    role: this.fb.nonNullable.control<"student" | "teacher" | "admin">("student", Validators.required),
    curriculum_id: this.fb.nonNullable.control<number|null>(null),
  });

/**
 * Regisztráció form ellenörzése a regisztráció meghivása
 * @returns void
 */
protected onSubmit(): void {
    if (this.registForm.invalid) {
      this.registForm.markAllAsTouched();
      return;
    }
    this.register();
};
/**
 * A felhasználó regisztrálása.
 * @return void
 */
protected register(): void {
  this.loadingSubject.next(true);
  const rawValues = this.registForm.getRawValue();
  firstValueFrom(
    this.auth.register(rawValues).pipe( 
      takeUntil(this.kikapcs$), 
      tap(() => {
        this.snackBar.open('Successful registration!', 'OK', { duration: 3000 });
      }),
      catchError(error => {
        this.snackBar.open(error.error.message || 'Registration failed!', 'OK', {
          duration: 3000
        });
        return of(null); 
      }),
      finalize(() => this.loadingSubject.next(false))
    )
  ).catch(err => {
      console.warn('firstValueFrom caught an error after catchError handled it:', err);
  });
}
}
