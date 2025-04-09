import { AfterViewInit, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { StatisticsService } from '../../services/mysql/statistics.service';
import { createA } from './charts/Avarage';
import { createAA } from './charts/AllAvarege';
import { createP } from './charts/progress';
import { createLR } from './charts/linearRegression';
import { CommonModule } from '@angular/common';
interface CategoryData {
  name: string;
  earnedCredits: number;
  totalCredits: number;
}

interface SpecializationData {
  name: string;
  categories: CategoryData[];
}
@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule, CommonModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements AfterViewInit{
  totalCredits = 44;
  completedCredits = 12;
  progress = (this.completedCredits / this.totalCredits) * 100;

  subjects = [
    { name: 'Matematika', earned: 8, total: 20, color: 'accent' },
    { name: 'Informatika', earned: 4, total: 24, color: 'warn' },
  ];
   myData: SpecializationData[] = [
    {
      name: 'Szoftverfejlesztés',
      categories: [
        { name: 'Matematika', earnedCredits: 8, totalCredits: 20 },
        { name: 'Informatika', earnedCredits: 4, totalCredits: 24 },
      ],
    },
    {
      name: 'Adatbányászat',
      categories: [
        { name: 'Matematika', earnedCredits: 12, totalCredits: 20 },
        { name: 'Informatika', earnedCredits: 10, totalCredits: 24 },
      ],
    },
  ];
  ngAfterViewInit(): void {
    createP(this.myData);
  }
  private statisticData = inject(StatisticsService);
  private _statistics: 'p' | 'a' | 'lr' | 'aa'  = 'p';
  statisticsTypes: ('p' | 'a' | 'lr' | 'aa')[] = ['p' , 'a' , 'lr' , 'aa'];
  statisticsLabels: {[key: string]: string} = {
    'p': 'Előrehaladás',
    'a': 'Tanulmányi átlag',
    'lr': 'Lineáris regresszió',
    'aa': 'Összesitet tatnulmányi átlag',
  };

  get statisctics(): 'p' | 'a' | 'lr' | 'aa'{
    return this._statistics;
  }

  set statisctics(value: 'p' | 'a' | 'lr' | 'aa') {
    this._statistics = value;
    // Aszinkron módon frissítsd a diagramot a változásdetektálási hiba elkerülése érdekében
    setTimeout(() => {
      switch(value) {
        case 'p':
          createP(this.myData);
          break;
        case 'a':
          createA();
          break;
        case 'lr':
          createLR();
          break;
        case 'aa':
          createAA();
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
}
