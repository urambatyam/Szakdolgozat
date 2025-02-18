import { Component,  inject, OnInit} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Course } from '../../../models/course';
import { CourseForumService } from '../../../services/mysql/course-forum.service';
import { catchError, EMPTY, firstValueFrom, from, map, tap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CourseForum } from '../../../models/courseForum';
import { Location } from '@angular/common';

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
export class ForumComponent implements OnInit {


  private location = inject(Location);
  private fb = inject(NonNullableFormBuilder);
  private forumData = inject(CourseForumService);
  protected course: Course | null = null;

  forumForm = this.fb.group({
    text: ''
  });
  protected messages: CourseForum[] = [];
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
  async ngOnInit(): Promise<void> {
    const state = history.state;
    this.course = state.course;
    if(this.course && this.course.id){
      this.getForums(this.course.id);
    }
  }
  async onSubmit() {
    if (this.forumForm.valid) {
        if(this.course && this.course.id && this.forumForm.value.text){
          const newMessage: CourseForum = {
            course_id: this.course.id,
            message: this.forumForm.value.text,
          };
          await firstValueFrom(
            from(this.forumData.createCourseForum(newMessage)).pipe(
              tap(() => {this.forumForm.reset();})
            )
          )
          this.getForums(this.course.id);
        }
    }
  }

  back() {
    this.location.back();
  }



}
