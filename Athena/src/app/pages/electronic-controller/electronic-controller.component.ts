import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { Grade, GradeApiResponse } from '../../models/grade';
import { Semester } from '../../models/semester';
import { Subject, takeUntil, catchError, EMPTY, firstValueFrom,  Observable, tap } from 'rxjs';
import { GradeService } from '../../services/mysql/grade.service';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AuthService } from '../../services/mysql/auth.service';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Komponens a jegyek megjelenítésére és kezelésére.
 * Megjeleníti a jegyeket
 * Két nézetmódot támogat: 'student' (hallgatói nézet) és 'course' (kurzus nézet, tanároknak).
 * A 'course' nézetben a tanárok módosíthatják a jegyeket.
 * A 'student' nézetben a hallgatók láthatják a jegyeiket és eltávolíthatják a kurzusfelvételeket.
 */
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
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  templateUrl: './electronic-controller.component.html',
  styleUrl: './electronic-controller.component.scss'
})
export class ElectronicControllerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  protected title: string = '';
  private location = inject(Location);
  private gradeService = inject(GradeService);
  private authService = inject(AuthService);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
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
  protected semesters: Semester[] = [];
  protected viewMode: 'course' | 'student' = 'student';
  protected ALL_SEMESTERS = { id: 'all', label: 'Összes szemeszter' };
  protected selectedSemesterOption: any = this.ALL_SEMESTERS;
  protected selectedSemester: Semester | null = null;
  protected currentSemester: Semester | null = null;
  protected upgrades = ['ø', 1, 2, 3, 4, 5];

  /**
   * Inicializálja a komponenst.
   * Lekérdezi a felhasználói adatokat, beállítja a nézetmódot és a szükséges azonosítókat.
   * Meghatározza a megjelenítendő oszlopokat a nézetmód alapján.
   * Betölti a kezdeti jegyadatokat.
   * Kezeli a hiányzó navigációs adatokat 'course' módban.
   * @async
   */
  async ngOnInit() {
    try {
      const user = await firstValueFrom(
        this.authService.user$.pipe(
          takeUntil(this.destroy$),
          catchError(err => {
            console.error("Hiba a felhasználói adatok lekérésekor:", err);
            this.viewMode = 'student';
            return EMPTY;
          })
        )
      );
      if (!user) {
        console.warn("Nem sikerült betölteni a felhasználói adatokat.");
        return;
      } else {
        this.viewMode = user.role === "student" ? 'student' : 'course';
        this.studentCode = user.code;
      }
      this.columnsToDisplayWithExpand = this.viewMode === 'student' 
      ? ['course_name', 'grade', 'remove'] 
      : ['user_code', 'grade', 'expand'];
      if (this.viewMode === 'course') {
        const state = history.state;
        if (state && state.courseId && state.courseName) {
          this.title = state.courseName;
          this.courseId = state.courseId;
          this.displayedColumns = ['user_code', 'grade'];
          this.sortField = 'user_code';
        } else {
          console.error("Hiányzó kurzus adatok a 'course' nézethez. Navigációs state:", state);
          this.title = 'Hiba - Kurzus nem található';
          this.location.back();
          return;
        }
      } else {
        this.title = 'electronic-controller.TITLE';
        this.displayedColumns = ['course_name', 'grade'];
        this.sortField = 'course_name';
        if (!this.studentCode) {
          console.error("Hallgatói kód hiányzik 'student' módban.");
          return;
        }
      }
      await this.getGrades();
    } catch (error) {
      this.location.back();
      console.error("Hiba a komponens inicializálása során:", error);
    }
  }

  /**
   * A komponens megsemmisülésekor lefutó metódus.
   * Lezárja a `destroy$` Subject-et, hogy a folyamatban lévő Observable feliratkozások megszűnjenek.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Eltávolít egy kurzusfelvételt
   * Csak 'course' nézetmódban működik
   * Meghívja a GradeService deleteGrade metódusát.
   * Sikeres törlés után újratölti a jegyeket.
   * @async
   * @param element A törlendő jegy.
   */
  protected async remove(element: Grade) {
    if (element.id && this.viewMode === 'student') {
      await firstValueFrom(
        this.gradeService.deleteGrade(element.id)
          .pipe(
            catchError(error => {
              console.error('Hiba a tárgyfelvétel törlésekor:', error);
              return EMPTY;
            }),
            takeUntil(this.destroy$)
          )
      );
      this.getGrades();
    }
  }

  /**
   * Eseménykezelő a jegy kiválasztásának megváltozásakor.
   * Meghívja az `update` metódust a kiválasztott értékkel.
   * @param event A MatSelectChange esemény objektuma.
   * @param element A módosítandó jegy.
   */
  protected GradeSelectionChange(event: MatSelectChange, element: Grade) {
    this.update(event.value, element);
  }

  /**
   * Frissíti egy hallgató jegyét egy adott kurzusból.
   * Csak 'course' nézetmódban és létező kurzus ID esetén működik.
   * Meghívja a GradeService updateGrade metódusát.
   * Sikeres frissítés után bezárja a kinyitott sort és frissíti a jegyet a helyi objektumban.
   * Hiba esetén logolja a hibát.
   * @async
   * @param selected A kiválasztott új jegy ('ø' vagy szám).
   * @param element A módosítandó jegy.
   */
  protected async update(selected: string | number, element: Grade) {
    const updatedGrade: Grade = {
      ...element,
      grade: typeof (selected) == 'number' ? selected : null
    };
    if (this.courseId && this.viewMode === 'course') {
      try {
        await firstValueFrom(
          this.gradeService.updateGrade(updatedGrade).pipe(
            tap(() => {
              element.grade = updatedGrade.grade;
              this.expandedElement = null;
            }),
            catchError(error => {
              console.error('Hiba a jegy frissítésekor (API):', error);
              return EMPTY;
            }),
            takeUntil(this.destroy$)
          ),

        );
      } catch (error) {
        console.error('Hiba a jegy frissítésekor:', error);
      }
    }
  }

  /**
   * Visszanavigál az előző oldalra a böngésző előzményeiben.
   */
  protected back() {
    this.location.back();
  }

  /**
   * Lekérdezi a jegyeket a szerverről az aktuális lapozási, rendezési és szűrési beállítások alapján.
   * A nézetmódtól függően a megfelelő GradeService metódust hívja.
   * Frissíti a `grades`, `semesters`, `totalItems` és `currentSemester` property-ket.
   * @async
   * @private
   */
  private async getGrades() {
    this.grades = [];
    this.semesters = [];
    this.totalItems = 0;
    this.currentSemester = null;
    try {
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

      let gradeObservable: Observable<GradeApiResponse>;
      if (this.viewMode === 'course' && this.courseId) {
        gradeObservable = this.gradeService.getAllGradesInCourse(this.courseId, params);
      } else if (this.viewMode === 'student' && this.studentCode) {
        gradeObservable = this.gradeService.getAllGradesOFStudent(this.studentCode, params);
      } else {
        console.error("Érvénytelen állapot a getGrades hívásához: hiányzó viewMode vagy ID.");
        return;
      }

      const response = await firstValueFrom(
        gradeObservable.pipe(
          catchError(error => {
            console.error('Hiba a jegyek lekérésekor (API hívás):', error);
            return EMPTY;
          })
        )
      );

      if (response) {
        this.grades = response.grades.data;
        this.semesters = response.semesters;
        this.totalItems = response.grades.total;
        this.currentSemester = this.semesters.find((s) => s.current == true) ?? null;
      }
    } catch (error) {
      console.error('Hiba a jegyek lekérésekor:', error);
    }
  }

  /**
   * Eseménykezelő a lapozó (paginator) eseményeire.
   * Frissíti az aktuális oldal indexét és az oldalméretet.
   * Újratölti a jegyeket az új lapozási beállításokkal.
   * @param e A PageEvent esemény objektuma.
   */
  protected handlePageEvent(e: PageEvent) {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    this.getGrades();
  }

  /**
   * Eseménykezelő a táblázat rendezési eseményeire.
   * Frissíti a rendezési irányt és a rendezési mezőt.
   * Újratölti a jegyeket az új rendezési beállításokkal.
   * @param e A Sort esemény objektuma.
   */
  protected handleSort(e: Sort) {
    this.sortDirection = e.direction as 'asc' | 'desc';
    this.sortField = e.active;
    this.getGrades();
  }

  /**
   * Eseménykezelő a szűrő mezőben történő gépelésre.
   * Frissíti a szűrési értéket.
   * Visszaállítja az aktuális oldalt az elsőre.
   * Újratölti a jegyeket az új szűrési feltétellel.
   * @param e A KeyboardEvent esemény objektuma.
   */
  protected applyFilterUserCode(e: KeyboardEvent) {
    this.filterValue = (e.target as HTMLInputElement).value;
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.getGrades();
  }

  /**
   * Eseménykezelő a szemeszterválasztó select értékének megváltozásakor.
   * Beállítja a kiválasztott szemesztert a szűréshez (null, ha "Összes").
   * Visszaállítja az aktuális oldalt az elsőre.
   * Újratölti a jegyeket az új szemeszter szűréssel.
   * @param option A kiválasztott opció (Semester objektum vagy az ALL_SEMESTERS konstans).
   */
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

  /**
   * Formáz egy Semester objektumot olvasható stringgé a select opciókhoz.
   * @param semester A formázandó Semester objektum.
   * @returns A formázott string vagy "Összes szemeszter", ha a bemenet null/undefined.
   */
  protected formatSemester(semester: Semester): string {
    if (!semester) return 'Összes szemeszter';
    const season = semester.sezon ? "Ősz" : "Tavasz";
    return `${semester.year} ${season}`;
  }
}