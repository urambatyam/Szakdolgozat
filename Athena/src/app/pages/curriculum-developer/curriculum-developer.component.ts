import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormArray, FormControl, FormGroup, FormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { CurriculumService } from '../../services/mysql/curriculum.service';
import { Curriculum } from '../../models/curriculum';
import { Specialization} from '../../models/special';
import { Category} from '../../models/category';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { catchError, EMPTY, firstValueFrom, from, map, Subject, takeUntil } from 'rxjs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Course } from '../../models/course';
import { CourseService } from '../../services/mysql/course.service';
import { Name } from '../../models/curriculumNames';
import { TranslateModule } from '@ngx-translate/core';

/** Típus a kurzus form groupjához. */
type FormCourse = FormGroup<{
  id:FormControl<number | null>
  name:FormControl<string|null>
}>;

/** Típus a kategória form groupjához, amely kurzusokat tartalmaz. */
type FormCategory = FormGroup<{
  id:FormControl<number | null>
  catName: FormControl<string>
  courses: FormArray<FormCourse>
  min: FormControl<number>
}>;

/** Típus a specializáció form groupjához, amely kategóriákat tartalmaz. */
type FormSpecialization = FormGroup<{
  id:FormControl<number | null>
  spName: FormControl<string>
  required: FormControl<number> 
  categories: FormArray<FormCategory>
}>;

/** Típus a teljes tanterv form groupjához. */
type Form = FormGroup<{
  id:FormControl<number | null>
  tName: FormControl<string>
  specializations: FormArray<FormSpecialization>;
}>;

/**
 * @description
 * Komponens a tantervek létrehozására, szerkesztésére és törlésére.
 * Kezeli a tantervek listázását és a dinamikus űrlapot a tantervek adatainak kezeléséhez,
 * beleértve a specializációkat, kategóriákat és kurzusokat.
 */
@Component({
  selector: 'app-curriculum-developer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    TranslateModule
  ],
  templateUrl: './curriculum-developer.component.html',
  styleUrl: './curriculum-developer.component.scss'
})
export class CurriculumDeveloperComponent implements OnInit, OnDestroy {
  private curriculumData = inject(CurriculumService);
  private courseData = inject(CourseService);
  private fb = inject(NonNullableFormBuilder);
  private curriculumNames$ = new Subject<void>();
  private courseNames$ = new Subject<void>();
  private update:boolean = false;
  protected displayedColumns: string[] = ['name', 'update', 'delete'];
  protected tantervNevek = new MatTableDataSource<Name>();
  protected formVs = false;
  protected tantervForm:Form = this.fb.group({
    id: this.fb.control<number | null>(null),
    tName: this.fb.control<string>(''),
    specializations: this.fb.array<FormSpecialization>([])
  });
  protected AllCourseNames:Course[] = [];

  /**
   * @description
   * Inicializálja a komponenst: beállítja a form láthatóságát hamisra,
   * lekérdezi az összes kurzus nevét és betölti a meglévő tantervek neveit.
   * @override
   */
  ngOnInit(): void {
    this.formVs = false;
    from(this.courseData.getAllCoursesNames()).pipe(
      takeUntil(this.courseNames$),
      map(courses => {
        this.AllCourseNames = courses;
      })
    ).subscribe();
    this.loadCurriculumNames()
  }

  /**
   * @description
   * Betölti az összes tanterv nevét a szerverről és frissíti a táblázat adatforrását.
   * Leiratkozik a `curriculumNames$` subject jelzésekor.
   */
  loadCurriculumNames() {
    from(this.curriculumData.getAllCurriculumNames()).pipe(
      takeUntil(this.curriculumNames$),
      map(curriculums => {
        this.tantervNevek.data = curriculums;
      })
    ).subscribe();
  }

  /**
   * @description
   * Létrehoz egy új, üres `FormGroup`-ot egy specializációhoz.
   * @returns {FormSpecialization} Egy új specializáció `FormGroup`.
   */
  generateSpecialization():FormSpecialization{
    return this.fb.group({
      id: this.fb.control<number | null>(null),
      spName: this.fb.control<string>(''),
      required: this.fb.control<number>(-1), 
      categories: this.fb.array<FormCategory>([])
    })
  }

  /**
   * @description
   * Létrehoz egy új, üres `FormGroup`-ot egy kategóriához.
   * @returns {FormCategory} Egy új kategória `FormGroup`.
   */
  generateCategory():FormCategory{
    return this.fb.group({
      id: this.fb.control<number | null>(null),
      min: this.fb.control<number>(0),
      catName: this.fb.control<string>(''), 
      courses: this.fb.array<FormCourse>([])
    })
  }

  /**
   * @description
   * Létrehoz egy új, üres `FormGroup`-ot egy kurzushoz.
   * @returns {FormCourse} Egy új kurzus `FormGroup`.
   */
  generateCourse():FormCourse{
    return this.fb.group({
      id: this.fb.control<number | null>(null),
      name: this.fb.control<string | null>(null),
    })
  }

  /**
   * @description
   * Hozzáad egy új specializációt a tanterv űrlap `specializations` `FormArray`-éhez.
   */
  addSpecialization():void{
    this.tantervForm.controls.specializations.push(this.generateSpecialization())
  }

  /**
   * @description
   * Eltávolít egy specializációt a tanterv űrlap `specializations` `FormArray`-éből a megadott index alapján.
   * @param {number} spIndex Az eltávolítandó specializáció indexe.
   */
  removeSpecialization(spIndex:number):void{
    this.tantervForm.controls.specializations.removeAt(spIndex);
  }

  /**
   * @description
   * Hozzáad egy új kategóriát a megadott indexű specializáció `categories` `FormArray`-éhez.
   * @param {number} spIndex Annak a specializációnak az indexe, amelyhez a kategóriát hozzáadjuk.
   */
  addCategory(spIndex:number):void{
    this.tantervForm.controls.specializations.at(spIndex).controls.categories.push(this.generateCategory())
  }

  /**
   * @description
   * Eltávolít egy kategóriát a megadott indexű specializáció `categories` `FormArray`-éből a kategória indexe alapján.
   * @param {number} spIndex Annak a specializációnak az indexe, amelyből a kategóriát eltávolítjuk.
   * @param {number} ctIndex Az eltávolítandó kategória indexe a specializáción belül.
   */
  removeCategory(spIndex:number, ctIndex:number):void{
    this.tantervForm.controls.specializations.at(spIndex).controls.categories.removeAt(ctIndex);
  }

  /**
   * @description
   * Hozzáad egy kiválasztott kurzust a megadott indexű specializáció és kategória `courses` `FormArray`-éhez.
   * Csak akkor adja hozzá, ha a kurzus létezik és még nem szerepel az adott kategóriában.
   * @param {number} spIndex A cél specializáció indexe.
   * @param {number} ctIndex A cél kategória indexe a specializáción belül.
   * @param {number} courseId A hozzáadandó kurzus azonosítója.
   */
  addCourses(spIndex:number, ctIndex:number, courseId:number):void{
    const categoryCoursesArray = this.tantervForm.controls.specializations.at(spIndex).controls.categories.at(ctIndex).controls.courses;
    const selectedCourse = this.AllCourseNames.find(course => course.id === courseId);
    const isDuplicate = categoryCoursesArray.controls.some(
      courseControl => courseControl.controls.id.value === courseId
    );

    if (selectedCourse && !isDuplicate) {
      const courseForm = this.generateCourse();
      courseForm.patchValue({
        id: selectedCourse.id,
        name: selectedCourse.name
      });
      categoryCoursesArray.push(courseForm);
    }
  }

  /**
   * @description
   * Eseménykezelő a kurzus kiválasztó `<select>` elem `change` eseményére.
   * Meghívja az `addCourses` metódust a kiválasztott kurzus ID-jával, majd visszaállítja a select értékét.
   * @param {Event} event A DOM `change` esemény objektuma.
   * @param {number} spIndex A specializáció indexe, amelyhez a kurzust hozzáadjuk.
   * @param {number} ctIndex A kategória indexe, amelyhez a kurzust hozzáadjuk.
   */
  onCourseSelect(event: Event, spIndex: number, ctIndex: number): void {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      this.addCourses(spIndex, ctIndex, Number(select.value));
      select.value = ''; 
    }
  }

  /**
   * @description
   * Ellenőrzi, hogy egy adott kurzus (ID alapján) már szerepel-e egy specifikus kategória kurzusai között az űrlapon.
   * @param {number} spIndex A vizsgált specializáció indexe.
   * @param {number} ctIndex A vizsgált kategória indexe.
   * @param {number} courseId A keresett kurzus ID-ja.
   * @returns {boolean} Igaz, ha a kurzus már szerepel a kategóriában, egyébként hamis.
   */
  protected isCourseInCategory(spIndex: number, ctIndex: number, courseId: number): boolean {
    const categoryCoursesArray = this.tantervForm.controls.specializations
      .at(spIndex).controls.categories.at(ctIndex).controls.courses;

    return categoryCoursesArray.controls.some(
      courseControl => courseControl.controls.id.value === courseId
    );
  }

  /**
   * @description
   * Eltávolít egy kurzust a megadott indexű specializáció, kategória `courses` `FormArray`-éből a kurzus indexe alapján.
   * @param {number} spIndex Annak a specializációnak az indexe, amelyből a kurzust eltávolítjuk.
   * @param {number} ctIndex Annak a kategóriának az indexe, amelyből a kurzust eltávolítjuk.
   * @param {number} cIndex Az eltávolítandó kurzus indexe a kategórián belül.
   */
  removeCourses(spIndex:number, ctIndex:number, cIndex:number):void{
    this.tantervForm.controls.specializations.at(spIndex).controls.categories.at(ctIndex).controls.courses.removeAt(cIndex);
  }

  /**
   * @description
   * Előkészíti a komponenst egy meglévő tanterv szerkesztésére.
   * Beállítja az `update` és `formVs` flag-eket, lekérdezi a tanterv részletes adatait ID alapján,
   * és feltölti a `tantervForm`-ot a kapott adatokkal.
   * @param {Curriculum} curriculum A szerkesztendő tanterv alapadatai (legalább az ID szükséges).
   */
  toupdate(curriculum: Curriculum) {
    this.update = true;
    this.formVs = true;
    if(curriculum.id){
      this.tantervForm.controls.specializations.clear();

      firstValueFrom(
        from(this.curriculumData.getCurriculum(curriculum.id)).pipe(
          map(
            loadedCurriculum => { 
              this.tantervForm.patchValue({
                id: loadedCurriculum.id ?? null,
                tName: loadedCurriculum.name,
              });

              loadedCurriculum.specializations.forEach((spec, specIndex) => { 
                const specForm = this.generateSpecialization();
                specForm.patchValue({
                  id: spec.id,
                  spName: spec.name,
                  required: spec.required ? specIndex : -1
                });

                spec.categories.forEach(cat => {
                  const catForm = this.generateCategory();
                  catForm.patchValue({
                    id: cat.id,
                    catName: cat.name,
                    min: cat.min
                  });

                  cat.courses.forEach( c => {
                    const courseForm = this.generateCourse();
                        courseForm.patchValue({
                          id: c.id ?? null,
                          name: c.name ?? null,
                        });

                    (catForm.get('courses') as FormArray).push(courseForm);
                  });

                  (specForm.get('categories') as FormArray).push(catForm);
                });
                this.tantervForm.controls.specializations.push(specForm);
              });
            }
          ),
          catchError(error => {
            console.error('Hiba a tanterv betöltésekor:', error);
            this.close(); 
            return EMPTY;
          })
        )
      );
    }else{
      console.error("A szerkesztendő tantervnek nincs ID-ja!");
      this.close(); 
    }
  }

  /**
   * @description
   * Töröl egy tantervet a szerverről az ID alapján.
   * Sikeres törlés után újratölti a tantervek listáját.
   * @param {Curriculum} curriculum A törlendő tanterv (legalább az ID szükséges).
   */
  todelete(curriculum: Curriculum) {
    if(curriculum.id){
      if (!confirm(`Biztosan törölni szeretné a(z) "${curriculum.name}" tantervet?`)) {
         return;
      }

      firstValueFrom(
        from(this.curriculumData.deleteCurriculum(curriculum.id)).pipe(
          map(
            response =>{
              console.log('Törlési válasz:', response);
              this.loadCurriculumNames(); 
            }
          ),
          catchError(error => {
            console.error('Hiba a tanterv törlésekor:', error);
            return EMPTY;
          })
        )
      );
    } else {
       console.error("A törlendő tantervnek nincs ID-ja!");
    }
  }

  /**
   * @description
   * Előkészíti a komponenst egy új tanterv létrehozására.
   * Megjeleníti az űrlapot és visszaállítja azt egy üres állapotba.
   */
  create() {
    this.formVs = true;
    this.update = false;
    this.tantervForm = this.fb.group({
      id: this.fb.control<number | null>(null),
      tName: this.fb.control<string>(''), 
      specializations: this.fb.array<FormSpecialization>([])
    });
  }

  /**
   * @description
   * Bezárja a tanterv szerkesztő/létrehozó űrlapot és visszaállítja az állapotát.
   */
  close() {
    this.update = false;
    this.formVs = false;
    this.tantervForm = this.fb.group({
      id: this.fb.control<number | null>(null),
      tName: this.fb.control<string>(''), 
      specializations: this.fb.array<FormSpecialization>([])
    });
  }

  /**
   * @description
   * Kezeli a tanterv űrlap elküldését.
   * Összeállítja a `Curriculum` objektumot az űrlap adataiból.
   * Meghívja a megfelelő szerviz metódust (create vagy update) az `update` flag alapján.
   * Sikeres művelet után bezárja az űrlapot és frissíti a tantervek listáját.
   */
  onSubmit() {
    if (this.tantervForm.invalid) {
      console.error("Az űrlap érvénytelen!");
      return;
    }

    const requiredSpecializationIndex = this.tantervForm.controls.specializations.controls.findIndex(
        (spControl, index) => spControl.controls.required.value === index
    );

    const curriculum: Curriculum = {
      id: this.tantervForm.controls.id.value, 
      name: this.tantervForm.controls.tName.getRawValue(),
      specializations: this.tantervForm.controls.specializations.controls.map((spControl, spIndex): Specialization => {
        return {
          id: spControl.controls.id.getRawValue() ?? null,
          name: spControl.controls.spName.getRawValue(),
          required: spIndex === requiredSpecializationIndex,
          categories: spControl.controls.categories.controls.map((catControl): Category => {
            return {
              id: catControl.controls.id.getRawValue() ?? null,
              name: catControl.controls.catName.getRawValue(),
              min: catControl.controls.min.getRawValue(),
              courses: catControl.controls.courses.controls.map((courseControl): Course => {
                return {
                  id: courseControl.controls.id.getRawValue() ?? null,
                  name: courseControl.controls.name.getRawValue() ?? null,
                  recommendedSemester: null,
                  subjectResponsible: null,
                  kredit: null,
                  subjectMatter: null,
                  user_code: null,
                  sezon: null
                };
              })
            };
          })
        };
      })
    };

    const apiCall = this.update
      ? this.curriculumData.updateCurriculum(curriculum)
      : this.curriculumData.createCurriculum(curriculum);

    firstValueFrom(
      from(apiCall).pipe(
        map(response => {
          console.log(this.update ? 'Update válasz:' : 'Create válasz:', response);
          this.loadCurriculumNames(); 
          this.close(); 
        }),
        catchError(error => {
          console.error('Hiba a tanterv mentésekor:', error);
          alert('Hiba a tanterv mentésekor:'+ error);
          this.formVs = true; 
          return EMPTY;
        })
      )
    );
  }

  /**
   * @description
   * Leiratkozik az aktív `Subject`-ekről a komponens megsemmisülésekor,
   * hogy elkerülje a memóriaszivárgást.
   * @override
   */
  ngOnDestroy(): void {
    this.curriculumNames$.next();
    this.curriculumNames$.complete();
    this.courseNames$.next();
    this.courseNames$.complete();
  }
}
