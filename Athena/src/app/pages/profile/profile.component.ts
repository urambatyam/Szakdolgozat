import { Component,inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';
import { Observable } from 'rxjs';
import {
  MatDialog
} from '@angular/material/dialog';
import { EmailDialogComponent } from './email-dialog/email-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
        MatCardModule, 
        MatInputModule, 
        MatFormFieldModule, 
        MatIconModule, 
        MatButtonModule, 
        ReactiveFormsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  readonly dialogNewPassword = signal('');
  readonly dialogOldPassword = signal('');
  readonly dialog = inject(MatDialog);

  openPasswordDialog(): void {
    const dialogRef = this.dialog.open(EmailDialogComponent, {
      data: { email: this.dialogOldPassword(), password: this.dialogNewPassword()},
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.dialogNewPassword.set(result.password);
        this.dialogOldPassword.set(result.email);
        console.log('result' + result);
      }
      this.auth.changePassword(this.dialogOldPassword(),this.dialogNewPassword());
    });
  }


  fb = inject(FormBuilder);
  user = inject(UsersService);
  auth = inject(AuthService);
  email:string = '';


  updateUser:User|null = null;
  profilForm = this.fb.nonNullable.group(
      {
      userName: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(12)]],
      tel: ['', [Validators.required, Validators.pattern(/^\+36\d{9}$/)]],
      major: [{value: '', disabled: true}, ],
      date: [{value: '', disabled: true}, ],
      email: [{value: '', disabled: true},],
      }
    );

    ngOnInit() {
      const storedUser = localStorage.getItem('user');
      console.log("van storedUser");
      
      if (!storedUser) {
        console.error('Nincs bejelentkezett felhasználó');
        return;
      }
    
      try {
        const logged = JSON.parse(storedUser);
        
        if (!logged.uid) {
          console.error('Hiányzó felhasználó ID');
          return;
        }
        this.email = logged.email

    
        const loggedUser: Observable<User|null> = this.user.getById(logged.uid);

        loggedUser.subscribe({
          next: (user) => {
            if (user) {
  
              this.updateUser = user;
              this.profilForm.patchValue({
                userName: user.name,
                tel: user.tel,
                major: user.major,
                date: user.start.toString(),
                email: logged.email
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
