import { Component, inject, OnDestroy, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/mysql/auth.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { from, merge, Subject, takeUntil, tap } from 'rxjs';

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
export class LoginComponent implements OnDestroy{
  private kikapcs$ = new Subject<void>();
  ngOnDestroy(): void {
      this.kikapcs$.next();
      this.kikapcs$.complete();
  }
  users = inject(UsersService);
  //auth = inject(AuthService);
  auth = inject(AuthService);
  fb = inject(FormBuilder);
  hide = signal(true);
  router = inject(Router);
  errorMessage = signal('');
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }


  onSubmit(): void {
    console.log(this.loginForm.getRawValue());
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    /*this.auth.login(email, password).then(cred => {
      console.log(cred);
      
      this.router.navigateByUrl('curriculum')
      })*/
    from(this.auth.login(email, password)).pipe(
      takeUntil(this.kikapcs$),
      tap(()=>{
        console.log('Sikeres login');
        this.router.navigateByUrl('curriculum')
      })
    ).subscribe();
  };
}
