import { Component, inject, OnInit, ViewChild } from '@angular/core';
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
import { catchError, EMPTY, firstValueFrom, from, map } from 'rxjs';
import { GradeService } from '../../services/mysql/grade.service';

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
        MatSortModule
  ],
  templateUrl: './electronic-controller.component.html',
  styleUrl: './electronic-controller.component.scss'
})
export class ElectronicControllerComponent implements OnInit {
  ngOnInit(): void {
    const state = history.state;
    this.courseId = state.courseId;
    this.title = state.courseName;
    this.getGrades();
  }
  protected title:string = '';
  private location = inject(Location);
  private gradeData = inject(GradeService);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  protected totalItems = 0;
  protected pageSize = 10;
  protected currentPage = 0;
  protected sortDirection: 'asc' | 'desc' = 'asc';
  protected sortField = 'name';
  protected filterValue = '';
  protected grades: Grade[] = [];
  protected displayedColumns: string[] = ['user_code','grade'];
  private courseId?:number;

  back() {
    this.location.back();
  }
  async getGrades(){
    if(this.courseId){
      await firstValueFrom(
        from(this.gradeData.getAllGradesInCourse(
          this.courseId,
          this.currentPage + 1,
          this.pageSize,
          this.sortField,
          this.sortDirection,
          this.filterValue
        )).pipe(
          map(response => {
            this.grades = response.data;
            this.totalItems = response.total;
          }),
          catchError(error => {
            console.error('Hiba: ', error);
            return EMPTY;
          })
        )
      )
    }
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
}
