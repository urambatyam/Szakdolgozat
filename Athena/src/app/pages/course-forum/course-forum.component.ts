import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CoursesService } from '../../services/courses.service';
import { Course } from '../../models/course';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {  MatButtonModule } from '@angular/material/button';
import { catchError, EMPTY, firstValueFrom, from, map, Subject, takeUntil, tap } from 'rxjs';
import { ForumComponent } from "./forum/forum.component";

@Component({
  selector: 'app-course-forum',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatIconModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    ForumComponent
],
  templateUrl: './course-forum.component.html',
  styleUrl: './course-forum.component.scss'
})
export class CourseForumComponent implements OnInit, OnDestroy{
backFromForum() {
  this.forum = false;
  this.courseId = '';
}
  private getAllCourses$ = new Subject<void>();
  courseData = inject(CoursesService)
  VisForm: boolean = false;
  update:boolean = false;
  private fb = inject(NonNullableFormBuilder);
  CourseForm = this.fb.group({
    recommendedSemester: 0,
    subjectResponsible: '',
    name: '',
    kredit: 0,
  });
  courseNames: Course[] = [];
  title: any;
  displayedColumns: string[] = ['name', 'update', 'delete', 'view'];
  forum: boolean = false;
  courseId: string = '';

  ngOnInit():  void {
    this.VisForm = false;
    this.courseNames = [];
    try{
      from(this.courseData.getAll()).pipe(
        takeUntil(this.getAllCourses$),
        map(c => {
          this.courseNames = c;
        }),
        tap( () => {
          console.log(`Sikeresen az Összes kurzust.`);
        }),
        catchError(error => {
          console.error('Hiba: ', error);
          return EMPTY; 
        }),
      ).subscribe();
    }catch(e){
      console.log('Hiba betöltésnél: ',e);
    }

  }
  
  toview(name: string) {
    console.log(name);
    this.courseId = name;
    this.forum = true;
  }

  async toupdate(name: string) {
    this.update = true;
    try {
      const course = await firstValueFrom(
        from(this.courseData.getById(name)).pipe(
          catchError(error => {
            console.error('Hiba:', error);
            return EMPTY;
          })
        )
      );

      if (course) {
        this.CourseForm.patchValue({
          recommendedSemester: course.recommendedSemester,
          subjectResponsible: course.subjectResponsible,
          name: course.name,
          kredit: course.kredit,
        });
        console.log(`Sikeresen lekértem a ${course.name} kurzus adatait updatere.`);
      }
    } catch (error) {
      console.error('Hiba:', error);
    }
    this.VisForm = true;
  }
  async todelete(id: string) {
    try {
      await firstValueFrom(
        from(this.courseData.deleteById(id)).pipe(
          catchError(error => {
            console.error('Hiba:', error);
            return EMPTY;
          })
        )
      );
      console.log('Sikeresen töröltem egy kurzust.');
    } catch (error) {
      console.error('Hiba:', error);
    }
  }
  create() {
    this.VisForm = true; 
  }
  close(){
    this.update = false;
    this.VisForm = false;
  }
  async onSubmit() {
    const formValues = this.CourseForm.getRawValue();
    const newCourse: Course = {
      id: '',
      recommendedSemester: formValues.recommendedSemester,
      subjectResponsible: formValues.subjectResponsible,
      name: formValues.name,
      kredit: formValues.kredit,
      subjectMatter: '',
      requirementsId: ''
    };

    try {
      if (this.update) {
        await firstValueFrom(
          from(this.courseData.updateByName(formValues.name, newCourse))
        );
        console.log('Sikeresen frissítettem a kurzus adatait.');
      } else {
        await firstValueFrom(
          from(this.courseData.add(newCourse))
        );
        console.log('Sikeresen létrehoztam az új kurzust.');
      }
      this.VisForm = false;
      this.update = false;
    } catch (error) {
      console.error('Hiba:', error);
    }
  }


  ngOnDestroy(): void {
    this.getAllCourses$.complete();
  }
}
