import { Component, inject, Input, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { CourseForum } from '../../../../models/courseForum';
import { catchError, EMPTY, firstValueFrom, from, map, tap } from 'rxjs';
import { CourseForumService } from '../../../../services/mysql/course-forum.service';
import { DatePipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    TranslateModule,
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    DatePipe
  ],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit{
  @Input() courseId:number|null = null;
  private fb = inject(NonNullableFormBuilder);
  private forumData = inject(CourseForumService);
  protected forumForm = this.fb.group({
    text: ''
  });
  protected messages: CourseForum[] = [];
  async ngOnInit(): Promise<void> {
    if(this.courseId){
      this.getForums(this.courseId);
    }else{
      console.log("nem kaptam meg a kurzus id-t",this.courseId);
    }
  }
  private getForums(courseId:number){
    firstValueFrom(from(this.forumData.getAllCourseForumsInCourse(courseId)).pipe(
      map(
        forums => {
          this.messages = forums;
        }
      ),
      catchError(error => {console.error('Hiba:', error);return EMPTY;})
    ))
  }
  async onSubmit() {
    if (this.forumForm.valid) {
        if(this.courseId && this.forumForm.value.text){
          const newMessage: CourseForum = {
            course_id: this.courseId,
            message: this.forumForm.value.text,
          };
          await firstValueFrom(
            from(this.forumData.createCourseForum(newMessage)).pipe(
              tap(() => {this.forumForm.reset();}),
              catchError(error => {console.error('Hiba:', error);return EMPTY;})
            )
          )
          this.getForums(this.courseId);
        }else{
          console.log("nem kaptam meg a kurzus id-t",this.courseId);
        }
    }
  }
}
