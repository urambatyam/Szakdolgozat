import { Component, inject, Input, OnInit } from '@angular/core';
import { SubjectMatter } from '../../../../models/subjectMatter';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, EMPTY, firstValueFrom, from, of, tap } from 'rxjs';
import { SubjectMatterService } from '../../../../services/mysql/subject-matter.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
/**
 * Ez a komponens felelős egy adott kurzus tárgytematikájának
 * megjelenítéséért és szerkesztéséért/mentéséért.
 */
@Component({
  selector: 'app-subject-topic',
  standalone: true,
  imports: [
    TranslateModule,
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
  private fb = inject(NonNullableFormBuilder);
  private subjectMatterData = inject(SubjectMatterService);
  protected subjectMatterForm = this.fb.group({
    id: this.fb.control<number|null>(null),
    topic: this.fb.control<string|null>(null),
    goal: this.fb.control<string|null>(null),
    requirements: this.fb.control<string|null>(null)
  });
  /**
   * Az Angular életciklus metódusa, amely a komponens inicializálásakor fut le.
   * Elindítja a tárgytematika adatainak lekérését.
   */
  ngOnInit(): void {
    this.getSubjectMatter(this.courseId)
  }
  /**
   * @description
   * Lekéri a tárgytematika adatait a megadott kurzus azonosító alapján a szolgáltatástól.
   * Frissíti a `subjectMatterForm` űrlapot a kapott adatokkal.
   * Kezeli a betöltési állapotot és a hibákat.
   * @param courseId A kurzus azonosítója, amelyhez az adatokat le kell kérni.
   * @private
   */
  private async getSubjectMatter(courseId: number | null): Promise<void> {
    if (!courseId) { 
      alert("Nem kaptam meg a kurzus ID-t:"+ courseId);
      return; 
    }
    try {
      const subjectMatter = await firstValueFrom(
        this.subjectMatterData.getSebjectMatter(courseId).pipe( 
          catchError(error => {
            console.error('Hiba a tárgytematika lekérésekor:', error);
            return of(null);
          })
        )
      );
      if (subjectMatter) {
        this.subjectMatterForm.patchValue({
          id: subjectMatter.id,          
          topic: subjectMatter.topic,      
          goal: subjectMatter.goal,          
          requirements: subjectMatter.requirements 
        });
      } else {
        console.warn('Nem sikerült adatot lekérni, vagy hiba történt.');
      }
    } catch (error) {
      console.error('Hiba a getSubjectMatter feldolgozása során:', error);
    }
  }
  /**
   * Az űrlap elküldésekor hívódik meg.
   * Ellenőrzi az űrlap érvényességét és a `courseId` meglétét.
   * Létrehoz egy `SubjectMatter` objektumot az űrlap adataiból.
   * Elküldi az adatokat frissítésre.
   * Sikeres mentés után újra lekéri az adatokat.
   */
  protected async onSubmit(): Promise<void> {
    if (!this.subjectMatterForm.valid) {
      console.warn("Az űrlap érvénytelen, mentés megszakítva.");
      return;
   }
   if (!this.courseId) {
    console.error("Hiba: Hiányzó kurzus ID a tematika mentésekor.");
    return;
  }
  const newSubjectMatter: SubjectMatter = {
    id: this.subjectMatterForm.value.id ?? null,
    course_id: this.courseId,
    topic: this.subjectMatterForm.value.topic ?? null,
    goal: this.subjectMatterForm.value.goal ?? null,
    requirements: this.subjectMatterForm.value.requirements ?? null,
  };
  try{
    await firstValueFrom(
      from(this.subjectMatterData.updateSebjectMatter(newSubjectMatter)).pipe(
        tap(() => {this.subjectMatterForm.reset();this.getSubjectMatter(this.courseId);}),
        catchError(error => {console.error('Hiba:', error);return EMPTY;})
      )
    ) 
  } catch (error) {
    console.error("Váratlan hiba az onSubmit során:", error);
  }
  }
}
