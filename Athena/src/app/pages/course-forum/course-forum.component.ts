import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CourseService } from '../../services/mysql/course.service';
import { Course } from '../../models/course';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {  MatButtonModule } from '@angular/material/button';
import { catchError, EMPTY, firstValueFrom, from, map, Subject, takeUntil, tap } from 'rxjs';
import { ForumComponent } from "./forum/forum.component";
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { AuthService } from '../../services/mysql/auth.service';

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
    ForumComponent,
    MatPaginatorModule,
    MatSortModule
],
  templateUrl: './course-forum.component.html',
  styleUrl: './course-forum.component.scss'
})
export class CourseForumComponent implements OnInit, OnDestroy{
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  sortDirection: 'asc' | 'desc' = 'asc';
  sortField = 'name';
  filterValue = '';

  private getAllCourses$ = new Subject<void>();
  courseData = inject(CourseService)
  auth = inject(AuthService)
  VisForm: boolean = false;
  update:boolean = false;
  private fb = inject(NonNullableFormBuilder);
  CourseForm = this.fb.group({
    id: this.fb.control<number | null>(null),
    recommendedSemester: this.fb.control<number | null>(null),
    user_code: this.fb.control<string | null>(null),
    name: this.fb.control<string | null>(null),
    kredit: this.fb.control<number | null>(null),
  });
  courseNames: Course[] = [];
  title: any;
  displayedColumns: string[] = ['name', 'update', 'delete', 'view'];
  forum: boolean = false;
  selectedCourse: Course|null = null;

  backFromForum() {
    this.forum = false;
    this.selectedCourse = null;
  }

  handlePageEvent(e: PageEvent) {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    this.getAllCourses();
  }

  handleSort(e: Sort) {
    this.sortDirection = e.direction as 'asc' | 'desc';
    this.sortField = e.active;
    this.getAllCourses();
  }

  applyFilter(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value;
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.getAllCourses();
  }

  async getAllCourses(){
    const user_code = await firstValueFrom(from(this.auth.user$).pipe(map(user=>{return user?.code ?? ''})))
    from(this.courseData.getAllCoursesOFUser(
      user_code,
      this.currentPage + 1,
      this.pageSize,
      this.sortField,
      this.sortDirection,
      this.filterValue
    )).pipe(
      takeUntil(this.getAllCourses$),
      map(response => {
        this.courseNames = response.data;
        this.totalItems = response.total;
      }),
      catchError(error => {
        console.error('Hiba: ', error);
        return EMPTY;
      })
    ).subscribe();
  }
  ngOnInit(): void {
    this.getAllCourses();
  }


  
  toview(course: Course) {
    console.log(course.name);
    this.selectedCourse = course;
    this.forum = true;
  }

  async toupdate(course: Course) {
    this.update = true;
    if (course) {
      if(course.id != undefined && typeof(course.id) == 'number' ){
        this.CourseForm.patchValue({
        id: course.id,
        recommendedSemester: course.recommendedSemester,
        user_code: course.user_code ?? '',
        name: course.name,
        kredit: course.kredit,
        });
      }
 
      console.log(`Sikeresen lekértem a ${course.id} kurzus adatait updatere.`);
      console.log(this.CourseForm.getRawValue());
    }
    this.VisForm = true;
  }
  async todelete(course_id: number) {
    try {
      await firstValueFrom(
        from(this.courseData.deleteCourse(course_id)).pipe(
          catchError(error => {
            console.error('Hiba:', error);
            return EMPTY;
          })
        )
      );
      console.log('Sikeresen töröltem '+course_id+' egy kurzust.');
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
    
    const newCourse:Course = {
      id: formValues.id==-1 ? null:formValues.id,
      recommendedSemester: formValues.recommendedSemester,
      user_code: formValues.user_code,
      name: formValues.name,
      kredit: formValues.kredit,
      subjectMatter: null,
      subjectResponsible: null,
    };
    console.log(newCourse);

    try {
      if(newCourse.id != null){
        if (this.update) {
          await firstValueFrom(
            from(this.courseData.updateCourse(newCourse))
          );
          console.log('Sikeresen frissítettem a kurzus adatait.');
        } else {
          await firstValueFrom(
            from(this.courseData.createCourse(newCourse))
          );
          console.log('Sikeresen létrehoztam az új kurzust.');
        }
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
