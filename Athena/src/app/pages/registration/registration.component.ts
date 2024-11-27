import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    MatCardModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatIconModule, 
    MatButtonModule, 
    ReactiveFormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss'
})
export class RegistrationComponent {
  //authService = inject(AuthService);
  fb = inject(FormBuilder);
  router = inject(Router);

  form = this.fb.nonNullable.group({
    userName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  errorMessage = signal('');
  hide = signal(true);

  constructor(private authService: AuthService) {
    merge(this.form.statusChanges, this.form.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessage());
  }

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  updateErrorMessage() {
    const controls = this.form.controls;
    if (controls.userName.hasError('required')) {
      this.errorMessage.set('Felhasználónév megadása kötelező');
    } else if (controls.email.hasError('required')) {
      this.errorMessage.set('Email megadása kötelező');
    } else if (controls.email.hasError('email')) {
      this.errorMessage.set('Érvénytelen email formátum');
    } else if (controls.password.hasError('required')) {
      this.errorMessage.set('Jelszó megadása kötelező');
    } else if (controls.password.hasError('minLength')) {
      this.errorMessage.set('Jelszónak min. 6 karakter hosszúnak kell lennie');
    } else {
      this.errorMessage.set('');
    }
  }

  onSubmit(): void {
    console.log(this.form);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, userName, password } = this.form.getRawValue();
    this.authService.register(email, password).then(cred => {
      console.log(cred);
      })};
}