import { Component,inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
        MatCardModule, 
        MatInputModule, 
        MatFormFieldModule, 
        MatIconModule, 
        MatButtonModule, 
        ReactiveFormsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  fb = inject(FormBuilder);
  user = inject(UsersService);
  auth = inject(AuthService);

  updateUser:User|null = null;
  profilForm = this.fb.nonNullable.group(
      {
      userName: ['', [ Validators.minLength(4), Validators.maxLength(12)]],
      email: ['', [ Validators.email]],
      password: ['', [ Validators.minLength(6), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{6,24}$/)]],
      password2: ['', ],
      tel: ['', [Validators.pattern(/^\+36\d{9}$/)]],
      major: [{value: '', disabled: true}, ],
      date: [{value: '', disabled: true}, [ Validators.pattern(/^\d{4}$/)]],
      },
      {
        validators: this.passwordMatchValidator
      }
    );
    passwordMatchValidator(group: AbstractControl) {
      const password = group.get('password');
      const password2 = group.get('password2');
      
      if (password && password2 && password.value !== password2.value) {
        password2.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      }
      
      return null;
    }
    ngOnInit() {
      const storedUser = localStorage.getItem('user');
      
      if (!storedUser) {
        console.error('Nincs bejelentkezett felhasználó');
        // Itt kezelheted a hibát, például átirányítás a login oldalra
        return;
      }
    
      try {
        const logged = JSON.parse(storedUser);
        
        if (!logged.uid) {
          console.error('Hiányzó felhasználó ID');
          return;
        }
    
        const loggedUser: Observable<User|null> = this.user.getById(logged.uid);
        loggedUser.subscribe({
          next: (user) => {
            if (user) {
              this.updateUser = user;
              this.profilForm.patchValue({
                userName: user.name,
                email: user.email,
                tel: user.tel,
                major: user.major,
                date: user.start.toString()
              });
            }
          },
          error: (error) => {
            console.error('Hiba a felhasználó betöltésekor:', error);
          }
        });
      } catch (error) {
        console.error('Hiba a localStorage feldolgozásakor:', error);
      }
    }
  onSubmit(): void {
    console.log(this.profilForm);
    if (this.profilForm.invalid) {
      this.profilForm.markAllAsTouched();
      return;
    }
    if (this.updateUser) {
      const formValues = this.profilForm.getRawValue();

      const update: User = {
        ...this.updateUser,  
        name: formValues.userName || this.updateUser.name,
        email: formValues.email || this.updateUser.email,
        tel: formValues.tel || this.updateUser.tel,
      };
      this.user.updateById(update).subscribe({
        next: () => {
          console.log('Sikeres frissítés');
        },
        error: (error) => {
          console.error('Hiba történt:', error);
        }
      });
    }
 

  };
}
