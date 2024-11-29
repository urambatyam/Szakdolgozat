import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatCardModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatIconModule, 
    MatButtonModule, 
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  users = inject(UsersService);
  auth = inject(AuthService);
  fb = inject(FormBuilder);
  hide = signal(true);
  router = inject(Router);
  errorMessage = signal('');
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(24)]]
  });
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }
  constructor() {
    merge(this.loginForm.statusChanges, this.loginForm.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessage());
  }
  updateErrorMessage() {
    if (this.loginForm.get('email')?.hasError('required')) {
      this.errorMessage.set('Add meg az email címet!');
    } else if (this.loginForm.get('email')?.hasError('email')) {
      this.errorMessage.set('Ez nem egy valid email cím!');
    } else {
      this.errorMessage.set('');
    }
    if (this.loginForm.get('password')?.hasError('required')) {
      this.errorMessage.set('Add meg a jelszót!');
    } else if (this.loginForm.get('password')?.hasError('minLength')) {
      this.errorMessage.set('A jelszónak legalább 6 karakter!');
    } else if (this.loginForm.get('password')?.hasError('maxLength')) {
      this.errorMessage.set('A jelszó nem hoszabb 24 karakternél!');
    } else {
      this.errorMessage.set('');
    }
  }
  onSubmit(): void {
    console.log(this.loginForm.getRawValue());
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.auth.login(email, password).then(cred => {
      console.log(cred);
      this.router.navigateByUrl('curriculum')
      })};
}
