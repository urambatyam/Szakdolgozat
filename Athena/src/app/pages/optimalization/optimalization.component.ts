import { Component, OnInit, computed, inject, model, signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, FormsModule, FormGroup, Validators } from '@angular/forms';
import { CurriculumService } from '../../services/mysql/curriculum.service';
import { OptimalizationService } from '../../services/mysql/optimalization.service';
import { Name } from '../../models/curriculumNames';
import { Curriculum } from '../../models/curriculum';
import { Optimalization, OptimizedPlanResponse,  } from '../../models/optimalization'; 
import { catchError, EMPTY, firstValueFrom, from, map } from 'rxjs';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import {MatRadioModule} from '@angular/material/radio';
import { TranslateModule } from '@ngx-translate/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { CurriculumVisualizationComponent } from './curriculum-visualization/curriculum-visualization.component';

/**
 * @description
 * Komponens a tanterv optimalizálására.
 * Lehetővé teszi a felhasználó számára, hogy kiválasszon egy tantervet, megadjon különböző
 * optimalizálási paramétereket (algoritmus, kredithatár, specializációk, preferenciák),
 * és elindítsa az optimalizálást. Az eredményt vizuálisan is megjeleníti.
 */
@Component({
  selector: 'app-optimalization',
  standalone: true,
  imports: [
    CurriculumVisualizationComponent,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    TranslateModule,
    MatRadioModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
    CommonModule,
  ],
  templateUrl: './optimalization.component.html',
  styleUrl: './optimalization.component.scss'
})
export class OptimalizationComponent implements OnInit {
  protected curriculumNames: Name[] = [];
  private specializationNames: Name[] = [];
  protected selectedCurriculum: Curriculum | null = null;
  protected optimizationResult: OptimizedPlanResponse | null = null; 
  private allCourses: Name[] = [];
  protected isLoading = false;
  protected allreqmet: boolean | null = null;
  private fb = inject(NonNullableFormBuilder);
  private curriculumService = inject(CurriculumService);
  private optimalizationService = inject(OptimalizationService);
  protected noOptimum: string[] | null = null; 
  protected optimizationForm: FormGroup = this.fb.group({
    curriculum_id: [null as number | null, Validators.required], 
    algorithm: ['greedy', Validators.required],
    creditLimit: [30, [Validators.required, Validators.min(1)]],
    selectedSpecializationIds: [[] as number[]], 
    startWithFall: [true],
    considerRecommendations: [false],
    negativIds: [[] as number[]], 
    pozitivIds: [[] as number[]] 
  });
  readonly currentPozInput = model('');
  readonly selectedPozs = signal<Name[]>([]);
  readonly filteredPozs = computed(() => {
    const searchText = this.currentPozInput().toLowerCase();
    const selected = this.selectedPozs();
    const courses = this.allCourse() ?? [];
    return courses.filter(po =>
      !selected.some(s => s.id === po.id) &&
      po.name.toLowerCase().includes(searchText)
    );
  });
  readonly currentNegInput = model('');
  readonly allCourse = signal<Name[]>([]);
  readonly selectedNegativs = signal<Name[]>([]);
  readonly filteredNegativs = computed(() => {
    const searchText = this.currentNegInput().toLowerCase();
    const selected = this.selectedNegativs();
    const courses = this.allCourse() ?? [];
    return courses.filter(neg =>
      !selected.some(s => s.id === neg.id) &&
      neg.name.toLowerCase().includes(searchText)
    );
  });
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly currentSpecInput = model('');
  readonly allSpecializations = signal<Name[]>([]);
  readonly selectedSpecializations = signal<Name[]>([]);
  readonly filteredSpecializations = computed(() => {
    const searchText = this.currentSpecInput().toLowerCase();
    const selected = this.selectedSpecializations();
    const specializations = this.allSpecializations() ?? [];
    return specializations.filter(spec =>
      !selected.some(s => s.id === spec.id) &&
      spec.name.toLowerCase().includes(searchText)
    );
  });

  /**
   * @description
   * Inicializálja a komponenst a tanterv nevek betöltésével.
   * @override
   */
  ngOnInit(): void {
    this.loadCurriculaNames();
  }

  /**
   * @description
   * Eseménykezelő a tanterv kiválasztó  értékének változására.
   * Betölti a kiválasztott tanterv részleteit és alaphelyzetbe állítja a kapcsolódó űrlapmezőket és signal-okat.
   * @param MatSelectChange event A kiválasztási esemény objektuma.
   */
  protected selectedCurriculumChange(event: MatSelectChange): void {
    const curriculumId = event.value as number | null;
    if (curriculumId) {
      this.optimizationForm.patchValue({ curriculum_id: curriculumId });
      this.resetCurriculumDependentState(); 
      this.loadCurriculumDetails(curriculumId);
    } else {
      this.resetCurriculumDependentState();
      this.selectedCurriculum = null; 
    }
  }

  /**
   * @description
   * Alaphelyzetbe állítja a tantervtől függő állapotokat (kurzusok, specializációk, kiválasztások).
   * @private
   */
  private resetCurriculumDependentState(): void {
    this.allCourse.set([]);
    this.selectedNegativs.set([]);
    this.selectedPozs.set([]); 
    this.specializationNames = [];
    this.selectedSpecializations.set([]);
    this.allSpecializations.set([]);
  }

  /**
   * @description
   * Betölti az összes elérhető tanterv nevét a szolgáltatáson keresztül.
   * @private
   */
  private loadCurriculaNames(): void {
    firstValueFrom(
      from(this.curriculumService.getAllCurriculumNames()).pipe(
        map(curricula => {
          this.curriculumNames = Array.isArray(curricula) ? curricula : (curricula ? [curricula] : []);
        }),
        catchError(error => {
          console.error('Hiba a tanterv nevek betöltésekor:', error);
          return EMPTY;
        })
      )
    );
  }

  /**
   * @description
   * Betölti egy adott tanterv részletes adatait ID alapján.
   * Frissíti a releváns signal-okat az autocomplete mezőkhöz.
   * @param number id A betöltendő tanterv azonosítója.
   * @private
   */
  private loadCurriculumDetails(id: number): void {
    firstValueFrom(
      from(this.curriculumService.getCurriculum(id)).pipe(
        map(curriculum => {
          this.selectedCurriculum = curriculum;
          this.specializationNames = curriculum.specializations?.map(spec => ({
            id: spec.id ?? 0, 
            name: spec.name ?? 'N/A', 
          })) ?? [];
          this.allSpecializations.set(this.specializationNames);
          const coursesMap = new Map<number, string>();
          curriculum.specializations?.forEach(spec => {
            spec.categories?.forEach(cat => {
              cat.courses?.forEach(course => {
                if (course.id && course.name && !coursesMap.has(course.id)) {
                  coursesMap.set(course.id, course.name);
                }
              });
            });
          });
          this.allCourses = Array.from(coursesMap, ([id, name]) => ({ id, name }))
                                .sort((a, b) => a.name.localeCompare(b.name));
          this.allCourse.set(this.allCourses);
        }),
        catchError(error => {
          console.error('Hiba a tanterv részleteinek betöltésekor:', error);
          this.selectedCurriculum = null; 
          this.resetCurriculumDependentState(); 
          return EMPTY;
        })
      )
    );
  }

  /**
   * @description
   * Elküldi az optimalizálási kérést a szolgáltatásnak a formban megadott adatok alapján.
   * Kezeli a betöltési állapotot és feldolgozza a kapott eredményt vagy hibát.
   * @returns Promise<void> Promise, ami akkor oldódik fel, ha a kérés befejeződött.
   */
  async onSubmit(): Promise<void> {
    this.allreqmet = null; 
    this.optimizationResult = null;
    this.noOptimum = null;
    if (this.optimizationForm.invalid) {
      Object.values(this.optimizationForm.controls).forEach(control => {
        control.markAsTouched();
      });
      console.error('Form is invalid:', this.optimizationForm.errors);
      return; 
    }
    this.isLoading = true; 
    const optimizationData: Optimalization = {
      curriculum_id: this.optimizationForm.get('curriculum_id')?.value ?? 0, 
      algorithm: this.optimizationForm.get('algorithm')?.value ?? 'greedy',
      creditLimit: this.optimizationForm.get('creditLimit')?.value ?? 30,
      selectedSpecializationIds: this.selectedSpecializations().map(spec => spec.id), 
      considerRecommendations: this.optimizationForm.get('considerRecommendations')?.value ?? false,
      negativIds: this.selectedNegativs().map(neg => neg.id), 
      pozitivIds: this.selectedPozs().map(po => po.id) 
    };

    try {
      const result = await firstValueFrom(
        this.optimalizationService.optimizeCurriculum(optimizationData)
      );
      this.allreqmet = result.optimizedPlan?.all_requirements_met ?? false; 
      if (this.allreqmet) {
        this.optimizationResult = result;
      } else {
        this.noOptimum = result.optimizedPlan?.warnings ?? ['Ismeretlen hiba: Nem minden követelmény teljesült.'];
        this.optimizationResult = result; 
      }
    } catch (error) {
      console.error('Optimalizálási hiba:', error);
      this.noOptimum = ['Hiba történt az optimalizálás során. Próbálja újra később.']; 
    } finally {
      this.isLoading = false; 
    }
  }

  /**
   * @description
   * Getter a kredithatár form control eléréséhez.
   * @returns AbstractControl | null A kredithatár form control.
   */
  get creditLimitControl() {
    return this.optimizationForm.get('creditLimit');
  }

  /**
   * @description
   * Getter, ami jelzi, hogy az űrlap érvénytelen-e.
   * @returns boolean Igaz, ha az űrlap érvénytelen.
   */
  get formInvalid() {
    return this.optimizationForm.invalid;
  }

  /**
   * @description
   * Hozzáad egy specializációt a kiválasztottakhoz a chip input esemény alapján.
   * Csak akkor adja hozzá, ha a beírt érték létezik és még nincs kiválasztva.
   * @param MatChipInputEvent event A chip input esemény.
   * @protected
   */
  protected addSpecialization(event: MatChipInputEvent): void {
    this.addChipItem(event, this.allSpecializations, this.selectedSpecializations, this.currentSpecInput);
  }

  /**
   * @description
   * Eltávolít egy specializációt a kiválasztottak listájából.
   * @param Name spec Az eltávolítandó specializáció.
   * @protected
   */
  protected removeSpecialization(spec: Name): void {
    this.removeChipItem(spec, this.selectedSpecializations);
  }

  /**
   * @description
   * Hozzáad egy specializációt a kiválasztottakhoz az autocomplete kiválasztási eseménye alapján.
   * @param MatAutocompleteSelectedEvent event Az autocomplete kiválasztási esemény.
   * @protected
   */
  protected selectedSpecialization(event: MatAutocompleteSelectedEvent): void {
    this.selectAutocompleteItem(event, this.selectedSpecializations, this.currentSpecInput);
  }

  /**
   * @description
   * Hozzáad egy negatív kurzust a kiválasztottakhoz a chip input esemény alapján.
   * @param MatChipInputEvent event A chip input esemény.
   * @protected
   */
  protected addNegativ(event: MatChipInputEvent): void {
    this.addChipItem(event, this.allCourse, this.selectedNegativs, this.currentNegInput);
  }

  /**
   * @description
   * Eltávolít egy negatív kurzust a kiválasztottak listájából.
   * @param Name neg Az eltávolítandó negatív kurzus.
   * @protected
   */
  protected removeNegativ(neg: Name): void {
    this.removeChipItem(neg, this.selectedNegativs);
  }

  /**
   * @description
   * Hozzáad egy negatív kurzust a kiválasztottakhoz az autocomplete kiválasztási eseménye alapján.
   * @param MatAutocompleteSelectedEvent event Az autocomplete kiválasztási esemény.
   * @protected
   */
  protected selectedNegativ(event: MatAutocompleteSelectedEvent): void {
    this.selectAutocompleteItem(event, this.selectedNegativs, this.currentNegInput);
  }

  /**
   * @description
   * Hozzáad egy pozitív kurzust a kiválasztottakhoz a chip input esemény alapján.
   * @param MatChipInputEvent event A chip input esemény.
   * @protected
   */
  protected addPozitiv(event: MatChipInputEvent): void {
    this.addChipItem(event, this.allCourse, this.selectedPozs, this.currentPozInput);
  }

  /**
   * @description
   * Eltávolít egy pozitív kurzust a kiválasztottak listájából.
   * @param Name po Az eltávolítandó pozitív kurzus.
   * @protected
   */
  protected removePozitiv(po: Name): void {
    this.removeChipItem(po, this.selectedPozs);
  }

  /**
   * @description
   * Hozzáad egy pozitív kurzust a kiválasztottakhoz az autocomplete kiválasztási eseménye alapján.
   * @param MatAutocompleteSelectedEvent event Az autocomplete kiválasztási esemény.
   * @protected
   */
  protected selectedPozitiv(event: MatAutocompleteSelectedEvent): void {
    this.selectAutocompleteItem(event, this.selectedPozs, this.currentPozInput);
  }

  /**
   * @description
   * Általános segédmetódus elem hozzáadásához chip input esemény alapján.
   * Megkeresi az elemet a teljes listában a beírt érték alapján, és ha létezik és még nincs kiválasztva,
   * hozzáadja a cél signalhoz. Üríti az input mezőt.
   * @param MatChipInputEvent event A chip input esemény.
   * @param () => Name[] allItemsSource Függvény, ami visszaadja az összes választható elemet.
   * @param WritableSignal<Name[]> targetSignal A signal, amihez hozzáadjuk az elemet.
   * @param WritableSignal<string> inputModelSignal Az input mezőhöz kötött model signal.
   * @private
   */
  private addChipItem(
    event: MatChipInputEvent,
    allItemsSource: () => Name[],
    targetSignal: WritableSignal<Name[]>,
    inputModelSignal: WritableSignal<string>
  ): void {
    const value = (event.value || '').trim().toLowerCase();
    if (value) {
      const allItems = allItemsSource() ?? [];
      const itemToAdd = allItems.find(
        item => item.name.toLowerCase() === value
      );

      if (itemToAdd && !targetSignal().some(selected => selected.id === itemToAdd.id)) {
        targetSignal.update(currentItems => [...currentItems, itemToAdd]);
      }
    }
    event.chipInput!.clear();
    inputModelSignal.set('');
  }

  /**
   * @description
   * Általános segédmetódus elem eltávolításához a kiválasztott elemeket tartalmazó signalból.
   * @param Name itemToRemove Az eltávolítandó elem.
   * @param WritableSignal<Name[]> targetSignal A signal, amiből eltávolítjuk az elemet.
   * @private
   */
  private removeChipItem(itemToRemove: Name, targetSignal: WritableSignal<Name[]>): void {
    targetSignal.update(currentItems =>
      currentItems.filter(item => item.id !== itemToRemove.id)
    );
  }

  /**
   * @description
   * Általános segédmetódus elem hozzáadásához autocomplete kiválasztási esemény alapján.
   * Ha az elem még nincs kiválasztva, hozzáadja a cél signalhoz. Üríti az input mezőt.
   * @param MatAutocompleteSelectedEvent event Az autocomplete kiválasztási esemény.
   * @param WritableSignal<Name[]> targetSignal A signal, amihez hozzáadjuk az elemet.
   * @param WritableSignal<string> inputModelSignal Az input mezőhöz kötött model signal.
   * @private
   */
  private selectAutocompleteItem(
    event: MatAutocompleteSelectedEvent,
    targetSignal: WritableSignal<Name[]>,
    inputModelSignal: WritableSignal<string>
  ): void {
    const selectedValue = event.option.value as Name;
    if (selectedValue && !targetSignal().some(selected => selected.id === selectedValue.id)) {
      targetSignal.update(currentItems => [...currentItems, selectedValue]);
    }
    inputModelSignal.set('');
    event.option.deselect(); 
  }
}
