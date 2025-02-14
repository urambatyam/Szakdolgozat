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
import { firstValueFrom, from, map } from 'rxjs';





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
        MatSortModule
  ],
  templateUrl: './curriculum.component.html',
  styleUrl: './curriculum.component.scss'
})
export class CurriculumComponent implements OnInit {
protected visKat: boolean = true;
protected toCourseForm(courseId: number) {
    console.log("Irány a ", courseId, " kurzus forumra!")
}
protected apply(courseId: number) {
  console.log("Felveszem a ", courseId, " kurzust")
}

/*applyFilter(event: Event, s:string, k:string) {
  console.log("event", event, " v ",);
  const filterValue = (event.target as HTMLInputElement).value;
  const data = this.tanterv?.specializations.find(sp => sp.name === s)?.categories.find(kt => kt.name === k)?.courseMatdata;
  if(data){
    data.filter = filterValue.trim().toLowerCase();
  }
  
}
  @ViewChildren(MatSort) sortList!: QueryList<MatSort>;
  
  ngAfterViewInit() {
    this.sortList.changes.subscribe(() => {
      this.updateSorting();
    });
    
    this.updateSorting();
  }

  private updateSorting() {
    this.tanterv?.specializations.forEach((special, specialIndex) => {
      special.categories.forEach((kat, katIndex) => {
        const sortIndex = this.getSortIndex(specialIndex, katIndex);
        const sort = this.sortList.toArray()[sortIndex];
        if (sort) {
          if(kat.courseMatdata)
            kat.courseMatdata.sort = sort;
        }
      });
    });
  }

  private getSortIndex(specialIndex: number, katIndex: number): number {
    let index = 0;
    for (let i = 0; i < specialIndex; i++) {
      index += this.tanterv?.specializations[i]?.categories?.length ?? 0;
    }
    return index + katIndex;
  }*/
 

  tanterv:Curriculum|null = null;

  specialsVis = new Map<string,boolean>([['összes', true]]);
  katsVis = new Map<string,boolean>([['összes', true]]);
  katsVisalfa = new Map<string,boolean>([['összes', true]]);
  curs: Name[] = [];
  
  curriculumData = inject(CurriculumService);
  courseData = inject(CourseService);
  
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
      this.updateDisplayedColums();
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
    }
  

  readonly task = signal<Task>({
    name: 'Összes mező',
    completed: true,
    subtasks: [
      {name: 'Név', completed: true},
      {name: 'Kód', completed: true},
      {name: 'Kredit', completed: true},
      {name: 'Ajánlót félév', completed: true},
      {name: 'Tárgy felelős', completed: true},
      {name: 'Felvétel', completed: true},
      {name: 'Kurzus Forum', completed: true},
    ],
  });

  readonly partiallyComplete = computed(() => {
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
    if (subtasks[4].completed) this.displayedColumns.push('subjectResponsible');
    if (subtasks[5].completed) this.displayedColumns.push('apply');
    if (subtasks[6].completed) this.displayedColumns.push('course');
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
