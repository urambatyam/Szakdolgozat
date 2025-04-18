import { Component, AfterViewInit, OnInit, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { createGR } from './charts/gradesRate';
import { creatD } from './charts/distrubution';
import { createLR } from './charts/linearRegression';
import { creatCR } from './charts/completionRate';
import { creatBP } from './charts/boxplot';
import { StatisticsService } from '../../../../services/mysql/statistics.service';
import { TranslateService } from '@ngx-translate/core';



@Component({
  selector: 'app-course-statistics',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule], 
  templateUrl: './course-statistics.component.html',
  styleUrl: './course-statistics.component.scss'
})
export class CourseStatisticsComponent implements  AfterViewInit { 
  @Input() courseId:number = 0;
  
  private statisticsService  = inject(StatisticsService);
  constructor(private translate: TranslateService) {
    translate.setDefaultLang('hu');
    translate.use('hu');
  }

  private _statistics: 'd' | 'gr' | 'cr' | 'lr' | 'bp' = 'd';
  statisticsTypes: ('d' | 'gr' | 'cr' | 'lr' | 'bp')[] = ['d', 'gr', 'cr', 'lr', 'bp'];
  statisticsLabels: {[key: string]: string} = {
    'd': 'Jegyek eloszlása',
    'gr': 'Jegyek aránya',
    'cr': 'Teljesités aránya',
    'lr': 'Lineáris regresszió',
    'bp': 'Doboz diagram'
  };

  get statisctics(): 'd' | 'gr' | 'cr' | 'lr' | 'bp'{
    return this._statistics;
  }

  set statisctics(value: 'd' | 'gr' | 'cr' | 'lr'| 'bp') {
    this._statistics = value;
    
    // Aszinkron módon frissítsd a diagramot a változásdetektálási hiba elkerülése érdekében
    setTimeout(() => {
      this.renderCurrentChart();
    });
  }
  // Adatok lekérése
  getdistrubutionData() {
    if (this.courseId > 0) {
      this.statisticsService.courseDistribution(this.courseId).subscribe({
        next: (data) => {
          creatD(data);
        },
        error: (error) => console.error('Error loading distribution data', error)
      });
    }
  }

  getgradeRateData() {
    if (this.courseId > 0) {
      this.statisticsService.courseGradeRate(this.courseId).subscribe({
        next: (data) => {
          createGR(data);
        },
        error: (error) => console.error('Error loading grade rate data', error)
      });
    }
  }

  getcompletionRateData() {
    if (this.courseId > 0) {
      this.statisticsService.courseCompletionRate(this.courseId).subscribe({
        next: (data) => {
          creatCR(data);
        },
        error: (error) => console.error('Error loading completion rate data', error)
      });
    }
  }

  getlinearRegressionData() {
    if (this.courseId > 0) {
      this.statisticsService.courseLinearRegression(this.courseId).subscribe({
        next: (data) => {
          createLR(data);
        },
        error: (error) => console.error('Error loading linear regression data', error)
      });
    }
  }

  getboxplotData() {
    if (this.courseId > 0) {
      this.statisticsService.courseBoxplot(this.courseId).subscribe({
        next: (data) => {
          creatBP(data);
        },
        error: (error) => console.error('Error loading boxplot data', error)
      });
    }
  }

  // Aktuális diagram kirajzolása
  renderCurrentChart() {
    switch(this._statistics) {
      case 'd':
        this.getdistrubutionData();
        break;
      case 'gr':
        this.getgradeRateData();
        break;
      case 'cr':
        this.getcompletionRateData();
        break;
      case 'lr':
        this.getlinearRegressionData();
        break;
      case 'bp':
        this.getboxplotData();
        break;
    }
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

  ngAfterViewInit(): void {
    // Az első diagram betöltése
    this.renderCurrentChart();
  }
}