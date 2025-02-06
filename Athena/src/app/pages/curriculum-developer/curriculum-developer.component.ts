import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { TantervService } from '../../services/firebase/tanterv.service';
import { Curriculum } from '../../models/curriculum';
import { Specialization} from '../../models/special';
import { Category} from '../../models/category';
import { Course } from '../../models/course';
import { CoursesService } from '../../services/firebase/courses.service';

type FormCourse = FormGroup<{
  recommendedSemester:FormControl<number>
  subjectResponsible:FormControl<string>
  name:FormControl<string>
  kredit:FormControl<number>
}>;
type FormCategory = FormGroup<{
  catName: FormControl<string>
  courses: FormArray<FormCourse>
}>;
type FormSpecialization = FormGroup<{
  spName: FormControl<string>
  categories: FormArray<FormCategory>
}>;
type Form = FormGroup<{
  tName: FormControl<string>
  specializations: FormArray<FormSpecialization>;
}>;

@Component({
  selector: 'app-curriculum-developer',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule
  ],
  templateUrl: './curriculum-developer.component.html',
  styleUrl: './curriculum-developer.component.scss'
})
export class CurriculumDeveloperComponent implements OnInit {
  private curriculumService = inject(TantervService);
  private courseService = inject(CoursesService);
  private fb = inject(NonNullableFormBuilder);

  displayedColumns: string[] = ['name', 'update', 'delete'];
  tantervNevek = new MatTableDataSource<Curriculum>();
  title = "Tantervek";
  formVs = false;

  tantervForm:Form = this.fb.group({
    tName: '',
    specializations: this.fb.array<FormSpecialization>([])
  });



  ngOnInit(): void {
    this.formVs = false;
      this.curriculumService.getAllNames().subscribe({
        next: (ns) => {
          if(ns){
            console.log("vvv ",ns)
            this.tantervNevek.data = ns;
          }

        }
        
      })
  }


  generateSpecialization():FormSpecialization{
    return this.fb.group({
      spName: 'heje',
      categories: this.fb.array<FormCategory>([])
    })
  }    
  
  generateCategory():FormCategory{
    return this.fb.group({
      catName: '',
      courses: this.fb.array<FormCourse>([])
    })
  }    

  generateCourse():FormCourse{
    return this.fb.group({
      recommendedSemester: 0,
      subjectResponsible: '',
      name: '',
      kredit: 0,
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

  addCourses(spIndex:number, ctIndex:number):void{
    this.tantervForm.controls.specializations.at(spIndex).controls.categories.at(ctIndex).controls.courses.push(this.generateCourse())
  }

  removeCourses(spIndex:number, ctIndex:number, cIndex:number):void{
    this.tantervForm.controls.specializations.at(spIndex).controls.categories.at(ctIndex).controls.courses.removeAt(cIndex);
  }


  

  toupdate(name: string) {
    this.formVs = true;
    this.curriculumService.getCurriculumByName(name).subscribe({
      next: (curriculum) => {
        if (curriculum) {
          console.log("tantervd: ", curriculum)
          // Form újragenerálása az adatokkal
          this.tantervForm.patchValue({
            tName: curriculum.name
          });

          // Specializációk hozzáadása
          curriculum.specializations.forEach(spec => {
            const specForm = this.generateSpecialization();
            specForm.patchValue({
              spName: spec.name
            });

            // Kategóriák hozzáadása
            spec.categories.forEach(cat => {
              const catForm = this.generateCategory();
              catForm.patchValue({
                catName: cat.name
              });

              // Kurzusok hozzáadása
              cat.courses.forEach( courseId => {
                const courseForm = this.generateCourse();
                

                    courseForm.patchValue({
                      name: courseId,
                      kredit: 0,
                      recommendedSemester: 0,
                      subjectResponsible: '',
                    });
                    
                (catForm.get('courses') as FormArray).push(courseForm);
              });

              (specForm.get('categories') as FormArray).push(catForm);
            });

            this.tantervForm.controls.specializations.push(specForm);
          });
          
        }
      }
    });

    this.tantervForm.controls.specializations.controls.forEach((spV, spI)=>{
      this.tantervForm.controls.specializations.at(spI).controls.categories.controls.forEach((catV, catI)=>{
        this.tantervForm.controls.specializations.at(spI).controls.categories.at(catI).controls.courses.controls.forEach((cV,cI)=>{
          
          this.courseService.getByName(cV.controls.name.getRawValue()).subscribe({
            next: c => {
              cV.patchValue({
                name: c?.name,
                kredit: c?.kredit,
                recommendedSemester: c?.recommendedSemester,
                subjectResponsible: c?.subjectResponsible,
              })
            }
          })

        })
      })
    });
  }

  todelete(name: string) {
    this.curriculumService.deleteCurriculum(name);
  }

  create() {
    this.formVs = true;
    this.tantervForm = this.fb.group({
      tName: '',
      specializations: this.fb.array<FormSpecialization>([])
    });
  }

  close() {
    console.log("closue")
    this.tantervForm =   this.fb.group({
      tName: '',
      specializations: this.fb.array<FormSpecialization>([])
    });
    this.formVs = false;
  }

  onSubmit() {
    console.log("onSubmit")

    const curriculum:Curriculum = {
      name: this.tantervForm.controls.tName.getRawValue(),
      specializations: []
    };
    const courseRecords:Course[]= [];
    const tanName:string = this.tantervForm.controls.tName.getRawValue();
    this.tantervForm.controls.specializations.controls.forEach((spV, spI)=>{
      const Sptemp:Specialization = {
        name:spV.controls.spName.getRawValue(),
        categories: []
      }
      this.tantervForm.controls.specializations.at(spI).controls.categories.controls.forEach((catV, catI)=>{
        const Cattemp:Category = {
          name:catV.controls.catName.getRawValue(),
          courses: []
        }
        this.tantervForm.controls.specializations.at(spI).controls.categories.at(catI).controls.courses.controls.forEach((cV,cI)=>{
          Cattemp.courses.push(cV.controls.name.getRawValue())
          courseRecords.push({
            id: '',
            recommendedSemester: cV.controls.recommendedSemester.getRawValue(),
            subjectResponsible: cV.controls.subjectResponsible.getRawValue(),
            name: cV.controls.name.getRawValue(),
            kredit:cV.controls.kredit.getRawValue(),
            subjectMatter:'',
            //requirementsId: ''
          })
        })
        Sptemp.categories.push(Cattemp);
      })
      curriculum.specializations.push(Sptemp);
    });
    this.curriculumService.addOrUpdate(curriculum);
    courseRecords.forEach(c => {
      this.courseService.add(c)
    })

    this.formVs = false;
    this.tantervForm =   this.fb.group({
      tName: '',
      specializations: this.fb.array<FormSpecialization>([])
    });
    console.log(this.tantervForm.getRawValue());
  }
}