import { Component,inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../services/mysql/user.service';
import { AuthService } from '../../services/mysql/auth.service';
import { User } from '../../models/user';
import { catchError, EMPTY, firstValueFrom, from, map, Observable, Subject, takeUntil, tap } from 'rxjs';
import {
  MatDialog
} from '@angular/material/dialog';
import { PasswordDialogComponent } from './password-dialog/password-dialog.component';

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
export class ProfileComponent implements OnInit , OnDestroy{
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private destroy$ = new Subject<void>();
  readonly dialogNewPassword = signal('');
  readonly dialogOldPassword = signal('');
  readonly dialog = inject(MatDialog);

  openPasswordDialog(): void {
    const dialogRef = this.dialog.open(PasswordDialogComponent, {
      data: { email: this.dialogOldPassword(), password: this.dialogNewPassword()},
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.dialogNewPassword.set(result.password);
        this.dialogOldPassword.set(result.email);
        console.log('result' + result);
      }
      this.user.updatePassword(this.dialogOldPassword(),this.dialogNewPassword(),this.dialogNewPassword());
    });
  }


  private fb = inject(FormBuilder);
  private user = inject(UserService);
  private auth = inject(AuthService);

  updateUser:User|null = null;
  protected profilForm = this.fb.nonNullable.group(
      {
      name: ['', [ Validators.minLength(4), Validators.maxLength(12)]],
      email: ['',[Validators.email]],
      role:  this.fb.nonNullable.control<"student" | "teacher" | "admin">("student"),
      }
    );

    ngOnInit() {
      this.getUSer();
    }

    private async getUSer(){
      await firstValueFrom(
        from(this.auth.user$).pipe(
          map(user => {
            this.profilForm.patchValue({
              name: user?.name,
              email: user?.email,
              role: user?.role
            });
          }),
          tap( r =>{
            console.log('Sikeres felhasználói adat lekérés '+r);
            }
          ),
          catchError(error => {
            console.error('Hiba: ', error);
            return EMPTY;
          })
        )
      );
    }

  protected onSubmit(): void {
    console.log(this.profilForm);
    if (this.profilForm.invalid) {
      this.profilForm.markAllAsTouched();
      return;
    }
    const formValues = this.profilForm.getRawValue();
    firstValueFrom(
      from(this.user.update(formValues)).pipe(
        tap( r =>{
          console.log('Sikeres frissítés '+r);
          }
        ),
        catchError(error => {
          console.error('Hiba: ', error);
          return EMPTY;
        })
      )
    )
    this.getUSer();
  };
  
}
