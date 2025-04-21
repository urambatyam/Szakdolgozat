import { AfterViewInit, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { StatisticsService } from '../../services/mysql/statistics.service';
import { createT } from './charts/tan';
import { createLR } from '../course-forum/forum/course-statistics/charts/linearRegression';
import { CommonModule } from '@angular/common';
import { catchError, EMPTY, firstValueFrom, from, map } from 'rxjs';
import { createAT } from './charts/allTan';
import { TranslateModule } from '@ngx-translate/core';
// //charts/linearRegression'
@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [TranslateModule,MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule, CommonModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements AfterViewInit{

  private statisticsService  = inject(StatisticsService);
  protected progressData:any = [];
  protected title: "statistics.PROGRESS" | "statistics.TAN" | "statistics.LINEAR_REGRESSION" | "statistics.ALL_TAN" = "statistics.PROGRESS";

  ngAfterViewInit(): void {
    this.renderCurrentChart();
  }
  private _statistics: 'p' | 't' | 'lr' | 'at'  = 'p';
  statisticsTypes: ('p' | 't' | 'lr' | 'at')[] = ['p' , 't' , 'lr' , 'at'];
  statisticsLabels: {[key: string]: string} = {
    'p': 'Előrehaladás',
    't': 'Tanulmányi átlag',
    'lr': 'Lineáris regresszió',
    'at': 'Összesitet tatnulmányi átlag',
  };

  get statisctics(): 'p' | 't' | 'lr' | 'at'{
    return this._statistics;
  }

  set statisctics(value: 'p' | 't' | 'lr' | 'at') {
    this._statistics = value;
    setTimeout(() => {
      this.renderCurrentChart();
    });
  }
  renderCurrentChart() {
    switch(this._statistics) {
      case 'p':
        this.progress();
        this.title = "statistics.PROGRESS";
        break;
      case 't':
        this.tan();
        this.title = "statistics.TAN";
        break;
      case 'lr':
        this.linearRegression();
        this.title = "statistics.LINEAR_REGRESSION";
        break;
      case 'at':
        this.alltan();
        this.title = "statistics.ALL_TAN";
        break;
    }
  }
  tan(){
    firstValueFrom(
      from(this.statisticsService.studentTAN())
        .pipe(
          map(response => {
            console.log(response);
            createT(response);
          }),
          catchError(error => {
            console.error('Hiba: ', error);
            return EMPTY;
          }))
    );
  }
  linearRegression(){
    firstValueFrom(
      from(this.statisticsService.studentLinearisRegression())
        .pipe(
          map(response => {
            console.log(response);
            createLR(response);
          }),
          catchError(error => {
            console.error('Hiba: ', error);
            return EMPTY;
          }))
    );
  }
  alltan(){
    firstValueFrom(
      from(this.statisticsService.allTAN())
        .pipe(
          map(response => {
            console.log(response);
            createAT(response);
          }),
          catchError(error => {
            console.error('Hiba: ', error);
            return EMPTY;
          }))
    );
  }
  progress(){
    firstValueFrom(
      from(this.statisticsService.progres())
        .pipe(
          map(response => {
            console.log(response);
            this.progressData = response;
          }),
          catchError(error => {
            console.error('Hiba: ', error);
            return EMPTY;
          }))
    );
  }



  // Nyilakkal navigáció
  navigatePrevious() {
    const currentIndex = this.statisticsTypes.indexOf(this._statistics);
    const previousIndex = (currentIndex - 1 + this.statisticsTypes.length) % this.statisticsTypes.length;
    this.statisctics = this.statisticsTypes[previousIndex];
  }

  navigateNext() {
    const currentIndex = this.statisticsTypes.indexOf(this._statistics);
    const nextIndex = (currentIndex + 1) % this.statisticsTypes.length;
    this.statisctics = this.statisticsTypes[nextIndex];
  }
}
