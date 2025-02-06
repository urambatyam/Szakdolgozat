import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Course } from '../../../models/course';
import { CourseForumService } from '../../../services/mysql/course-forum.service';
import { catchError, EMPTY, firstValueFrom, from, map, Subject, takeUntil, tap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CourseForum } from '../../../models/courseForum';
import { AuthService } from '../../../services/mysql/auth.service';

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
export class ForumComponent implements OnInit , OnDestroy{

  @Input() course:Course | null = null;
  @Output() backEvent = new EventEmitter<void>();

  fb = inject(NonNullableFormBuilder);
  forumData = inject(CourseForumService);
  auth = inject(AuthService);
  private getforum$ = new Subject<void>();

  forumForm = this.fb.group({
    text: ''
  });
  messages: CourseForum[] = [];
  async ngOnInit(): Promise<void> {
    if(this.course){
      try {
        from(this.forumData.getAllCourseForumsInCourse(this.course.name)).pipe(
          takeUntil(this.getforum$),
          map(
            forums => {
              this.messages = forums;
            }
          ),
          catchError(error => {console.error('Hiba:', error);return EMPTY;})
        ).subscribe();
      } catch (error) {
        console.error('Hiba:', error);
      }
    }
  }
  async onSubmit() {
    if (this.forumForm.valid) {
      const user_code = await firstValueFrom(
        from(this.auth.user$)
        .pipe(
          map(user => {return user?.code}),
          catchError(error => {console.error('Hiba:', error);return EMPTY;})
        ));
      const newMessage: CourseForum = {
        user_code: user_code || '', 
        course_name: this.course?.name ?? '',
        message: this.forumForm.value.text ?? '',
      };
      await firstValueFrom(
        from(this.forumData.createCourseForum(newMessage)).pipe(
          tap(() => {this.forumForm.reset();})
        )
      )
    }
  }

  back() {
    this.backEvent.emit();
  }
  ngOnDestroy(): void {
    this.getforum$.complete();
  }


}
