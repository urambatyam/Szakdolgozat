import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, firstValueFrom,  of,  startWith, switchMap, takeUntil } from 'rxjs';
import { CurriculumService } from '../../services/mysql/curriculum.service';
import { GradeService } from '../../services/mysql/grade.service';
import { AuthService } from '../../services/mysql/auth.service';
import { Course } from '../../models/course';
import { Task,Subtask,ColumnOption } from '../../models/tasks';
import { Name } from '../../models/curriculumNames';
import { Curriculum } from '../../models/curriculum';

/**
 * A CurriculumComponent felelős a tantervek megjelenítéséért, szűréséért és a kurzusokra való jelentkezés kezeléséért.
 * Lehetővé teszi a felhasználók számára a tantervek böngészését,
 * az oszlopok láthatóságának testreszabását, valamint a specializációk, kategóriák és kurzusok szerinti szűrést.
 * A diákok ezen a felületen keresztül jelentkezhetnek kurzusokra.
 */
@Component({
  selector: 'app-curriculum',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './curriculum.component.html',
  styleUrl: './curriculum.component.scss'
})
export class CurriculumComponent implements OnInit, OnDestroy {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private gradeData = inject(GradeService);
  private curriculumData = inject(CurriculumService);
  private auth = inject(AuthService);
  private destroy$ = new Subject<void>();
  protected isNarrowScreen = signal(false);
  protected availableColumnOptions = signal<ColumnOption[]>([]);
  private task = signal<Task>({
    name: '',
    completed: false,
    subtasks: []
  });
  protected viewMode: 'student' | 'other' = 'other';
  protected visKat: boolean = true;
  protected tanterv: Curriculum | null = null;
  protected specialsVis = new Map<string, boolean>([['összes', true]]);
  protected coursesVis = new Map<string, number>([['összes', -1]]);
  protected katsVis = new Map<string, boolean>([['összes', true]]);
  protected katsVisalfa = new Map<string, boolean>([['összes', true]]);
  protected curs: Name[] = [];
  protected curriculumName: string = "";
  protected displayedColumns: string[] = [];
  protected selectedColumnNames: string[] = [];
  private mycurriculum: number | null = null;

  /**
   * Inicializálja a komponenst: beállítja a képernyőméret figyelését,
   * a fordításokat, lekéri a felhasználói adatokat, és betölti a megfelelő tantervet.
   */
  async ngOnInit() {
    this.observeScreenSize();
    this.setupTranslations();
    await this.initializeUserData();
    if (this.viewMode === 'other') {
      await this.loadAvailableCurriculums();
    } else if (this.mycurriculum) {
      await this.LoadCurriculum(this.mycurriculum);
    }
    this.updateAvailableColumnOptions();
    this.updateSelectedColumnNamesFromTask();
    this.updateDisplayedColumns();
  }

  /**
   * Leiratkozik az Observable-ökről a komponens megsemmisülésekor.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Figyeli a képernyőméret változásait és frissíti az `isNarrowScreen` signalt.
   * Keskeny képernyőre váltáskor frissíti az elérhető és megjelenített oszlopokat.
   */
  private observeScreenSize(): void {
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      const wasNarrow = this.isNarrowScreen();
      this.isNarrowScreen.set(result.matches);
      if (wasNarrow !== result.matches) {
        this.updateAvailableColumnOptions();
        this.updateSelectedColumnNamesFromTask();
        this.updateDisplayedColumns();
      }
    });
  }

  /**
   * Lekéri a bejelentkezett felhasználó adatait az AuthService segítségével.
   * Beállítja a `viewMode` és `mycurriculum` property-ket.
   */
  private async initializeUserData(): Promise<void> {
    try {
      const user = await firstValueFrom(this.auth.user$);
      this.viewMode = user?.role === 'student' ? 'student' : 'other';
      this.mycurriculum = user?.curriculum_id ?? null;
    } catch (error) {
      console.error('Hiba a felhasználói adatok lekérésekor: ', error);
      const message = (error as Error).message ?? 'Ismeretlen hiba';
      this.showSnackbar(message);
    }
  }

  /**
   * Betölti az összes elérhető tanterv nevét és ID-ját, ha a felhasználó nem diák ('other' viewMode).
   * Az első elérhető tantervet automatikusan betölti.
   */
  private async loadAvailableCurriculums(): Promise<void> {
    try {
      const names = await firstValueFrom(this.curriculumData.getAllCurriculumNames());
      this.curs = names;
      if (names.length > 0 && names[0].id) {
        await this.LoadCurriculum(names[0].id);
      }
    } catch (error) {
      console.error('Hiba a tantervek nevének lekérésekor: ', error);
      const message = (error as Error).message ?? 'Ismeretlen hiba';
      this.showSnackbar(message);
    }
  }

  /**
   * Beállítja a fordításokat és az oszlopdefiníciókat tartalmazó `task` signalt.
   * Figyeli a nyelvváltásokat, és frissíti a fordításokat és az oszlopokat.
   */
  private setupTranslations() {
    this.translate.onLangChange
      .pipe(
        startWith(null),
        switchMap(() => {
          const subtasks: Subtask[] = [
            { key: 'name', name: this.translate.instant('curriculum.NAME'), completed: true },
            { key: 'id', name: 'ID', completed: !this.isNarrowScreen() },
            { key: 'kredit', name: this.translate.instant('curriculum.KREDIT'), completed: !this.isNarrowScreen() },
            { key: 'recommendedSemester', name: this.translate.instant('curriculum.RS'), completed: !this.isNarrowScreen() },
            { key: 'subjectResponsible', name: this.translate.instant('curriculum.SUBJECT_RESPONSIBLE'), completed: !this.isNarrowScreen() },
            { key: 'sezon', name: this.translate.instant('curriculum.SEZON'), completed: !this.isNarrowScreen() },
            { key: 'apply', name: this.translate.instant('curriculum.APPLY'), completed: true },
            { key: 'course', name: this.translate.instant('curriculum.COURSE_FORUM'), completed: true },
          ];
          return of({ subtasks });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ subtasks }) => {
        this.task.update(value => ({
          ...value,
          subtasks: subtasks
        }));
        this.updateAvailableColumnOptions();
        this.updateSelectedColumnNamesFromTask();
        this.updateDisplayedColumns();
      });
  }

  /**
   * Betölti a megadott ID alapján a tanterv részletes adatait.
   * Opcionálisan szűrhet egy adott kurzus ID-ra.
   * Frissíti a `tanterv`, `curriculumName` és a szűrőkhöz tartozó `Map`-eket (`specialsVis`, `katsVis`, `coursesVis`).
   * Hiba esetén értesítést jelenít meg és visszaállítja az állapotot.
   * @param id A betöltendő tanterv ID-ja.
   * @param courseIdFilter Opcionális kurzus ID, amire szűrni kell a tantervet.
   */
  protected async LoadCurriculum(id: number, courseIdFilter?: number | null): Promise<void> {
    this.visKat = false;
    this.tanterv = null;
    this.specialsVis = new Map<string, boolean>([['összes', true]]);
    this.katsVis = new Map<string, boolean>([['összes', true]]);
    this.coursesVis = new Map<string, number>([['összes', -1]]);
    try {
      const curriculum = await firstValueFrom(this.curriculumData.getCurriculum(id, courseIdFilter));
      this.curriculumName = curriculum.name;
      this.tanterv = curriculum;
      this.tanterv.specializations.forEach(sp => {
        this.specialsVis.set(sp.name, true);
        sp.categories.forEach(cat => {
          this.katsVis.set(cat.name, true);
          cat.courses.forEach(course => {
            if (course.name != null && course.id != null) {
              if (!this.coursesVis.has(course.name)) {
                 this.coursesVis.set(course.name, course.id);
              }
            }
          });
        });
      });
      this.katsVisalfa = new Map(this.katsVis);

    } catch (error) {
      console.error(`Hiba a(z) ${id} ID-jű tanterv betöltésekor: `, error);
      const message = (error as HttpErrorResponse)?.error?.reason || (error as Error).message || 'Ismeretlen hiba a tanterv betöltésekor.';
      this.showSnackbar(message);
      this.tanterv = null;
      this.curriculumName = "";
      this.specialsVis.clear();
      this.katsVis.clear();
      this.coursesVis.clear();
      this.specialsVis.set('összes', true);
      this.katsVis.set('összes', true);
      this.coursesVis.set('összes', -1);
    }
  }

  /**
   * Navigál a fórum oldalra az adott kurzus adataival.
   * @param course A kurzus objektum, amelynek a fórumára navigálunk.
   */
  protected toCourseForm(course: Course): void {
    this.router.navigate(
      ['/forum'],
      { state: { course: course } }
    );
  }

  /**
   * Kezeli a kurzusra való jelentkezést.
   * Ellenőrzi, hogy a kurzus ID létezik-e, és hogy a jelentkezés a megfelelő szemeszterben történik-e (őszi/tavaszi).
   * Meghívja a `gradeData.createGrade` metódust a jelentkezés rögzítéséhez.
   * Visszajelzést ad a felhasználónak a művelet sikerességéről vagy sikertelenségéről.
   * @param course A kurzus objektum, amelyre a felhasználó jelentkezni próbál.
   */
  protected async apply(course: Course): Promise<void> {
    if (!course.id) {
      console.warn("Cannot apply for course: Course ID is missing.");
      this.showSnackbar('A kurzus azonosítója hiányzik a jelentkezéshez.');
      return;
    }

    const currentMonth = new Date().getMonth();
    const isAutumnSemester = currentMonth >= 8 || currentMonth <= 0;
    let canApply = false;

    if (course.sezon === null) {
      canApply = true;
    } else {
      const isCourseAutumn = Boolean(course.sezon);
      if (isCourseAutumn && isAutumnSemester) {
        canApply = true;
      } else if (!isCourseAutumn && !isAutumnSemester) {
        canApply = true;
      }
    }

    if (canApply) {
      try {
        const response = await firstValueFrom(this.gradeData.createGrade(course.id));
        if (response.success) {
          course.applied = true;
          course.completed = false;
          const mes = this.translate.instant('curriculum.APPLY_SUCCESS', { courseName: course.name });
          this.showSnackbar(mes);
        } else {
          course.applied = false;
          const mes = response.reason || this.translate.instant('curriculum.APPLY_FAILED_UNKNOWN', { courseName: course.name });
          this.showSnackbar(mes);
        }
      } catch (error) {
        course.applied = false;
        console.error(`Hiba a(z) ${course.name} kurzusra való jelentkezéskor:`, error);
        const mes = (error as HttpErrorResponse)?.error?.reason || this.translate.instant('curriculum.APPLY_FAILED_SERVER', { courseName: course.name });
        this.showSnackbar(mes);
      }
    } else {
      const requiredSemester = Boolean(course.sezon) ? this.translate.instant('curriculum.AUTUMN') : this.translate.instant('curriculum.SPRING');
      const mes = this.translate.instant('curriculum.APPLY_WRONG_SEMESTER', { courseName: course.name, requiredSemester: requiredSemester });
      this.showSnackbar(mes);
    }
  }

  /**
   * Frissíti az `availableColumnOptions` signalt a `task` signal és a képernyőméret alapján.
   * Keskeny képernyőn csak a definiált alap oszlopok érhetők el.
   */
  private updateAvailableColumnOptions(): void {
    const allSubtasks = this.task().subtasks ?? [];
    let options: ColumnOption[] = [];

    if (this.isNarrowScreen()) {
      const narrowScreenKeys = ['name', 'apply', 'course'];
      options = allSubtasks
        .filter(st => narrowScreenKeys.includes(st.key))
        .map(st => ({ name: st.name, completed: st.completed, key: st.key }));
    } else {
      options = allSubtasks.map(st => ({ name: st.name, completed: st.completed, key: st.key }));
    }
    this.availableColumnOptions.set(options);
  }

  /**
   * Frissíti a `selectedColumnNames` tömböt az `availableColumnOptions` alapján,
   * kiválasztva azokat az oszlopneveket, amelyek `completed` állapota `true`.
   */
  private updateSelectedColumnNamesFromTask(): void {
    this.selectedColumnNames = this.availableColumnOptions()
      .filter(opt => opt.completed)
      .map(opt => opt.name);
  }

  /**
   * Kezeli az oszlopválasztó legördülő menü értékének változását.
   * Frissíti a `task` signal `subtasks` tömbjének `completed` állapotát a kiválasztás alapján.
   * Frissíti a `selectedColumnNames` tömböt és a `displayedColumns` tömböt.
   * @param event A MatSelectChange esemény objektum.
   */
  onColumnSelectionChange(event: MatSelectChange): void {
    const selectedNames = event.value as string[];

    this.task.update(task => {
      const newTask = { ...task, subtasks: [...(task.subtasks ?? [])] };
      newTask.subtasks = newTask.subtasks.map(subtask => ({
        ...subtask,
        completed: selectedNames.includes(subtask.name)
      }));
      return newTask;
    });

    this.selectedColumnNames = selectedNames;
    this.updateDisplayedColumns();
  }

  /**
   * Frissíti a `displayedColumns` tömböt, amely meghatározza a táblázatban ténylegesen megjelenő oszlopokat.
   * Keskeny képernyőn fix oszlopokat használ, széles képernyőn a `task` signal `completed` subtaskjai alapján határozza meg az oszlopokat.
   */
  private updateDisplayedColumns() {
    if (this.isNarrowScreen()) {
      this.displayedColumns = ['name', 'apply', 'course'];
      return;
    }

    const subtasks = this.task().subtasks;
    if (!subtasks) {
      console.warn("Subtasks not initialized for column update.");
      this.displayedColumns = [];
      return;
    }

    this.displayedColumns = subtasks
      .filter(subtask => subtask.completed && subtask.key)
      .map(subtask => subtask.key);
  }

  /**
   * Kezeli a kategória szűrő legördülő menüjének változását.
   * Frissíti a `katsVis` Map-et a kiválasztott kategória alapján.
   * @param event A MatSelectChange esemény objektum.
   */
  KatonSelectionChange(event: MatSelectChange) {
    const selectedCategory = event.value as string;
    this.katsVis.forEach((_, key) => {
        this.katsVis.set(key, selectedCategory === 'összes' || key === selectedCategory || key === 'összes');
    });
  }

  /**
   * Kezeli a specializáció szűrő legördülő menüjének változását.
   * Frissíti a `specialsVis` Map-et és a `katsVis` Map-et (az elérhető kategóriákat) a kiválasztott specializáció alapján.
   * Beállítja a `visKat` (kategória szűrő láthatósága) értékét.
   * @param event A MatSelectChange esemény objektum.
   */
  SpeconSelectionChange(event: MatSelectChange) {
    const selectedSpecialization = event.value as string;

    this.specialsVis.forEach((_, key) => {
        this.specialsVis.set(key, selectedSpecialization === 'összes' || key === selectedSpecialization || key === 'összes');
    });

    if (selectedSpecialization === 'összes') {
        this.katsVis = new Map(this.katsVisalfa);
        this.visKat = false;
    } else {
        this.katsVis = new Map<string, boolean>([['összes', true]]);
        this.tanterv?.specializations
            .find(s => s.name === selectedSpecialization)?.categories
            .forEach(k => { this.katsVis.set(k.name, true); });
        this.visKat = true;
    }
  }

  /**
   * Kezeli a tanterv választó legördülő menüjének változását.
   * Újratölti a komponenst a kiválasztott tanterv ID-jával a `LoadCurriculum` metódus meghívásával.
   * @param event A MatSelectChange esemény objektum.
   */
  CuronSelectionChange(event: MatSelectChange) {
    const selectedCurriculumId = event.value as number;
    this.LoadCurriculum(selectedCurriculumId);
  }

  /**
   * Kezeli a kurzus szűrő legördülő menüjének változását.
   * Újratölti a tantervet a `LoadCurriculum` metódussal, átadva a kiválasztott kurzus ID-ját szűrőként.
   * Ha nincs betöltve tanterv, figyelmeztetést jelenít meg.
   * @param event A MatSelectChange esemény objektum.
   */
  CouronSelectionChange(event: MatSelectChange) {
    const selectedCourseId = event.value as number;
    const currentCurriculumId = this.tanterv?.id;
    if (currentCurriculumId) {
        this.LoadCurriculum(currentCurriculumId, selectedCourseId === -1 ? null : selectedCourseId);
    } else {
        console.warn("Cannot filter courses, no curriculum loaded.");
        this.showSnackbar("Nincs tanterv betöltve a kurzus szűréséhez.");
    }
  }

  /**
   * Megjelenít egy snackbar értesítést a megadott üzenettel.
   * @param message A megjelenítendő üzenet.
   * @param action A snackbar-on megjelenő akciógomb szövege.
   * @param duration Az értesítés megjelenítésének időtartama milliszekundumban.
   */
  private showSnackbar(message: string, action: string = 'OK', duration: number = 5000): void {
    this.snackBar.open(message, action, {
      duration: duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
