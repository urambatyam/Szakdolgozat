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
// //charts/linearRegression'
@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule, CommonModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements AfterViewInit{

  private statisticsService  = inject(StatisticsService);
  protected progressData:any = [];

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
        break;
      case 't':
        this.tan();
        break;
      case 'lr':
        this.linearRegression();
        break;
      case 'at':
        this.alltan();
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
