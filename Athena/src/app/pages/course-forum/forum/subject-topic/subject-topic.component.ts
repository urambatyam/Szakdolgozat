import { Component, inject, Input, OnInit } from '@angular/core';
import { SubjectMatter } from '../../../../models/subjectMatter';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, EMPTY, firstValueFrom, from, map, of, tap } from 'rxjs';
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
  //protected subjectMatter: SubjectMatter|null = null;
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

  private async getSubjectMatter(courseId: number | null): Promise<void> {
    if (!courseId) { // Egyszerűbb ellenőrzés
      console.log("Nem kaptam meg a kurzus ID-t:", courseId);
      return; // Kilépés, ha nincs ID
    }

    try {
      // A 'from()' operátor eltávolítva
      const subjectMatter = await firstValueFrom(
        this.subjectMatterData.getSebjectMatter(courseId).pipe( // Figyelj a typo-ra: getSebjectMatter
          catchError(error => {
            console.error('Hiba a tárgytematika lekérésekor:', error);
            // Adj vissza egy null Observable-t, hogy a firstValueFrom null-t kapjon
            return of(null);
          })
        )
      );

      // Ellenőrizzük, hogy sikeres volt-e a lekérdezés
      if (subjectMatter) {
        console.log('Kapott SubjectMatter:', subjectMatter);
        console.log('Form állapota patch előtt:', subjectMatter.id);

        this.subjectMatterForm.patchValue({
          id: subjectMatter.id,             // Érték: 28
          topic: subjectMatter.topic,         // Érték: null
          goal: subjectMatter.goal,           // Érték: null
          requirements: subjectMatter.requirements // Érték: null
        });
    
        // Most logold ki újra az értékeket
        console.log('Form értéke patch után:', this.subjectMatterForm.value,' ',subjectMatter.id);
        console.log('ID control:', this.subjectMatterForm.get('id')?.value);
        console.log('Topic control:', this.subjectMatterForm.get('topic')?.value);
      } else {
        console.log('Nem sikerült adatot lekérni, vagy hiba történt.');
        // Opcionálisan resetelheted a formot, vagy hibaüzenetet jeleníthetsz meg
        // this.subjectMatterForm.reset();
      }

    } catch (error) {
      // Ez a catch blokk elkaphatja a firstValueFrom hibáit is
      console.error('Hiba a getSubjectMatter feldolgozása során:', error);
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
