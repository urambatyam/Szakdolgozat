import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CoursesService } from '../../services/courses.service';
import { Course } from '../../models/course';

@Component({
  selector: 'app-course-forum',
  standalone: true,
  imports: [    
    MatCardModule,
      MatTableModule,
      MatIconModule,],
  templateUrl: './course-forum.component.html',
  styleUrl: './course-forum.component.scss'
})
export class CourseForumComponent implements OnInit{
  courseData = inject(CoursesService)
ngOnInit(): void {
  this.courseNames = [];
  this.courseData.getAll().subscribe({
    next: c => {
      this.courseNames = c;
    }
  })
}
  
toview(arg0: any) {
throw new Error('Method not implemented.');
}
courseNames: Course[] = [];
title: any;
displayedColumns: string[] = ['name', 'update', 'delete', 'view'];
toupdate(arg0: any) {
throw new Error('Method not implemented.');
}
todelete(id: string) {
  console.log('d ', id)
  this.courseData.deleteById(id);
}
create() {
throw new Error('Method not implemented.');
}

}
