import { Component, inject, OnInit, ChangeDetectionStrategy, computed, signal} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { CurriculumsService } from '../../services/curriculums.service';
import { Curriculum } from '../../models/curriculum';
import { CoursesService } from '../../services/courses.service';
import { Course } from '../../models/course';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
export interface Task {
  name: string;
  completed: boolean;
  subtasks?: Task[];
}
interface Options {
  value: string;
  viewValue: string;
}

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
        MatButtonModule
  ],
  templateUrl: './curriculum.component.html',
  styleUrl: './curriculum.component.scss'
})
export class CurriculumComponent implements OnInit {
  specials: Options[] = [
    {value: '-', viewValue: 'Nincs választva'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos'},
  ];
  kats: Options[] = [
    {value: '-', viewValue: 'Nincs választva'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos'},
  ];
  curriculumData = inject(CurriculumsService);
  courseData = inject(CoursesService);
  
  curriculumName: string = "tan";
  specialization: string = "spec";
  category: string = "kat";
  
  courses: Course[] = [];
  
  displayedColumns: string[] = ['name', 'id', 'kredit', 'recommendedSemester', 'subjectResponsible', 'prerequisite'];

  ngOnInit(): void {
    console.log('Kezdeti értékek:', {
      curriculumName: this.curriculumName,
      specialization: this.specialization,
      category: this.category
    });

    this.curriculumData.getById("o8Oa0jwPJ6JroZazuktq").subscribe({
      next: (curriculum) => {
        console.log('Nyers curriculum adat:', curriculum);
        
        if (curriculum) {
          this.curriculumName = curriculum.name;
          this.specialization = curriculum.specialization;
          this.category = curriculum.category;
          
          console.log('Frissített értékek:', {
            curriculumName: this.curriculumName,
            specialization: this.specialization,
            category: this.category
          });
        }
      }
    });

    this.courseData.getAll().subscribe({
      next: (courses) => {
        console.log('Nyers kurzus adatok:', courses);
        
        if (courses) {
          this.courses = courses;
          console.log('Courses tömb frissítve:', this.courses);
        }
      }
    });
  }
  //'name', 'id', 'kredit', 'recommendedSemester', 'subjectResponsible', 'prerequisite'

  readonly task = signal<Task>({
    name: 'Összes mező',
    completed: true,
    subtasks: [
      {name: 'Név', completed: true},
      {name: 'Kód', completed: true},
      {name: 'Kredit', completed: true},
      {name: 'Ajánlót félév', completed: true},
      {name: 'Tárgy felelős', completed: true},
      {name: 'Előfeltétel', completed: true},
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
      return {...task};
    });
  }
}
