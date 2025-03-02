import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Location } from '@angular/common';
import { Grade } from '../../models/grade';
import { Semester } from '../../models/semester';
import { catchError, EMPTY, firstValueFrom, from, map, tap } from 'rxjs';
import { GradeService } from '../../services/mysql/grade.service';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { AuthService } from '../../services/mysql/auth.service';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-electronic-controller',
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
        MatPaginatorModule,
        MatSortModule,
        MatInputModule,
        MatSelectModule,
        TranslateModule
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  templateUrl: './electronic-controller.component.html',
  styleUrl: './electronic-controller.component.scss'
})
export class ElectronicControllerComponent implements OnInit {
  async ngOnInit(){
    await firstValueFrom(
      from(this.authService.user$)
      .pipe(
        map(user =>{
          if(user){
            this.viewMode = user?.role === "student" ? 'student':'course';
          }
        })
      )
    );
    if(this.viewMode === 'course'){
      const state = history.state;
      this.title = state.courseName;
      this.courseId = state.courseId;
      this.displayedColumns = ['user_code', 'grade'];
      this.columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
      this.sortField = 'user_code';
    }else if(this.viewMode === 'student'){
      this.title = 'Ellenőrző';
      this.displayedColumns = ['course_name', 'grade'];
      this.columnsToDisplayWithExpand = [...this.displayedColumns, 'remove'];
      this.sortField = 'course_name';
      this.studentCode = await firstValueFrom(from(this.authService.user$).pipe(map(user =>{return user?.code})));
    }
    console.log(this.viewMode);
    this.getGrades();
  }
  
  protected title: string = '';
  private location = inject(Location);
  private gradeService = inject(GradeService);
  private authService = inject(AuthService);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  //@ViewChild('gradeInput') gradeInput!: ElementRef<HTMLInputElement>;
  
  protected totalItems = 0;
  protected pageSize = 10;
  protected currentPage = 0;
  protected sortDirection: 'asc' | 'desc' = 'asc';
  protected sortField = 'user_code';
  protected filterValue = '';
  protected grades: Grade[] = [];
  protected displayedColumns: string[] = [];
  protected columnsToDisplayWithExpand: string[] = [];
  protected expandedElement: Grade | null = null;
  private courseId?: number;
  private studentCode?: string;
  protected semesters: Semester[] =[];
  protected viewMode: 'course' | 'student' = 'student';
  protected ALL_SEMESTERS = { id: 'all', label: 'Összes szemeszter' };
  protected selectedSemesterOption: any = this.ALL_SEMESTERS;
  protected selectedSemester: Semester | null = null;
  protected currentSemester: Semester | null = null;
  protected upgrades = ['ø',1,2,3,4,5];

  protected async remove(element: Grade){
    if(element.id){
      await firstValueFrom(
        from(this.gradeService.deleteGrade(element.id))
        .pipe(
          tap(
            response => {
              console.log('sikeresen töröltem a tárgy felvételt ')
              console.log(response)
            }
          )
        )
      )
      this.getGrades();
    }
  }

  protected GradeSelectionChange(event: MatSelectChange,element:Grade){
    console.log("kiválasztot ", event.value, ' jegy ',element);
    this.update(event.value, element);
  }
  
  protected async update(slected:string|number, element: Grade) {
    const updatedGrade: Grade = {
      ...element,
      grade: typeof(slected) == 'number' ? slected:null
    }
    if (this.courseId) {
      try {
        await firstValueFrom(
          from(this.gradeService.updateGrade(updatedGrade)).pipe(
            tap(response => {
              console.log("Sikeresen módosítottam az osztályzatot");
              console.log(response);
              element.grade = updatedGrade.grade;
              this.expandedElement = null;
              })
            )
          );
        } catch (error) {
          console.error('Hiba a jegy frissítésekor:', error);
        }
      }
  }

  back() {
    this.location.back();
  }
  
  async getGrades() {
    console.log('getgrades ',this.viewMode,' id ',this.courseId)
    try{
      const params: any = {
        page: this.currentPage + 1,
        per_page: this.pageSize,
        sort_field: this.sortField,
        sort_direction: this.sortDirection
      };
      if (this.filterValue) {
        params.filter = this.filterValue;
      }
      if (this.selectedSemester) {
        params.year = this.selectedSemester.year;
        params.sezon = this.selectedSemester.sezon;
      }
      let response;
      if (this.viewMode === 'course' && this.courseId){
        response = await firstValueFrom(
          from(this.gradeService.getAllGradesInCourse(this.courseId, params)).pipe(
            catchError(error => {
              console.error('Hiba: ', error);
              return EMPTY;
            })
          )
        );
      }else if (this.viewMode === 'student' && this.studentCode){
        response = await firstValueFrom(
          from(this.gradeService.getAllGradesOFStudent(this.studentCode, params)).pipe(
            catchError(error => {
              console.error('Hiba: ', error);
              return EMPTY;
            })
          )
        );
      }
      if(response){
        this.grades = response.grades.data;
        this.semesters = response.semesters;
        this.totalItems = response.grades.total;
        this.currentSemester = this.semesters.find((s) => s.current == true) ?? null;  
      }
    }catch (error) {
      console.error('Hiba a jegyek lekérésekor:', error);
    }
    console.log("currwent ",this.currentSemester)
  }
  
  handlePageEvent(e: PageEvent) {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    this.getGrades();
  }
  
  handleSort(e: Sort) {
    this.sortDirection = e.direction as 'asc' | 'desc';
    this.sortField = e.active;
    this.getGrades();
  }
  
  applyFilterUserCode(e: KeyboardEvent) {
    this.filterValue = (e.target as HTMLInputElement).value;
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.getGrades();
  }

  protected filterBySemester(option: any) {
    if (option === this.ALL_SEMESTERS) {
      this.selectedSemester = null;
      this.selectedSemesterOption = this.ALL_SEMESTERS;
    } else {
      this.selectedSemester = option;
      this.selectedSemesterOption = option;
    }
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.getGrades();
  }

  protected formatSemester(semester: Semester): string {
    if (!semester) return 'Összes szemeszter';
    const season = semester.sezon ? "Ősz" : "Tavasz";
    return `${semester.year} ${season}`;
  }
}