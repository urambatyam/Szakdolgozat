import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Course } from '../../../models/course';
import { CoursesService } from '../../../services/courses.service';
import { catchError, EMPTY, firstValueFrom, from } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
interface ForumMessage {
  userName: string;
  courseId: string;
  text: string;
  timestamp?: Date;
}
@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
  ],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss'
})
export class ForumComponent implements OnInit{

onSubmit() {
  if (this.forumForm.valid) {
    const newMessage: ForumMessage = {
      userName: 'Aktív Felhasználó', 
      courseId: this.courseId,
      text: this.forumForm.value.text ?? '',
      timestamp: new Date()
    };

    this.messages = [...this.messages, newMessage];
    

    this.forumForm.reset();
  }
}
  fb = inject(NonNullableFormBuilder);
  forumForm = this.fb.group({
    text: ''
  });

  @Input() courseId = '';
  @Output() backEvent = new EventEmitter<void>();
  course:Course|null = null;
  courseData = inject(CoursesService);
  messages: ForumMessage[] = [];
  TestForums:ForumMessage[] = [
    {userName: 'Réka', courseId:'1',text:'ffghgfhgjdfjfdhj', timestamp: new Date()},
    {userName: 'Béla', courseId:'1',text:'fsfdnhfgnjfgj', timestamp: new Date()},
    {userName: 'Réka', courseId:'1',text:'fffffffffffffffff', timestamp: new Date()},
    {userName: 'Béla', courseId:'1',text:'d', timestamp: new Date()},
    {userName: 'Sára', courseId:'1',text:'34645rrjnvfhtkxv534fd', timestamp: new Date()}
  ]
  async ngOnInit(): Promise<void> {
    try {
      this.course = await firstValueFrom(
        from(this.courseData.getById(this.courseId)).pipe(
          catchError(error => {
            console.error('Hiba:', error);
            return EMPTY;
          })
        )
      );
      this.messages = this.TestForums;
    } catch (error) {
      console.error('Hiba:', error);
    }
  }

  back() {
    this.backEvent.emit();
  }


}
