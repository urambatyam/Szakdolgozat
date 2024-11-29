import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { UsersService } from '../../services/users.service';
import { IUser } from '../../models/IUser';

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
  fb = inject(FormBuilder);
  user = inject(UsersService);
  registForm = this.fb.nonNullable.group({
    userName: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(12)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{6,24}$/)]],
    tel: ['', [Validators.pattern(/^\+36\d{9}$/)]],
    major: ['', [Validators.required]],
    date: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    rang: ['', [Validators.required]]
  });

  errorMessage = signal('');
  hide = signal(true);

  constructor(private authService: AuthService) {
    merge(this.registForm.statusChanges, this.registForm.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessage());
  }

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  updateErrorMessage() {
    if (this.registForm.get('userName')?.hasError('required')) {
      this.errorMessage.set('Add meg a felhasználó nevet!');
    } else if (this.registForm.get('userName')?.hasError('minLength')) {
      this.errorMessage.set('A felhasználó legalább 4 karakter!');
    }else if (this.registForm.get('userName')?.hasError('maxLength')) {
      this.errorMessage.set('A felhasználó legfejebb 12 karakter!');
    }else {
      this.errorMessage.set('');
    }

    if (this.registForm.get('email')?.hasError('required')) {
      this.errorMessage.set('Add meg az email címet!');
    } else if (this.registForm.get('email')?.hasError('email')) {
      this.errorMessage.set('Ez nem egy valid email cím!');
    } else {
      this.errorMessage.set('');
    }

    if (this.registForm.get('password')?.hasError('required')) {
      this.errorMessage.set('Add meg a jelszót!');
    } else if (this.registForm.get('password')?.hasError('pattern')) {
      this.errorMessage.set('A jelszónak 6-24 karakter között kell lennije, és legalább egy betüt és számot kell tartalmaznia!');
    } else {
      this.errorMessage.set('');
    }

    if (this.registForm.get('tel')?.hasError('pattern')) {
      this.errorMessage.set('Ez nem egy valid telefonszám!');
    } else {
      this.errorMessage.set('');
    }

    if (this.registForm.get('major')?.hasError('required')) {
      this.errorMessage.set('Add meg a szakot!');
    } else {
      this.errorMessage.set('');
    }

    if (this.registForm.get('date')?.hasError('required')) {
      this.errorMessage.set('Add meg a kezdés évét!');
    } else if (this.registForm.get('date')?.hasError('pattern')) {
      this.errorMessage.set('A kezdés év csak 4 jegyű szám lehet!');
    } else {
      this.errorMessage.set('');
    }

    if (this.registForm.get('rang')?.hasError('required')) {
      this.errorMessage.set('Add meg a felhasználó rangját!');
    } else {
      this.errorMessage.set('');
    }

  }

  onSubmit(): void {
    console.log(this.registForm);
    if (this.registForm.invalid) {
      this.registForm.markAllAsTouched();
      return;
    }
    const dateValue = this.registForm.getRawValue().date;
    this.authService.register(this.registForm.getRawValue().email, this.registForm.getRawValue().password).then(cred => {
      const userId = cred.user?.uid;
      if (userId){
        const newUser:IUser = {
          id : userId,
          name : this.registForm.getRawValue().userName,
          tel : this.registForm.getRawValue().tel,
          email : this.registForm.getRawValue().email,
          password : this.registForm.getRawValue().password,
          major : this.registForm.getRawValue().major,
          start : isNaN(Number(dateValue)) ? 0 : Number(dateValue),
          rang : this.registForm.getRawValue().rang,
        }
        this.user.add(newUser).subscribe({
          next: savedId => console.log('Registráció sikeres:', savedId),
          error: err => console.error('Nem sikerült a felhasználót menteni:', err),
        });
      }else{
        console.error("Nem kaptunk visza felhasználó id-t a regsiztrációból");
      }
      }).catch(error => {
        console.error('Error during registration:', error);
      }
    )};
}