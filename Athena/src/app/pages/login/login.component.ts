import { Component, inject, signal } from '@angular/core'; 
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/mysql/auth.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, tap, throwError } from 'rxjs'; 
import { TranslateModule } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
/**
 * A bejelentkezési folyamatot kezelő komponens.
 * Lehetővé teszi a felhasználók számára, hogy a kódjukkal és jelszavukkal hitelesítsenek.
 */
export class LoginComponent {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  protected hidePassword = signal(true); 
  protected errorMessage = signal(''); 
  protected loginForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern('^[0-9A-Z]{5}$')]],
    password: ['', [Validators.required]]
  });

  /**
   * A jelszó mező láthatóságát váltja (megjelenít/elrejt).
   * Megállítja az esemény továbbterjedését.
   * @param event Az egérkattintás eseményobjektuma.
   * @return void
   */
  protected togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.set(!this.hidePassword());
    event.stopPropagation();
  }

  /**
   * Kezeli a bejelentkezési űrlap elküldését.
   * Validálja az űrlapot, meghívja az AuthService login metódusát,
   * kezeli a sikeres bejelentkezést (navigáció) és a hibákat (hibaüzenet).
   * @return Promise<void>
   */
  protected async onSubmit(): Promise<void> { 
    this.errorMessage.set('');
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { code, password } = this.loginForm.getRawValue();
    try {
      await firstValueFrom(
        this.auth.login(code, password).pipe(
          tap(() => {
            console.log('Sikeres login');
            this.router.navigateByUrl('curriculum');
          }),
          catchError((error: unknown) => {
            console.error('Bejelentkezési hiba: ', error);
            if (error instanceof HttpErrorResponse && error.status === 401) {
              this.errorMessage.set('login.INVALID_CREDENTIALS');
            } else {
              this.errorMessage.set('login.GENERIC_ERROR');
            }
            return throwError(() => error);
          })
        )
      );
    } catch (error) {
      console.error('A firstValueFrom elkapta a hibát:', error);
    }
  }
}
