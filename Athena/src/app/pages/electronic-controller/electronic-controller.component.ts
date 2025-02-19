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
import { catchError, EMPTY, firstValueFrom, from, map, tap } from 'rxjs';
import { GradeService } from '../../services/mysql/grade.service';
import { MatSelectModule } from '@angular/material/select';
import {animate, state, style, transition, trigger} from '@angular/animations';


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
  ngOnInit(): void {
    const state = history.state;
    this.courseId = state.courseId;
    this.title = state.courseName;
    this.getGrades();
  }
  
  protected title: string = '';
  private location = inject(Location);
  private gradeService = inject(GradeService);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('gradeInput') gradeInput!: ElementRef<HTMLInputElement>;
  
  protected totalItems = 0;
  protected pageSize = 10;
  protected currentPage = 0;
  protected sortDirection: 'asc' | 'desc' = 'asc';
  protected sortField = 'user_code';
  protected filterValue = '';
  protected grades: Grade[] = [];
  protected displayedColumns: string[] = ['user_code', 'grade'];
  protected columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
  protected expandedElement: Grade | null = null;
  private courseId?: number;

  protected async update(element: Grade) {
    if (!this.gradeInput) return;
    
    const newGrade = Number(this.gradeInput.nativeElement.value);
    
    // Ellenőrizzük, hogy érvényes jegy-e (1-5 között)
    if (newGrade >= 1 && newGrade <= 5) {
      // Készítünk egy másolatot, hogy ne módosítsuk közvetlenül az eredeti objektumot
      const updatedGrade: Grade = {
        ...element,
        grade: newGrade
      };
      
      // Küldjük a frissítést a szerverre
      if (this.courseId) {
        try {
          await firstValueFrom(
            from(this.gradeService.updateGrade(updatedGrade)).pipe(
              tap(response => {
                console.log("Sikeresen módosítottam az osztályzatot");
                // Frissítjük a lokális objektumot
                element.grade = newGrade;
                // Bezárjuk a kibontott részt frissítés után
                this.expandedElement = null;
              })
            )
          );
        } catch (error) {
          console.error('Hiba a jegy frissítésekor:', error);
        }
      }
    } else {
      alert('A jegynek 1 és 5 között kell lennie!');
    }
  }

  back() {
    this.location.back();
  }
  
  async getGrades() {
    if (this.courseId) {
      await firstValueFrom(
        from(this.gradeService.getAllGradesInCourse(
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
      );
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