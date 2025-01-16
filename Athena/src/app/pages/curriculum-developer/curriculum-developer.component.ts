import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CurriculumsService } from '../../services/curriculums.service';
import { CoursesService } from '../../services/courses.service';
import { Name } from '../../models/curriculumNames';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-curriculum-developer',
  standalone: true,
  imports: [
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
export class CurriculumDeveloperComponent implements OnInit{
toPlus() {
throw new Error('Method not implemented.');
}
    curriculumData = inject(CurriculumsService);
    courseData = inject(CoursesService);
    displayedColumns: string[] = ['name','update','delete'];
    tantervNevek = new MatTableDataSource<Name>();
    title: string = "Tantervek";
    ngOnInit(): void {
      this.curriculumData.getAllNames().subscribe({
        next: (ns) => {
          if(ns){
            this.tantervNevek.data = ns;
          }

        }
        
      })
    }
    todelete(name: string) {
      //this.curriculumData.deleteById(name);
    }
    toupdate(name: string) {
      //this.curriculumData.updateById(name)
    }
    
}
