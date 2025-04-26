import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CourseService } from '../../services/mysql/course.service';
import { Course } from '../../models/course';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {  MatButtonModule } from '@angular/material/button';
import { catchError, EMPTY, firstValueFrom, map, Observable, Subject, takeUntil } from 'rxjs';
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
import { BreakpointObserver , Breakpoints} from '@angular/cdk/layout';
/**
 * Komponens a kurzusok listázására, kezelésére és a hozzájuk tartozó fórumokhoz/ellenőrzőkhöz való navigálásra.
 * Lehetővé teszi a felhasználó számára a kurzusok szűrését, rendezését, lapozását,
 * valamint új kurzusok létrehozását, meglévők módosítását és törlését.
 * Kezeli az előfeltétel kurzusok kiválasztását chip-ek és automatikus kiegészítés segítségével.
 */
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
  private breakpointObserver = inject(BreakpointObserver);
  protected isNarrowScreen = signal(false);
  private destroy$ = new Subject<void>();
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
  /**
   * Hozzáad egy előfeltételt a `selectedPrerequisites` listához a chip input esemény alapján.
   * @param event A MatChipInputEvent esemény objektum.
   */
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
  /**
   * Eltávolít egy előfeltételt a `selectedPrerequisites` listából.
   * Frissíti a form control értékét is.
   * @param course Az eltávolítandó előfeltétel.
   */
  removePrerequisite(course: Name) {
    const index = this.selectedPrerequisites.findIndex(p => p.id === course.id);
    if (index >= 0) {
      this.selectedPrerequisites.splice(index, 1);
      this.CourseForm?.get('prerequisites')?.setValue(this.selectedPrerequisites);
    
    }
  }
  /**
   * Kezeli az előfeltétel kiválasztását az automatikus kiegészítő listából.
   * Hozzáadja a kiválasztott kurzust a `selectedPrerequisites` listához, ha még nem szerepel benne.
   * Frissíti a form control értékét is.
   * @param event A MatAutocompleteSelectedEvent esemény objektum.
   */
  onPrerequisiteSelected(event: MatAutocompleteSelectedEvent) {
    const selectedCourse = event.option.value;
    if (!this.selectedPrerequisites.some(p => p.id === selectedCourse.id)) {
      this.selectedPrerequisites.push(selectedCourse);
      this.CourseForm?.get('prerequisites')?.setValue(this.selectedPrerequisites);
    }
  }
  /**
   * Kezeli a lapozó eseményeit
   * Frissíti a `currentPage` és `pageSize` értékeket, majd újra lekéri a kurzusokat.
   * @param e A PageEvent esemény objektum.
   */
  handlePageEvent(e: PageEvent): void {
    this.currentPage = e.pageIndex;
    this.pageSize = e.pageSize;
    this.getAllCourses();
  }
  /**
   * Kezeli a rendezési eseményeket.
   * Frissíti a `sortDirection` és `sortField` értékeket, majd újra lekéri a kurzusokat.
   * @param e A Sort esemény objektum.
   */
  handleSort(e: Sort): void {
    this.sortDirection = e.direction as 'asc' | 'desc';
    this.sortField = e.active;
    this.getAllCourses();
  }
  /**
   * Alkalmazza a szűrőmezőbe beírt értéket.
   * Frissíti a `filterValue` értékét, visszaáll az első oldalra, és újra lekéri a kurzusokat.
   * @param event A beviteli esemény.
   */
  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value;
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.getAllCourses();
  }
  /**
   * Aszinkron módon lekéri a kurzusok listáját a backendről a jelenlegi
   * lapozási, rendezési és szűrési beállítások alapján.
   * Frissíti a `courseNames` és `totalItems` property-ket.
   * Kezeli a felhasználói kód lekérését az AuthService-ből.
   * @async
   */
  async getAllCourses(): Promise<void>{
    try {
      const user_code = await firstValueFrom(
        this.auth.user$.pipe(
          map(user=>{return user?.code ?? ''}),
          takeUntil(this.destroy$)
        )
      );
      await firstValueFrom(
        this.courseData.getAllCoursesOFUser(
          user_code,
          this.currentPage + 1,
          this.pageSize,
          this.sortField,
          this.sortDirection,
          this.filterValue
        ).pipe(
          takeUntil(this.destroy$),
          map(response => {
            this.courseNames = response.data;
            this.totalItems = response.total;
          }),
          catchError(error => {
            console.error('Hiba a kurzusok lekérése közben: ', error);
            return EMPTY;
          })
        )
      );
    }catch (error) {
      console.error('Váratlan hiba a kurzusok lekérése során:', error);
    }
  }
  /**
   * Angular életciklus metódus, amely a komponens inicializálásakor fut le.
   * Elindítja a képernyőméret figyelését és lekéri a kurzusok listáját.
   */
  ngOnInit(): void {
    this.observeScreenSize();
    this.getAllCourses();
  }
  /**
   * Figyeli a képernyőméret változásait a BreakpointObserver segítségével.
   * Frissíti az `isNarrowScreen` signalt és a táblázat `displayedColumns` tömbjét
   * a képernyő szélességétől függően.
   * @private
   */
  private observeScreenSize(): void {
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.isNarrowScreen.set(result.matches);
      if (result.matches) { 
        this.displayedColumns = ['name', 'controller', 'view'];
      } else { 
        this.displayedColumns = ['name', 'update', 'delete', 'controller', 'view'];
      }
    });
  }
  /**
   * Navigál a kiválasztott kurzus fórum oldalára.
   * Átadja a teljes kurzus objektumot állapotként a routernek.
   * @param course A kiválasztott kurzus objektum.
   * @protected
   */
  protected toCourseForm(course: Course) {
    this.router.navigate(
      ['/forum'],
      {state: {course: course}}
    )
  }
  /**
   * Navigál a kiválasztott kurzus elektronikus ellenőrző oldalára.
   * Átadja a kurzus ID-ját és nevét állapotként a routernek.
   * @param courseId A kiválasztott kurzus azonosítója.
   * @param courseName A kiválasztott kurzus neve.
   * @protected
   */
  protected toElectronicController(courseId:number, courseName:string): void{
     this.router.navigate(
      ['courses-grades'],
      {state: {courseId: courseId, courseName: courseName}}
    )
  }
  /**
   * Előkészíti a kurzus űrlapot egy meglévő kurzus adatainak módosítására.
   * Beállítja az `update` flag-et `true`-ra, feltölti az űrlapot a kurzus adataival,
   * és megjeleníti az űrlapot.
   * Kezeli az előfeltételek betöltését is.
   * @param course A módosítandó kurzus objektum.
   * @async
   * @protected
   */
  async toupdate(course: Course): Promise<void> {    
    this.update = true;
    this.selectedPrerequisites = [];
    if (course?.id) {
      let sezonV = 0
      if(course.sezon === null){
        sezonV = 2;
      }else if(course.sezon){
        sezonV = 1;
      }
      if (course.pre && Array.isArray(course.pre)) {
       this.selectedPrerequisites = course.pre;
      }
      this.CourseForm.patchValue({
        id: course.id,
        recommendedSemester: course.recommendedSemester,
        user_code: course.user_code ?? null,
        name: course.name,
        kredit: course.kredit,
        sezon:sezonV,
        prerequisites: []
      });
      this.VisForm = true;
    }else {
      console.error("Hiba: A módosítandó kurzus vagy annak azonosítója érvénytelen.");
    }
  }
 /**
   * Törli a megadott azonosítójú kurzust a backendről.
   * Sikeres törlés után frissíti a kurzusok listáját.
   * @param course_id A törlendő kurzus azonosítója.
   * @async
   * @protected
   */
  async todelete(course_id: number): Promise<void> {
    try {
      await firstValueFrom(
        this.courseData.deleteCourse(course_id).pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.error('Hiba:', error);
            return EMPTY;
          })
        )
      );
      this.getAllCourses();
    } catch (error) {
      console.error('Váratlan hiba a kurzus törlése során:', error);
    }
  }
  /**
   * Megjeleníti a kurzus létrehozó űrlapot.
   * Beállítja az `update` flag-et `false`-ra és üríti az űrlapot.
   * @protected
   */
  create() {
    this.update = false;
    this.CourseForm.reset({ 
        id: null,
        recommendedSemester: null,
        user_code: null, 
        name: null,
        kredit: null,
        sezon: 2, 
        prerequisites: null
    });
    this.selectedPrerequisites = []; 
    this.VisForm = true; 
  }
  /**
   * Bezárja a kurzus létrehozó/módosító űrlapot.
   * Visszaállítja az `update` és `VisForm` flag-eket.
   * @protected
   */
  close(){
    this.update = false;
    this.VisForm = false;
    this.CourseForm.reset(); 
    this.selectedPrerequisites = [];
  }
  /**
   * Feldolgozza a kurzus űrlap elküldését.
   * Megkülönbözteti, hogy új kurzus létrehozásáról vagy meglévő módosításáról van-e szó.
   * Elküldi az adatokat a `CourseService`-nek, majd bezárja az űrlapot és frissíti a listát.
   * @async
   * @protected
   */
  async onSubmit(): Promise<void> {
    if (this.CourseForm.invalid) {
      console.warn("Űrlap érvénytelen, mentés megszakítva.");
      return;
  }
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
    try {
      let operation$: Observable<any>;
      if (this.update) {
        if(newCourse.id === null){
            console.error("Hiba: Módosítási kísérlet ID nélkül.");
            return;
          }
          operation$ = this.courseData.updateCourse(newCourse);
        } else {
          operation$ = this.courseData.createCourse(newCourse);
      }
      await firstValueFrom(
        operation$.pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.error('Hiba a kurzus mentése közben:', error);
            return EMPTY; 
          })
        )
      );
      this.VisForm = false;
      this.update = false;
      this.getAllCourses();
    } catch (error) {
      console.error('Váratlan hiba a kurzus mentési folyamatban:', error);
    }
  }
  /**
   * Angular életciklus metódus, amely a komponens megsemmisülésekor fut le.
   * Leállítja az összes aktív feliratkozást a `destroy$` Subject segítségével,
   * hogy megelőzze a memóriaszivárgást.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    //this.getAllCourses$.complete();
  }
}
