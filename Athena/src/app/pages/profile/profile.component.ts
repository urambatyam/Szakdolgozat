import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/mysql/auth.service';
import { catchError, EMPTY, Subject, takeUntil, tap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './dialog/dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; 
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; 
/**
 * A felhasználó adatainak megjelenítése, jelszó, email változtatás.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatSnackBarModule 
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar); 
  private translate = inject(TranslateService); 

  protected profilForm = this.fb.nonNullable.group({
    code: [{ value: "", disabled: true }],
    name: [{ value: "", disabled: true }],
    email: [{ value: "", disabled: true }],
    role: this.fb.nonNullable.control<"student" | "teacher" | "admin">({ value: "student", disabled: true }),
  });

  /**
  * Az oldal inicializálása, feliratkozik a felhasználói adatokra.
  * @returns void
  */
  public ngOnInit(): void {
    this.subscribeToUserUpdates(); 
  }

  /**
   * Az oldal megsemmisülésekor lezárja a feliratkozásokat.
   * @returns void
   */
  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Feliratkozik az AuthService user$ observable-jére és frissíti a formot.
   */
  private subscribeToUserUpdates(): void {
    this.auth.user$.pipe(
      takeUntil(this.destroy$),
      tap(user => {
        if (user) {
          this.profilForm.patchValue({
            code: user.code,
            name: user.name,
            email: user.email,
            role: user.role
          }, { emitEvent: false });
        } else {
          this.profilForm.reset();
        }
      }),
      catchError(error => {
        console.error('Hiba a felhasználói adatokra való feliratkozáskor: ', error);
        this.showSnackbar('profile.ERROR_LOADING_USER_DATA', 'error-snackbar');
        return EMPTY;
      })
    ).subscribe();
  }

  /**
   * Megnyit egy dialógust a jelszó/email megváltoztatásához.
   * @param isPassword - Igaz, ha jelszómódosítás, hamis, ha email módosítás.
   * @returns void
   */
  openDialog(isPassword: boolean): void {
    const currentUserCode = this.profilForm.getRawValue().code;
    const currentUserEmail = this.profilForm.getRawValue().email;

    if (!currentUserCode) {
      console.error("Felhasználói kód nem elérhető a dialógus megnyitásához.");
      this.showSnackbar('profile.ERROR_USER_CODE_MISSING', 'error-snackbar');
      return;
    }

    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
          code: currentUserCode,
          email: currentUserEmail,
          isPassword: isPassword,
      },
    });


    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result) {

        const updateObservable = isPassword
          ? this.auth.updatePassword(currentUserCode, result.password, result.new) 
          : this.auth.updateEmail(currentUserCode, result.password, result.new);

        updateObservable.pipe(
          catchError(error => {
            console.error('Hiba a frissítés során: ', error);
            const errorKey = isPassword ? 'profile.ERROR_PASSWORD_UPDATE' : 'profile.ERROR_EMAIL_UPDATE';
            this.showSnackbar(errorKey, 'error-snackbar', { message: error.message || 'Ismeretlen hiba' });
            return EMPTY;
          })
        ).subscribe({
          next: () => {
            const successKey = isPassword ? 'profile.SUCCESS_PASSWORD_UPDATE' : 'profile.SUCCESS_EMAIL_UPDATE';
            this.showSnackbar(successKey, 'success-snackbar');
          },
        });
      }
    });
  }

  /**
   * Segédfüggvény MatSnackBar megjelenítéséhez fordítással.
   * @param messageKey - A fordítási kulcs az üzenethez.
   * @param panelClass - CSS osztály a snackbar stílusozásához.
   * @param interpolateParams - Opcionális paraméterek a fordításhoz.
   * @param duration - Megjelenítési időtartam (ms).
   */
  private showSnackbar(
    messageKey: string,
    panelClass: string = '',
    interpolateParams?: object,
    duration: number = 4000 
  ): void {
    this.translate.get(messageKey, interpolateParams).pipe(takeUntil(this.destroy$)).subscribe((translatedMessage: string) => {
      this.snackBar.open(translatedMessage, this.translate.instant('GENERAL.CLOSE'), { 
        duration: duration,
        panelClass: [panelClass] 
      });
    });
  }
}
