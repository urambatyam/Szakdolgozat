import { Component, AfterViewInit, inject, Input, ElementRef, ViewChild, ChangeDetectorRef, OnDestroy, HostListener, NgZone } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { StatisticsService } from '../../../../services/mysql/statistics.service';
import { TranslateModule} from '@ngx-translate/core';
import { debounceTime, firstValueFrom, Observable, Subject, takeUntil } from 'rxjs';
import * as Plotly from 'plotly.js-dist-min';
import { createGR } from './charts/gradesRate';
import { creatD } from './charts/distrubution';
import { createLR } from './charts/linearRegression';
import { creatCR } from './charts/completionRate';
import { creatBP } from './charts/boxplot';
import { CourseStatisticType} from './charts/common'; 

/**
 * Komponens a kurzusokhoz tartozó statisztikai diagramok megjelenítésére és kezelésére.
 * Lehetővé teszi a felhasználó számára, hogy különböző típusú diagramok között váltson
 * (normál eloszlás, boxplot, lineáris regresszió, jegy megoszlás, teljesítés megoszlás).
 * Automatikusan lekéri a szükséges adatokat a `StatisticsService`-en keresztül,
 * és a Plotly.js segítségével rendereli a diagramokat. Kezeli az ablak átméretezését
 * a diagramok reszponzív megjelenítéséhez.
 */
@Component({
  selector: 'app-course-statistics',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    TranslateModule
  ],
  templateUrl: './course-statistics.component.html',
  styleUrl: './course-statistics.component.scss'
})
export class CourseStatisticsComponent implements  AfterViewInit, OnDestroy {
  @Input() courseId:number = 0;
  @ViewChild('chartDiv') chartContainer!: ElementRef<HTMLDivElement>;
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  private resizeSubject = new Subject<void>();
  private ngZone = inject(NgZone);
  private statisticsService  = inject(StatisticsService);
  private _statistics: CourseStatisticType = CourseStatisticType.Distribution;
  protected readonly statisticsTypes: CourseStatisticType[] = [
    CourseStatisticType.Distribution,
    CourseStatisticType.GradeRate,
    CourseStatisticType.CompletionRate,
    CourseStatisticType.LinearRegression,
    CourseStatisticType.BoxPlot
  ];
  protected statisticsLabels: { [key in CourseStatisticType]: string } = {
    [CourseStatisticType.Distribution]: 'courseStatistics.DISTRIBUTION_TITLE',
    [CourseStatisticType.GradeRate]: 'courseStatistics.GRADE_RATE_TITLE',
    [CourseStatisticType.CompletionRate]: 'courseStatistics.COMPLETION_RATE_TITLE',
    [CourseStatisticType.LinearRegression]: 'courseStatistics.LINEAR_REGRESSION_TITLE',
    [CourseStatisticType.BoxPlot]: 'courseStatistics.BOXPLOT_TITLE'
  };
  protected title: string = this.statisticsLabels[this._statistics];

  /**
   * Getter az aktuális statisztika típusához.
   * @returns Az aktuális `CourseStatisticType`.
   */
  get statisctics(): CourseStatisticType {
    return this._statistics;
  }

  /**
   * Setter az aktuális statisztika típusának beállításához.
   * Ha az új érték különbözik a régitől, frissíti a címet és
   * újrarajzolja a diagramot az új típusnak megfelelően.
   * @param value Az új `CourseStatisticType` érték.
   */
  set statisctics(value: CourseStatisticType) {
    if (this._statistics !== value) {
      this._statistics = value;
      this.title = this.statisticsLabels[value];
      this.renderCurrentChart();
    }
  }

  /**
   * Angular életciklus metódus, amely a nézet inicializálása után fut le.
   * Ellenőrzi a `courseId` érvényességét, elindítja az első diagram renderelését,
   * és beállítja az ablak átméretezését figyelő eseménykezelőt.
   */
  ngAfterViewInit(): void {
    if (this.courseId <= 0) {
        console.error("Course ID is not set or invalid.");
        this.title = "courseStatistics.INVALID_COURSE_ID"; 
        this.cdr.markForCheck();
        return;
    }
    this.renderCurrentChart();
    this.setupResizeListener();
  }

  /**
   * Angular életciklus metódus, amely a komponens megsemmisülése előtt fut le.
   * Leállítja az összes aktív feliratkozást, és eltávolítja
   * a Plotly diagramot a DOM-ból, hogy megelőzze a memóriaszivárgást.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chartContainer?.nativeElement) {
        Plotly.purge(this.chartContainer.nativeElement);
    }
  }

  /**
   * Az ablak átméretezési eseményét kezeli.
   * Értesíti a `resizeSubject`-et, hogy átméretezés történt.
   * @param event Az átméretezési esemény objektum (nem használt).
   * @HostListener Figyeli a 'window:resize' eseményt.
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.resizeSubject.next();
  }

  /**
   * Beállítja az ablak átméretezését figyelő logikát.
   * A `resizeSubject` eseményeit figyeli, `debounceTime`-mal késlelteti a feldolgozást,
   * hogy ne fusson le túl gyakran. Átméretezéskor meghívja a
   * `Plotly.Plots.resize`-t az Angular zónán belül.
   */
  setupResizeListener(): void {
    this.resizeSubject.pipe(
      debounceTime(300), 
      takeUntil(this.destroy$) 
    ).subscribe(() => {
      this.ngZone.run(() => { 
        if (this.chartContainer?.nativeElement) {
          console.log('Resizing Plotly chart...');
          Plotly.Plots.resize(this.chartContainer.nativeElement);
        }
      });
    });
  }

  /**
   * Rendereli az aktuálisan kiválasztott statisztikai diagramot.
   * Először ellenőrzi a diagram konténer létezését, majd eltávolítja
   * az esetlegesen korábban renderelt diagramot.
   * Kiválasztja a megfelelő adatlekérő Observable-t és a diagramkészítő függvényt
   * az aktuális `_statistics` érték alapján. Végül meghívja a
   * `fetchAndRenderChart` metódust a kiválasztott paraméterekkel.
   */
  renderCurrentChart(): void {
    if (!this.chartContainer?.nativeElement) {
        console.warn('Chart container not available yet for rendering.');
        setTimeout(() => this.renderCurrentChart(), 50);
        return;
    }
    Plotly.purge(this.chartContainer.nativeElement);
    let dataObservable: Observable<any>; 
    let createChartFn: (targetElement: HTMLDivElement, response: any) => void; 
    const currentStatistic = this._statistics; 
    switch (currentStatistic) {
      case CourseStatisticType.Distribution:
        dataObservable = this.statisticsService.courseDistribution(this.courseId);
        createChartFn = creatD;
        break;
      case CourseStatisticType.GradeRate:
        dataObservable = this.statisticsService.courseGradeRate(this.courseId);
        createChartFn = createGR;
        break;
      case CourseStatisticType.CompletionRate:
        dataObservable = this.statisticsService.courseCompletionRate(this.courseId);
        createChartFn = creatCR;
        break;
      case CourseStatisticType.LinearRegression:
        dataObservable = this.statisticsService.courseLinearRegression(this.courseId);
        createChartFn = createLR;
        break;
      case CourseStatisticType.BoxPlot:
        dataObservable = this.statisticsService.courseBoxplot(this.courseId);
        createChartFn = creatBP;
        break;
      default:
        console.error('Unknown statistic type:', currentStatistic);
        return;
    }
    this.fetchAndRenderChart(dataObservable, createChartFn, this.statisticsLabels[currentStatistic], currentStatistic);
  }

 /**
   * Általános metódus a diagram adatok aszinkron lekérésére és a diagram kirajzolására.
   * Beállítja a diagram címét, ellenőrzi a konténer elemet.
   * Meghívja a kapott `dataObservable`-t az adatok lekéréséhez.
   * Mielőtt a diagramot kirajzolná a `createChartFn` segítségével, ellenőrzi,
   * hogy a felhasználó időközben nem váltott-e másik statisztika típusra.
   * Biztosítja a változásdetektálás futtatását.
   *
   * @private
   * @param dataObservable Az Observable, amely a diagramhoz szükséges adatokat szolgáltatja.
   * @param createChartFn A függvény, amely a kapott adatok alapján létrehozza a Plotly diagramot a cél elemben.
   * @param titleKey A diagram címének fordítási kulcsa.
   * @param statisticType Az a `CourseStatisticType`, amelyhez az adatokat lekérjük és a diagramot rajzoljuk.
   * @returns Promise<void> Aszinkron művelet, amely a renderelés befejeződésekor oldódik fel.
   */
 private async fetchAndRenderChart(
  dataObservable: Observable<any>,
  createChartFn: (targetElement: HTMLDivElement, response: any) => void, 
  titleKey: string,
  statisticType: CourseStatisticType
): Promise<void> {
  this.title = titleKey;
  this.cdr.markForCheck(); 
   if (!this.chartContainer?.nativeElement) {
      console.error(`Chart container not found when trying to render ${titleKey}`);
      return;
  }
  const targetElement = this.chartContainer.nativeElement;
  try {
    const response = await firstValueFrom(dataObservable.pipe(takeUntil(this.destroy$)));
    if (this._statistics !== statisticType) {
        return; 
    }
    if (this.chartContainer?.nativeElement) {
        createChartFn(targetElement, response);
    } else {
        console.warn(`Chart container disappeared before rendering ${titleKey}`);
    }
  } catch (error) {
    console.error(`${titleKey} data fetch error: `, error);
    if (this._statistics === statisticType && this.chartContainer?.nativeElement) {
       targetElement.innerHTML = `<p style="text-align: center; padding: 20px;">Hiba történt az adatok lekérése közben.</p>`;
    }
  } finally {
      this.cdr.markForCheck();
  }
}


/**
 * Az előző statisztikai diagramra navigál a `statisticsTypes` listában.
 * Ciklikusan működik, azaz az első elem után az utolsóra ugrik.
 * Beállítja a `statisctics` property értékét, ami kiváltja a diagram újrarajzolását.
 */
navigatePrevious(): void {
  const currentIndex = this.statisticsTypes.indexOf(this._statistics);
  const previousIndex = (currentIndex - 1 + this.statisticsTypes.length) % this.statisticsTypes.length;
  this.statisctics = this.statisticsTypes[previousIndex]; 
}

/**
 * A következő statisztikai diagramra navigál a `statisticsTypes` listában.
 * Ciklikusan működik, azaz az utolsó elem után az elsőre ugrik.
 * Beállítja a `statisctics` property értékét, ami kiváltja a diagram újrarajzolását.
 */
navigateNext(): void {
  const currentIndex = this.statisticsTypes.indexOf(this._statistics);
  const nextIndex = (currentIndex + 1) % this.statisticsTypes.length;
  this.statisctics = this.statisticsTypes[nextIndex]; 
}

}
