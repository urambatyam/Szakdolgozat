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
import { AuthService } from '../../../services/mysql/auth.service';
import { map } from 'rxjs';

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
//a
  ngOnInit(): void {
    const state = history.state;
    this.course = state.course;
  }
  protected changeOption(option: 'massages'|'topic'|'statistics'): void {
    this.option = option;
  }
  protected back() {
    this.location.back();
  }
}
