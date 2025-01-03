import { Component, inject, ChangeDetectionStrategy} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from '../../services/users.service';
import { User } from '../../models/user';

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
  authService = inject(AuthService);
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
    const dateValue = this.registForm.getRawValue().date;
    this.authService.register(this.registForm.getRawValue().email, this.registForm.getRawValue().password).then(cred => {
      const userId = cred.user?.uid;
      if (userId){
        const newUser:User = {
          id : userId,
          name : this.registForm.getRawValue().userName,
          tel : this.registForm.getRawValue().tel,
          //email : this.registForm.getRawValue().email,
          //password : this.registForm.getRawValue().password,
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