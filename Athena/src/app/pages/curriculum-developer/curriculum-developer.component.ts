import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
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

type FormCourse = FormGroup<{
  id:FormControl<number | null>
  name:FormControl<string|null>
}>;
type FormCategory = FormGroup<{
  id:FormControl<number | null>
  catName: FormControl<string>
  courses: FormArray<FormCourse>
  min: FormControl<number>
}>;
type FormSpecialization = FormGroup<{
  id:FormControl<number | null>
  spName: FormControl<string>
  required: FormControl<number>
  categories: FormArray<FormCategory>
}>;
type Form = FormGroup<{
  id:FormControl<number | null>
  tName: FormControl<string>
  specializations: FormArray<FormSpecialization>;
}>;

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
  protected title = "Tantervek";
  protected formVs = false;
  protected tantervForm:Form = this.fb.group({
    id: this.fb.control<number | null>(null),
    tName: this.fb.control<string>(''),
    specializations: this.fb.array<FormSpecialization>([])
  });
  protected AllCourseNames:Course[] = [];

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

  loadCurriculumNames() {
    from(this.curriculumData.getAllCurriculumNames()).pipe(
      takeUntil(this.curriculumNames$),
      map(curriculums => {
        this.tantervNevek.data = curriculums;
      })
    ).subscribe();
  }

  generateSpecialization():FormSpecialization{
    return this.fb.group({
      id: this.fb.control<number | null>(null),
      spName: this.fb.control<string>(''),
      required: this.fb.control<number>(-1),
      categories: this.fb.array<FormCategory>([])
    })
  }    
  
  generateCategory():FormCategory{
    return this.fb.group({
      id: this.fb.control<number | null>(null),
      min: this.fb.control<number>(0),
      catName: '',
      courses: this.fb.array<FormCourse>([])
    })
  }    

  generateCourse():FormCourse{
    return this.fb.group({
      id: this.fb.control<number | null>(null),
      name: this.fb.control<string | null>(null),
    })
  }

  addSpecialization():void{
    this.tantervForm.controls.specializations.push(this.generateSpecialization())
  }

  removeSpecialization(spIndex:number):void{
    this.tantervForm.controls.specializations.removeAt(spIndex);
  }

  addCategory(spIndex:number):void{
    this.tantervForm.controls.specializations.at(spIndex).controls.categories.push(this.generateCategory())
  }

  removeCategory(spIndex:number, ctIndex:number):void{
    this.tantervForm.controls.specializations.at(spIndex).controls.categories.removeAt(ctIndex);
  }

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

    // Select change handler hozzáadása
    onCourseSelect(event: Event, spIndex: number, ctIndex: number): void {
      const select = event.target as HTMLSelectElement;
      if (select.value) {
        this.addCourses(spIndex, ctIndex, Number(select.value));
        select.value = ''; // Reset selection
      }
    }

    protected isCourseInCategory(spIndex: number, ctIndex: number, courseId: number): boolean {
      const categoryCoursesArray = this.tantervForm.controls.specializations
        .at(spIndex).controls.categories.at(ctIndex).controls.courses;
      
      return categoryCoursesArray.controls.some(
        courseControl => courseControl.controls.id.value === courseId
      );
    }

  removeCourses(spIndex:number, ctIndex:number, cIndex:number):void{
    this.tantervForm.controls.specializations.at(spIndex).controls.categories.at(ctIndex).controls.courses.removeAt(cIndex);
  }

  toupdate(curriculum: Curriculum) {
    this.update = true;
    this.formVs = true;
    if(curriculum.id){
      firstValueFrom(
        from(this.curriculumData.getCurriculum(curriculum.id)).pipe(
          map(
            curriculum => {
              console.log(curriculum.id)
              this.tantervForm.patchValue({
                id: curriculum.id ?? null,
                tName: curriculum.name,
              })
              console.log(this.tantervForm.controls.id?.getRawValue())
              // Specializációk hozzáadása
              curriculum.specializations.forEach(spec => {
                const specForm = this.generateSpecialization();
                specForm.patchValue({
                  id: spec.id,
                  spName: spec.name,
                  required: spec.required ? 1 : 0
                });

                // Kategóriák hozzáadása
                spec.categories.forEach(cat => {
                  const catForm = this.generateCategory();
                  catForm.patchValue({
                    id: cat.id,
                    catName: cat.name,
                    min: cat.min
                  });

                  // Kurzusok hozzáadása
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
          )
        )
      )
    }else{
      console.log("Nincsen Id-ja a tantervnek!")
    }
    console.log(this.tantervForm.controls.id?.getRawValue())
  }

  todelete(curriculum: Curriculum) {
    if(curriculum.id){
      firstValueFrom(
        from(this.curriculumData.deleteCurriculum(curriculum.id)).pipe(
          map(
            response =>{
              console.log('válasz')
              console.log(response);
              this.loadCurriculumNames()
            }
          ),
          catchError(error => {
            console.error('Hiba:', error);
            return EMPTY;
          })
        )
      );
    }    
  }

  create() {
    this.formVs = true;
    this.tantervForm = this.fb.group({
      id: this.fb.control<number | null>(null),
      tName: '',
      specializations: this.fb.array<FormSpecialization>([])
    });
  }

  close() {
    console.log("close")
    this.update = false;
    this.tantervForm =   this.fb.group({
      id: this.fb.control<number | null>(null),
      tName: '',
      specializations: this.fb.array<FormSpecialization>([])
    });
    this.formVs = false;
  }

  onSubmit() {
    const curriculum:Curriculum = {
      id: this.tantervForm.controls.id.value,
      name: this.tantervForm.controls.tName.getRawValue(),
      specializations: []
    };
    this.tantervForm.controls.specializations.controls.forEach((spV, spI)=>{
      console.log("spv. req: ",spV.controls.required.getRawValue())
      const Sptemp:Specialization = {
        id: spV.controls.id.getRawValue() ?? null,
        name:spV.controls.spName.getRawValue(),
        required: spI == spV.controls.required.getRawValue() ? true : false,
        categories: [],
      }
      this.tantervForm.controls.specializations.at(spI).controls.categories.controls.forEach((catV, catI)=>{
        const Cattemp:Category = {
          id: catV.controls.id.getRawValue() ?? null,
          name:catV.controls.catName.getRawValue(),
          courses: [],
          min: catV.controls.min.getRawValue(),
        }
        this.tantervForm.controls.specializations.at(spI).controls.categories.at(catI).controls.courses.controls.forEach((cV,cI)=>{
          Cattemp.courses.push({
            id: cV.controls.id.getRawValue() ?? null,
            name: cV.controls.name.getRawValue() ?? null,
            recommendedSemester: null,
            subjectResponsible: null,
            kredit:null,
            subjectMatter: null,
            user_code:null,
            sezon:null
          })
        })
        Sptemp.categories.push(Cattemp);
      })
      curriculum.specializations.push(Sptemp);
      console.log(curriculum)
    });
    if(this.update){
      console.log('update')
      console.log(this.tantervForm.getRawValue())
      curriculum.id = this.tantervForm.controls.id?.getRawValue();
      console.log('tanterv')
      console.log(curriculum);
      firstValueFrom(
        from(this.curriculumData.updateCurriculum(curriculum)).pipe(
          map(
            response =>{
              console.log('válasz')
              console.log(response);
              this.loadCurriculumNames()
            }
          ),
          catchError(error => {
            console.error('Hiba:', error);
            return EMPTY;
          })
        )
      );
      this.update = false;
    }else{
      console.log('create')
      console.log(curriculum);
      firstValueFrom(
        from(this.curriculumData.createCurriculum(curriculum)).pipe(
          map(
            response =>{
              console.log(response);
              this.loadCurriculumNames()
            }
          ),
          catchError(error => {
            console.error('Hiba:', error);
            return EMPTY;
          })
        )
      );
    }
    this.formVs = false;
    this.tantervForm =   this.fb.group({
      id: this.fb.control<number | null>(null),
      tName: '',
      specializations: this.fb.array<FormSpecialization>([])
    });
  }

  ngOnDestroy(): void {
    this.curriculumNames$.next();
    this.curriculumNames$.complete();
    this.courseNames$.next();
    this.courseNames$.complete();
  }
}