import { Component, inject, OnInit, computed, signal, ViewChildren, QueryList} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CourseService } from '../../services/mysql/course.service';
import { Course } from '../../models/course';
import { Task } from '../../models/tasks';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import { Name } from '../../models/curriculumNames';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { Curriculum } from '../../models/curriculum';
import { CurriculumService } from '../../services/mysql/curriculum.service';
import { catchError, EMPTY, firstValueFrom, from, map, of, startWith, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { state } from '@angular/animations';
import { GradeService } from '../../services/mysql/grade.service';
import { AuthService } from '../../services/mysql/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';





@Component({
  selector: 'app-curriculum',
  standalone: true,
  imports: [
        MatCardModule, 
        MatTableModule,
        MatCheckboxModule,
        MatFormFieldModule, 
        MatSelectModule, 
        MatInputModule, 
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatSortModule,
        TranslateModule
  ],
  templateUrl: './curriculum.component.html',
  styleUrl: './curriculum.component.scss'
})
export class CurriculumComponent implements OnInit {
protected visKat: boolean = true;
protected viewMode: 'student' | 'other' = 'other';
private router = inject(Router)
private translate = inject(TranslateService)
private gradeData = inject(GradeService)
protected toCourseForm(course: Course) {
  this.router.navigate(
    ['/forum'],
    {state: {course: course}}
  )
  console.log("Irány a ", course, " kurzus forumra!")
}
protected async apply(course: Course) {
  if(course.id){
    console.log("felvesz: ",course.id);
    await firstValueFrom(
      from(this.gradeData.createGrade(course.id)).pipe(
        tap(      reponse =>{
          console.log("Felveszem a ", course, " kurzust "+reponse)
          course.completed = true
        }),
        catchError(error => {
          console.error('Hiba: ', error);
          return EMPTY;
        })
      )
    )
  }

  
}


  tanterv:Curriculum|null = null;

  specialsVis = new Map<string,boolean>([['összes', true]]);
  katsVis = new Map<string,boolean>([['összes', true]]);
  katsVisalfa = new Map<string,boolean>([['összes', true]]);
  curs: Name[] = [];
  private mycurriculum:number|null = null;
  
  curriculumData = inject(CurriculumService);
  courseData = inject(CourseService);
  auth = inject(AuthService);
  
  curriculumName: string = "";
  displayedColumns: string[] = [];
 


  async LoadCurriculum(id:number){
    this.visKat = false;
    this.tanterv = null
    this.specialsVis= new Map<string,boolean>([['összes', true]]);
    this.katsVis = new Map<string,boolean>([['összes', true]]);
    await firstValueFrom(
      from(this.curriculumData.getCurriculum(id)).pipe(
        map(
          curriculum => {
            this.curriculumName = curriculum.name
            this.tanterv = curriculum
            this.tanterv.specializations.forEach(sp => {
              this.specialsVis.set(sp.name,true)
              sp.categories.forEach(cat => {
                this.katsVis.set(cat.name,true);})})
          }
        )
      )
    )
    this.katsVisalfa = this.katsVis;  
    console.log(this.tanterv);
  }
  
    async ngOnInit() {
      this.translate.onLangChange
      .pipe(
        startWith(null), 
        switchMap(() => {
          const taskName = this.translate.instant('curriculum.ALL_FIELDS'); 
          
          const subtasks = [
            {name: this.translate.instant('curriculum.NAME'), completed: true},
            {name: 'ID', completed: true},
            {name: this.translate.instant('curriculum.KREDIT'), completed: true},
            {name: this.translate.instant('curriculum.RS'), completed: true},
            {name: this.translate.instant('curriculum.SUBJECT_RESPONSIBLE'), completed: true},
            {name: this.translate.instant('curriculum.SEZON'), completed: true},
            {name: this.translate.instant('curriculum.APPLY'), completed: true},
            {name: this.translate.instant('curriculum.COURSE_FORUM'), completed: true},
          ];
          
          return of({ taskName, subtasks });
        })
      )
      .subscribe(({ taskName, subtasks }) => {
        this.task.update(value => ({
          ...value,
          name: taskName,
          subtasks
        }));
      });



      await firstValueFrom(
        from(this.auth.user$).pipe(
          map(user =>{
            this.viewMode = user?.role === 'student' ? 'student':'other';
            this.mycurriculum = user?.curriculum_id ?? null;
          })
        )
      );
      this.updateDisplayedColums();
      if(this.viewMode === 'other'){
        await firstValueFrom(
          from(this.curriculumData.getAllCurriculumNames()).pipe(
            map(
              names => {
                this.curs = names
                if(names[0].id){
                  this.LoadCurriculum(names[0].id);
                }
              }
            )
          )
        )
      }else if(this.mycurriculum){
        this.LoadCurriculum(this.mycurriculum);
      }
    }
  
    task = signal<Task>({
      name: '', // Ez lesz majd lefordítva
      completed: true,
      subtasks: []
    });
  /*readonly task = signal<Task>({
    name: 'összes',
    completed: true,
    subtasks: [
      {name: firstValueFrom(from(this.translate.stream('curriculum.NAME')).pipe(map(t =>{return t.key}))), completed: true},
      {name: 'ID', completed: true},
      {name: this.translate.instant('curriculum.KREDIT'), completed: true},
      {name: this.translate.stream('curriculum.RS'), completed: true},
      {name: this.translate.stream('curriculum.SUBJECT_RESPONSIBLE'), completed: true},
      {name: this.translate.stream('curriculum.SEZON'), completed: true},
      {name: this.translate.stream('curriculum.APPLY'), completed: true},
      {name: this.translate.stream('curriculum.COURSE_FORUM'), completed: true},
    ],
  });*/

  readonly partiallyComplete = computed(() => {
    console.log(firstValueFrom(from(this.translate.stream('curriculum.NAME').pipe(map(t =>{console.log('t');console.log(t)})))))
    console.log(this.translate.stream('curriculum.RS'))
    const task = this.task();
    if (!task.subtasks) {
      return false;
    }
    return task.subtasks.some(t => t.completed) && !task.subtasks.every(t => t.completed);
  });

  update(completed: boolean, index?: number) {
    this.task.update(task => {
      if (index === undefined) {
        task.completed = completed;
        task.subtasks?.forEach(t => (t.completed = completed));
      } else {
        task.subtasks![index].completed = completed;
        task.completed = task.subtasks?.every(t => t.completed) ?? true;
      }
      this.updateDisplayedColums();
      return {...task};
    });
  }

  private updateDisplayedColums(){
    const subtasks = this.task().subtasks;
    if(!subtasks){return;}
    this.displayedColumns = [];
    if (subtasks[0].completed) this.displayedColumns.push('name');
    if (subtasks[1].completed) this.displayedColumns.push('id');
    if (subtasks[2].completed) this.displayedColumns.push('kredit');
    if (subtasks[3].completed) this.displayedColumns.push('recommendedSemester');
    if (subtasks[4].completed) this.displayedColumns.push('sezon');
    if (subtasks[5].completed) this.displayedColumns.push('subjectResponsible');
    if (subtasks[6].completed) this.displayedColumns.push('apply');
    if (subtasks[7].completed) this.displayedColumns.push('course');
  }

  KatonSelectionChange(event: MatSelectChange) {
    console.log('Kiválasztott érték:', event.value);
    if( event.value !== "összes"){
      for(let key of this.katsVis.keys()){
        if(key !== event.value){
          this.katsVis.set(key, false);
        }else{
          this.katsVis.set(event.value, true);
        }
      }
    }else{
      for(let key of this.katsVis.keys()){
        this.katsVis.set(key, true);
      }
    }
  }  
  SpeconSelectionChange(event: MatSelectChange) {
    console.log('Kiválasztott érték:', event.value);
    if( event.value !== "összes"){
      for(let key of this.specialsVis.keys()){
        if(key !== event.value){
          this.specialsVis.set(key, false);
        }else{
          this.specialsVis.set(event.value, true);
        }
      }

     
      this.katsVis= new Map<string,boolean>([['összes', true]]);

      this.tanterv?.specializations.find(s => s.name === event.value)?.categories.map(k => {this.katsVis.set(k.name,true)}) 
      this.visKat=true;
      console.log('visKat:', this.visKat);
      console.log('kats:', this.katsVis);
    }else{
      for(let key of this.specialsVis.keys()){
        this.specialsVis.set(key, true);
      }
      this.katsVis = this.katsVisalfa;
      this.visKat=false;
      console.log('visKat:', this.visKat);
    }
    
  }

  GoalonSelectionChange(event: MatSelectChange) {
    console.log('Kiválasztott érték:', event.value);
  }  
  CuronSelectionChange(event: MatSelectChange) {
    console.log('Kiválasztott érték:', event.value);
    this.LoadCurriculum(event.value);
  }
}
