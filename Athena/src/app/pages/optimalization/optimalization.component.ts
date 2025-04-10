// curriculum-optimization.component.ts
import { Component, OnInit, computed, inject, model, signal ,ElementRef, ViewChild} from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, FormsModule, FormGroup, Validators, FormControl } from '@angular/forms';
import { CurriculumService } from '../../services/mysql/curriculum.service';
import { OptimalizationService } from '../../services/mysql/optimalization.service';
import { Name } from '../../models/curriculumNames';
import { Curriculum } from '../../models/curriculum';
import { Optimalization } from '../../models/optimalization';
import { catchError, EMPTY, firstValueFrom, from, map } from 'rxjs';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import {MatRadioModule} from '@angular/material/radio';
import { TranslateModule } from '@ngx-translate/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { MatIconModule } from '@angular/material/icon';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CurriculumVisualizationComponent } from './curriculum-visualization/curriculum-visualization.component';
import { Observable, startWith } from 'rxjs';

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










curriculumNames: Name[] = [];
specializationNames: Name[] = [];
selectedCurriculum: Curriculum | null = null;
optimizationResult: any = null;
specializations: string[] = []; // Ez a specializációkhoz kell
allCourses: Name[] = []; // Összes elérhető kurzus (ID és név)
isLoading = false;
creditsBreakdown: any[] = []; // Ez valószínűleg a vizualizációhoz kell, marad
protected allreqmet: boolean | null = null;
private fb = inject(NonNullableFormBuilder);
private curriculumService = inject(CurriculumService);
private optimalizationService = inject(OptimalizationService);
protected noOptimum = null
protected optimizationForm: FormGroup = this.fb.group({
  curriculum_id: [null, Validators.required],
  algorithm: ['greedy', Validators.required], // Alapértelmezett lehet 'greedy' vagy 'bnb'
  creditLimit: [30, [Validators.required, Validators.min(1)]],
  selectedSpecializationIds: [[] as number[]], // Típus megadása
  startWithFall: [true],
  considerRecommendations: [false],
  // --- ÚJ: Form vezérlők a kurzus ID-khoz ---
  negativIds: [[] as number[]],
  pozitivIds: [[] as number[]]
});


ngOnInit(): void {
  this.loadCurriculaNames();
}

selectedCurriculumChange(event: MatSelectChange): void {
  if (event.value) {
    this.optimizationForm.patchValue({ curriculum_id: event.value });
    this.allCourse.set([]);
    this.selectedNegativs.set([]);
    this.specializationNames = [];
    this.selectedSpecializations.set([]);
    this.allSpecializations.set([]);
    this.selectedCurriculum = null;
    this.loadCurriculumDetails(event.value);
    // Reset specializations and courses when curriculum changes
    this.optimizationForm.patchValue({ selectedSpecializationIds: [] });
    
  }else{
    this.selectedNegativs.set([]);
    this.allCourse.set([]);
    this.specializationNames = [];
    this.selectedSpecializations.set([]);
    this.allSpecializations.set([]);
    this.selectedCurriculum = null;
  }
  
}





loadCurriculaNames(): void {
  firstValueFrom(
    from(this.curriculumService.getAllCurriculumNames()).pipe(
      map(curricula => {
        this.curriculumNames = Array.isArray(curricula) ? curricula : [curricula];
      }),
      catchError(error => {
        console.error('Hiba a tanterv nevek betöltésekor:', error);
        return EMPTY;
      })
    )
  );
}

loadCurriculumDetails(id: number): void {
  firstValueFrom(
    from(this.curriculumService.getCurriculum(id)).pipe(
      map(curriculum => {
        this.selectedCurriculum = curriculum;
        // Specializációk kinyerése (marad)
        this.specializationNames = curriculum.specializations.map(spec => ({
          id: spec.id || 0,
          name: spec.name,
        })) || [];
        this.specializations = this.specializationNames.map(spec => spec.name);
        this.allSpecializations.set(this.specializationNames);

        // --- ÚJ: Kurzusok kinyerése ---
        const coursesMap = new Map<number, string>(); // Map a duplikátumok szűrésére ID alapján
        curriculum.specializations.forEach(spec => {
          spec.categories.forEach(cat => {
            cat.courses.forEach(course => {
              if (course.id && course.name && !coursesMap.has(course.id)) {
                coursesMap.set(course.id, course.name);
              }
            });
          });
        });
        this.allCourses = Array.from(coursesMap, ([id, name]) => ({ id, name }));
        // Kurzusnevek rendezése ABC sorrendbe az autocomplete-hez
        this.allCourses.sort((a, b) => a.name.localeCompare(b.name));
        this.allCourse.set(this.allCourses);

      }),
      catchError(error => {
        console.error('Hiba a tanterv részleteinek betöltésekor:', error);
        return EMPTY;
      })
    )
  );
}






















async onSubmit(): Promise<void> {
  this.allreqmet = null;
  if (this.optimizationForm.invalid) {
    // Mark all fields as touched to show errors
    Object.values(this.optimizationForm.controls).forEach(control => {
      control.markAsTouched();
    });
    console.error('Form is invalid:', this.optimizationForm.errors);
    return;
  }

  this.isLoading = true;
  this.optimizationResult = null; // Reset previous result



  // Típusosan hozzuk létre az adatobjektumot
  const optimizationData: Optimalization = {
    curriculum_id: this.optimizationForm.get('curriculum_id')?.value ?? 0, 
    algorithm: this.optimizationForm.get('algorithm')?.value ?? 'greedy',
    creditLimit: this.optimizationForm.get('creditLimit')?.value ?? 30,
    selectedSpecializationIds: this.selectedSpecializations().map(spec => spec.id) ?? [],
    considerRecommendations: this.optimizationForm.get('considerRecommendations')?.value ?? false,
    negativIds: this.selectedNegativs().map(neg => neg.id) ?? [],
    pozitivIds: this.selectedPozs().map(po => po.id) ?? []
  };

  console.log('Optimalizálási adatok küldése:', optimizationData);

  try {
    const result = await firstValueFrom(
      this.optimalizationService.optimizeCurriculum(optimizationData)
    );
    console.log('all_requirements_met:', result.optimizedPlan.all_requirements_met);
    console.log('warnings:', result.optimizedPlan.warnings);
    this.allreqmet = result.optimizedPlan.all_requirements_met
    if(this.allreqmet){
      this.optimizationResult = result;
    }else{
      this.noOptimum = result.optimizedPlan.warnings;
    }
    console.log('Optimalizáció:', this.noOptimum, " ", this.optimizationResult);
    
  } catch (error) {
    console.error('Optimalizálási hiba:', error);
    // Itt lehetne felhasználóbarát hibaüzenetet megjeleníteni
  } finally {
    this.isLoading = false;
  }
}

get creditLimitControl() {
  return this.optimizationForm.get('creditLimit');
}

// Egyszerűsített invalid check
get formInvalid() {
  return this.optimizationForm.invalid;
}

//Specializációk
readonly separatorKeysCodes: number[] = [ENTER, COMMA];
readonly currentSpecInput = model('');
readonly allSpecializations = signal<Name[]>([]);
readonly selectedSpecializations = signal<Name[]>([]);
readonly filteredSpecializations  = computed(() => {
  const searchText = this.currentSpecInput().toLowerCase();
  const selected = this.selectedSpecializations();
  return this.allSpecializations().filter(spec => 
    !selected.some(s => s.id === spec.id) && // Kiszűrjük a már kiválasztottakat
    spec.name.toLowerCase().includes(searchText)
  );
});
addSpecialization(event: MatChipInputEvent): void {
  const value = (event.value || '').trim();
  const spec = this.allSpecializations().find(
    s => s.name.toLowerCase() === value.toLowerCase()
  );
  // Add our fruit
  if (spec && !this.selectedSpecializations().some(s => s.id === spec.id)) {
    this.selectedSpecializations.update(specs => [...specs, spec]);
  }
  // Clear the input value
  event.chipInput!.clear();
  this.currentSpecInput.set('');
}

removeSpecialization(spec: Name): void {
  this.selectedSpecializations.update(specs => {
    const filtered = specs.filter(s => s.id !== spec.id);
    return filtered;
  });
}

selectedSpecialization(event: MatAutocompleteSelectedEvent): void {
  const selectedValue = event.option.value as Name;
    
  if (!this.selectedSpecializations().some(s => s.id === selectedValue.id)) {
    this.selectedSpecializations.update(specs => [...specs, selectedValue]);
  }
  
  this.currentSpecInput.set('');
  event.option.deselect();
}

//Negativ
readonly currentNegInput = model('');
readonly allCourse = signal<Name[]>([]);
readonly selectedNegativs = signal<Name[]>([]);
readonly filteredNegativs  = computed(() => {
  const searchText = this.currentNegInput().toLowerCase();
  const selected = this.selectedNegativs();
  return this.allCourse().filter(neg => 
    !selected.some(s => s.id === neg.id) && // Kiszűrjük a már kiválasztottakat
    neg.name.toLowerCase().includes(searchText)
  );
});

addNegativ(event: MatChipInputEvent): void {
  const value = (event.value || '').trim();
  const neg = this.allCourse().find(
    s => s.name.toLowerCase() === value.toLowerCase()
  );
  if (neg && !this.selectedNegativs().some(s => s.id === neg.id)) {
    this.selectedNegativs.update(negs => [...negs, neg]);
  }
  // Clear the input value
  event.chipInput!.clear();
  this.currentNegInput.set('');
}

removeNegativ(neg: Name): void {
  this.selectedNegativs.update(negs => {
    const filtered = negs.filter(s => s.id !== neg.id);
    return filtered;
  });
}

selectedNegativ(event: MatAutocompleteSelectedEvent): void {
  const selectedValue = event.option.value as Name;
    
  if (!this.selectedNegativs().some(s => s.id === selectedValue.id)) {
    this.selectedNegativs.update(negs => [...negs, selectedValue]); 
  }
  
  this.currentNegInput.set('');
  event.option.deselect();
}
//pozitiv
readonly currentPozInput = model('');
//readonly allCourse = signal<Name[]>([]);
readonly selectedPozs = signal<Name[]>([]);
readonly filteredPozs  = computed(() => {
  const searchText = this.currentPozInput().toLowerCase();
  const selected = this.selectedPozs();
  return this.allCourse().filter(po => 
    !selected.some(s => s.id === po.id) && // Kiszűrjük a már kiválasztottakat
    po.name.toLowerCase().includes(searchText)
  );
});

addPozitiv(event: MatChipInputEvent): void {
  const value = (event.value || '').trim();
  const po = this.allCourse().find(
    s => s.name.toLowerCase() === value.toLowerCase()
  );
  if (po && !this.selectedPozs().some(s => s.id === po.id)) {
    this.selectedNegativs.update(pos => [...pos, po]);
  }
  // Clear the input value
  event.chipInput!.clear();
  this.currentPozInput.set('');
}

removePozitiv(po: Name): void {
  this.selectedPozs.update(pos => {
    const filtered = pos.filter(s => s.id !== po.id);
    return filtered;
  });
}

selectedPozitiv(event: MatAutocompleteSelectedEvent): void {
  const selectedValue = event.option.value as Name;
    
  if (!this.selectedPozs().some(s => s.id === selectedValue.id)) {
    this.selectedPozs.update(pos => [...pos, selectedValue]); 
  }
  
  this.currentPozInput.set('');
  event.option.deselect();
}
}