import { Component, inject, OnInit, ChangeDetectionStrategy, computed, signal} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { CurriculumsService } from '../../services/curriculums.service';
import { CoursesService } from '../../services/courses.service';
import { Course } from '../../models/course';
import { Task } from '../../models/tasks';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import { Name } from '../../models/curriculumNames';
import { Curriculum } from '../../models/curriculum';



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
  specials: Name[] = [
    {name: 'Nincs választva'},
  ];
  kats: Name[] = [
    {name: 'Nincs választva'},
  ];  
  curs: Name[] = [];
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
    this.curriculumData.getAllNames().subscribe({
      next: (names) => {
        if(names){
          this.curs = names
          console.log('Name:', names[0].name);
          this.curriculumData.getByNames(names[0].name).subscribe({
            next: (curriculum) => {
              console.log('NULLL', curriculum);
              
              if (curriculum) {
                curriculum.forEach((c:Curriculum) => {
                  console.log('Nyers c adat:', c);

                  this.curriculumName = c.name;
                  this.specials.push({name:c.specialization});
                  this.kats.push({name:c.category});
                  this.specialization = c.specialization;
                  this.category = c.category;

                });


 
                console.log('Frissített értékek:', {
                  curriculumName: this.curriculumName,
                  specialization: this.specialization,
                  category: this.category
                });
              }
            }
          });
        }
      },
      error: (e) => {
        alert("Nem sikerült a  tantervek neveit beolvasni! "+ e)
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
