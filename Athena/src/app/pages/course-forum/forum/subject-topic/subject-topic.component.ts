import { Component, inject, Input, OnInit } from '@angular/core';
import { SubjectMatter } from '../../../../models/subjectMatter';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, EMPTY, firstValueFrom, from, tap } from 'rxjs';
import { SubjectMatterService } from '../../../../services/mysql/subject-matter.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-subject-topic',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './subject-topic.component.html',
  styleUrl: './subject-topic.component.scss'
})
export class SubjectTopicComponent implements OnInit {
  @Input() courseId: number|null = null;
  protected subjectMatter: SubjectMatter|null = null;
  private fb = inject(NonNullableFormBuilder);
  private subjectMatterData = inject(SubjectMatterService);
  protected subjectMatterForm = this.fb.group({
    id: this.fb.control<number|null>(null),
    topic: this.fb.control<string|null>(null),
    goal: this.fb.control<string|null>(null),
    requirements: this.fb.control<string|null>(null)
  });
  ngOnInit(): void {
    this.getSubjectMatter(this.courseId)
  }
  private async getSubjectMatter(courseId: number|null): Promise<void> {
    if(courseId){
      await firstValueFrom(
        from(this.subjectMatterData.getSebjectMatter(courseId)).pipe(
          tap((subjectMatter: SubjectMatter|null) => {
            this.subjectMatter = subjectMatter}
          ),
          catchError(error => {console.error('Hiba:', error);return EMPTY;})
        ))
    }else{
      console.log("nem kaptam meg a kurzus id-t",this.courseId);
   }
  }
  async onSubmit(): Promise<void> {
    if(this.courseId){
      const newSubjectMatter: SubjectMatter = {
        id: this.subjectMatterForm.value.id ?? null,
        course_id: this.courseId,
        topic: this.subjectMatterForm.value.topic ?? null,
        goal: this.subjectMatterForm.value.goal ?? null,
        requirements: this.subjectMatterForm.value.requirements ?? null,
      };
      await firstValueFrom(
        from(this.subjectMatterData.updateSebjectMatter(newSubjectMatter)).pipe(
          tap(() => {this.subjectMatterForm.reset();this.getSubjectMatter(this.courseId);}),
          catchError(error => {console.error('Hiba:', error);return EMPTY;})
        )
      )      
      }else{
         console.log("nem kaptam meg a kurzus id-t",this.courseId);
      }
  }
}
