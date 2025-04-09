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
import { catchError, EMPTY, firstValueFrom, from, map, Subject } from 'rxjs';
import { ForumComponent } from "./forum/forum.component";
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { AuthService } from '../../services/mysql/auth.service';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { Name } from '../../models/curriculumNames';
@Component({
  selector: 'app-course-forum',
  standalone: true,
  imports: [
    MatChipsModule,
    MatAutocompleteModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    TranslateModule
],
  templateUrl: './course-forum.component.html',
  styleUrl: './course-forum.component.scss'
})
export class CourseForumComponent implements OnInit, OnDestroy{



  
  selectedPrerequisites: Name[] = [];
  separatorKeyCodes = [ENTER, COMMA];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  protected totalItems = 0;
  protected pageSize = 10;
  protected currentPage = 0;
  protected sortDirection: 'asc' | 'desc' = 'asc';
  protected sortField = 'name';
  protected filterValue = '';
  private router = inject(Router)
  private getAllCourses$ = new Subject<void>();
  private courseData = inject(CourseService)
  private auth = inject(AuthService)
  protected VisForm: boolean = false;
  private update:boolean = false;
  private fb = inject(NonNullableFormBuilder);
  protected CourseForm = this.fb.group({
    id: this.fb.control<number | null>(null),
    recommendedSemester: this.fb.control<number | null>(null),
    user_code: this.fb.control<string | null>(null),
    name: this.fb.control<string | null>(null),
    kredit: this.fb.control<number | null>(null),
    sezon: this.fb.control<number>(2),
    prerequisites: this.fb.control<Name[] | null>(null),
  });
  protected courseNames: Course[] = [];
  protected title: any;
  protected displayedColumns: string[] = ['name', 'update', 'delete', 'controller', 'view'];
  selectedCourse: Course|null = null;

  addPrerequisite(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value.trim();
  
    if (value) {
      const matchedCourse = this.courseNames.find(
        c => c.name?.toLowerCase() === value.toLowerCase()
      );
  
      if (matchedCourse && matchedCourse.id && matchedCourse.name &&!this.selectedPrerequisites.some(p => p.id === matchedCourse.id)) {
        this.selectedPrerequisites.push({
          id: matchedCourse.id, 
          name: matchedCourse.name
        });
        
        this.CourseForm.get('prerequisites')?.setValue(this.selectedPrerequisites);
        input.value = '';
      }
    }
  }
  removePrerequisite(course: Name) {
    const index = this.selectedPrerequisites.findIndex(p => p.id === course.id);
    if (index >= 0) {
      this.selectedPrerequisites.splice(index, 1);
      // Frissítse a form értékét
      this.CourseForm?.get('prerequisites')?.setValue(this.selectedPrerequisites);
    
    }
  }
  onPrerequisiteSelected(event: MatAutocompleteSelectedEvent) {
    const selectedCourse = event.option.value;
    if (!this.selectedPrerequisites.some(p => p.id === selectedCourse.id)) {
      this.selectedPrerequisites.push(selectedCourse);
      // Frissítse a form értékét
      this.CourseForm?.get('prerequisites')?.setValue(this.selectedPrerequisites);
    }
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
    await firstValueFrom(
      from(this.courseData.getAllCoursesOFUser(
        user_code,
        this.currentPage + 1,
        this.pageSize,
        this.sortField,
        this.sortDirection,
        this.filterValue
      )).pipe(
        map(response => {
          this.courseNames = response.data;
          this.totalItems = response.total;
        }),
        catchError(error => {
          console.error('Hiba: ', error);
          return EMPTY;
        })
      )
    );
  }
  ngOnInit(): void {
    this.getAllCourses();
  }


  

  protected toCourseForm(course: Course) {
    this.router.navigate(
      ['/forum'],
      {state: {course: course}}
    )
    console.log("Irány a ", course, " kurzus forumra!")
  }

  protected toElectronicController(courseId:number, courseName:string){
     this.router.navigate(
      ['courses-grades'],
      {state: {courseId: courseId, courseName: courseName}}
    )
    console.log("Irány a ", courseId, " ",courseName," elenörző!")
  }

  async toupdate(course: Course) {
    this.update = true;
    this.selectedPrerequisites = [];
    if (course) {
      let sezonV = 0
      if(course.sezon === null){
        sezonV = 2;
      }else if(course.sezon){
        sezonV = 1;
      }
      if(course.id != undefined && typeof(course.id) == 'number' ){
        if (course.prerequisites && course.prerequisites.length > 0) {
          this.selectedPrerequisites = [];
        }
        this.CourseForm.patchValue({
        id: course.id,
        recommendedSemester: course.recommendedSemester,
        user_code: course.user_code ?? '',
        name: course.name,
        kredit: course.kredit,
        sezon:sezonV,
        prerequisites: []
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
      this.getAllCourses();
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
    let sezonV:boolean|null = false;
    if(formValues.sezon === 2){
      sezonV = null;
    }else if(formValues.sezon === 1){
      sezonV = true;
    }
    
    const newCourse:Course = {
      id: formValues.id==-1 ? null:formValues.id,
      recommendedSemester: formValues.recommendedSemester,
      user_code: formValues.user_code,
      name: formValues.name,
      kredit: formValues.kredit,
      subjectMatter: null,
      subjectResponsible: null,
      sezon: sezonV,
      prerequisites: formValues.prerequisites ? 
      formValues.prerequisites.map(prereq => prereq.id) : 
      null,
    };
    console.log(newCourse);

    try {
      
        if (this.update) {
          if(newCourse.id != null){
            await firstValueFrom(
              from(this.courseData.updateCourse(newCourse))
            );
            this.getAllCourses()
            console.log('Sikeresen frissítettem a kurzus adatait.');
          }
        } else {
          console.log(newCourse);
          
          await firstValueFrom(
            from(this.courseData.createCourse(newCourse))
          );
          this.getAllCourses()
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
