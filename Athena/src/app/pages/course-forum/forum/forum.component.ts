import { Component,  inject, OnInit} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Course } from '../../../models/course';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Location } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {MatListModule} from '@angular/material/list';
import { MessagesComponent } from "./messages/messages.component";
import { SubjectTopicComponent } from "./subject-topic/subject-topic.component";
import { CourseStatisticsComponent } from "./course-statistics/course-statistics.component";

/**
 * @description
 * A ForumComponent felelős egy adott kurzus fórumának megjelenítéséért.
 * Tartalmazza a kurzushoz kapcsolódó üzeneteket, a kurzus tárgytematikáját,
 * és a kurzus statisztikáit, amelyeket külön belső komponesekkel jelenít meg.
 * A komponens a `history.state`-ből kapja meg a megjelenítendő kurzus adatait.
 */
@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    TranslateModule,
    MessagesComponent,
    SubjectTopicComponent,
    CourseStatisticsComponent
],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss'
})
export class ForumComponent implements OnInit {
  private location = inject(Location);
  protected course: Course | null = null;
  protected option:'massages'|'topic'|'statistics' = 'massages'
  /**
   * @description
   * Az Angular életciklus metódusa, amely a komponens inicializálásakor fut le.
   * Lekéri a kurzus adatait a böngésző `history.state`-ből.
   */
  ngOnInit(): void {
    const state = history.state;
    this.course = state.course;
  }
  /**
   * @description
   * Megváltoztatja az aktív nézetet a fórumon belül.
   * @param option Az új nézet neve ('massages', 'topic', 'statistics').
   */
  protected changeOption(option: 'massages'|'topic'|'statistics'): void {
    this.option = option;
  }
  /**
   * @description
   * Visszanavigál az előző oldalra a böngésző előzményeiben.
   */
  protected back() {
    this.location.back();
  }
}
