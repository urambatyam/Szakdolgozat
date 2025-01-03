import {ChangeDetectionStrategy, Component, inject, model, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-email-dialog',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  templateUrl: './email-dialog.component.html',
  styleUrl: './email-dialog.component.scss'
})

export class EmailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EmailDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA);
  readonly password = model<string>(this.data.password);
  readonly email = model<string>(this.data.email);
  readonly old = model<string>(this.data.old);

  onNoClick(): void {
    this.dialogRef.close();
  }
}
