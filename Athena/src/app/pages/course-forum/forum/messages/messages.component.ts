import { Component, inject, Input, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { CourseForum } from '../../../../models/courseForum';
import { catchError, EMPTY, firstValueFrom, tap } from 'rxjs';
import { CourseForumService } from '../../../../services/mysql/course-forum.service';
import { DatePipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

/**
 * @description
 * Ez a komponens felelős egy adott kurzushoz tartozó fórumüzenetek megjelenítéséért
 * és új üzenetek küldésért.
 */
@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    TranslateModule,
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    DatePipe
  ],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit{
  @Input() courseId:number|null = null;
  private fb = inject(NonNullableFormBuilder);
  private forumData = inject(CourseForumService);
  protected forumForm = this.fb.group({
    text: ''
  });
  protected messages: CourseForum[] = [];
  /**
   * @description
   * Az Angular életciklus metódusa, amely a komponens inicializálásakor fut le.
   * Ellenőrzi, hogy van-e `courseId`, és ha igen, elindítja a fórumüzenetek lekérését.
   */
  async ngOnInit(): Promise<void> {
    if(this.courseId){
      await this.getForums(this.courseId);
    }else{
      console.error("nem kaptam meg a kurzus id-t",this.courseId);
    }
  }
  /**
   * @description
   * Lekéri a fórumüzeneteket a megadott kurzus azonosító alapján.
   * Frissíti a `messages` tömböt a kapott adatokkal.
   * @param courseId A kurzus azonosítója, amelyhez az üzeneteket le kell kérni.
   * @private 
   */
  private async getForums(courseId:number): Promise<void> {
    try {
      const forums = await firstValueFrom(this.forumData.getAllCourseForumsInCourse(courseId).pipe(
        catchError(error => {
          console.error('Hiba a fórumüzenetek lekérésekor:', error);
          return EMPTY; 
        })
      ));
      this.messages = forums || [];
    } catch (error) {
      console.error('Váratlan hiba a getForums során:', error);
      this.messages = []; 
    }
  }
  /**
   * @description
   * Az űrlap elküldésekor hívódik meg.
   * Ellenőrzi az űrlap érvényességét.
   * Létrehoz egy új üzenet objektumot és elküldi a szolgáltatásnak mentésre.
   * Sikeres mentés után üríti az űrlapot és újratölti az üzenetlistát.
   * Kezeli a betöltési állapotot és a hibákat.
   */
  protected async onSubmit(): Promise<void>  {
    if (!this.forumForm.valid || !this.forumForm.value.text) {
      console.warn("Üres vagy érvénytelen üzenet, küldés megszakítva.");
      return; 
    }
    if (!this.courseId) {
      console.error("Hiba: Hiányzó kurzus ID az üzenet küldésekor.");
      return; 
    }
    const newMessage: CourseForum = {
      course_id: this.courseId,
      message: this.forumForm.value.text,
    };
    try{
      await firstValueFrom(
        this.forumData.createCourseForum(newMessage).pipe(
          tap(() => {this.forumForm.reset();}),
          catchError(error => {console.error('Hiba:', error);return EMPTY;})
        )
      )
      await this.getForums(this.courseId);
    }catch (error) {
      console.error("Váratlan hiba az onSubmit során:", error);
    }
  }
}
