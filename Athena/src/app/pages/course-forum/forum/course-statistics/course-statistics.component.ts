import { Component, AfterViewInit, ElementRef, ViewChild, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { createGR } from './charts/gradesRate';
import { creatD } from './charts/distrubution';
import { creatLR } from './charts/linearRegression';
import { creatCR } from './charts/completionRate';
import { creatBP } from './charts/boxplot';
import { StatisticsService } from '../../../../services/mysql/statistics.service';
//https://plotly.com/javascript/box-plots/
//https://plotly.com/javascript/pie-charts/#basic-pie-chart
//https://community.plotly.com/t/regresssion-line-in-javascript/87801/2


@Component({
  selector: 'app-course-statistics',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule], 
  templateUrl: './course-statistics.component.html',
  styleUrl: './course-statistics.component.scss'
})
export class CourseStatisticsComponent implements OnInit , AfterViewInit {  
  private statisticData = inject(StatisticsService);
  getdistrubutionData(){}
  getgradeRateData(){}
  getcompletionRateData(){}
  getlinearRegressionData(){}
  getboxplotData(){}
  
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
      switch(value) {
        case 'd':
          creatD();
          break;
        case 'gr':
          createGR();
          break;
        case 'cr':
          creatCR();
          break;
        case 'lr':
          creatLR();
          break;
        case 'bp':
            creatBP();
            break;
      }
    });
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





  





  

  

  ngOnInit(): void {
   // this.creatD();
  }
  ngAfterViewInit(): void {
    creatD();
  }
}