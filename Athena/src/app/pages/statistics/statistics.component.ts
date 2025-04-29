import { AfterViewInit, Component, inject, ViewChild, ElementRef, HostListener, NgZone, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { StatisticsService } from '../../services/mysql/statistics.service';
import { createT } from './charts/tan';
import { createLR } from './charts/linearRegression';
import { CommonModule } from '@angular/common';
import { firstValueFrom,Subject, Observable } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { createAT } from './charts/allTan';
import { TranslateModule } from '@ngx-translate/core';
import * as Plotly from 'plotly.js-dist-min';
import { ProgressResponse } from './charts/common';

/**
 * A statisztika típusok enumja.
 */
enum StatisticType {
  Progress = 'p',
  Tan = 't',
  LinearRegression = 'lr',
  AllTan = 'at'
}

/**
 * @Component StatisticsComponent
 * @description
 * Megjeleníti a felhasználói statisztikákat, beleértve a haladást és különböző diagramokat.
 * Kezeli a nézetek közötti navigációt és a diagramok átméretezését.
 */
@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [TranslateModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule, CommonModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsComponent implements AfterViewInit, OnDestroy {

  /** Referencia a Plotly diagram konténer elemre. */
  @ViewChild('chartDiv') chartContainer!: ElementRef<HTMLDivElement>;

  private statisticsService = inject(StatisticsService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  /** @protected A felhasználó haladási adatai. */
  protected progressData: ProgressResponse|null = null;

  /** @protected Az aktuális nézet címének fordítási kulcsa. */
  protected title: string = "statistics.PROGRESS";

  private resizeSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  /** @private Az aktuálisan kiválasztott statisztika típusa. */
  private _statistics: StatisticType = StatisticType.Progress;

  /** @protected A választható statisztika típusok. */
  protected readonly statisticsTypes: StatisticType[] = [
    StatisticType.Progress,
    StatisticType.Tan,
    StatisticType.LinearRegression,
    StatisticType.AllTan
  ];

  /** Getter az aktuális statisztika típusához. */
  get statisctics(): StatisticType {
    return this._statistics;
  }

  /**
   * Setter az aktuális statisztika típusához. Változás esetén frissíti a nézetet.
   */
  set statisctics(value: StatisticType) {
     if (this._statistics !== value) {
        this._statistics = value;
        this.renderCurrentChart();
     }
  }

  /**
   * @LifecycleHook ngAfterViewInit
   * Első nézet renderelése és az átméretezés figyelő beállítása.
   */
  ngAfterViewInit(): void {
    this.renderCurrentChart();
    this.setupResizeListener();
  }

  /**
   * @LifecycleHook ngOnDestroy
   * Leiratkozások megszüntetése.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * @method renderCurrentChart
   * @description
   * Az aktuális statisztika típus alapján frissíti a címet és
   * meghívja a megfelelő adatlekérő/diagramrajzoló metódust.
   * Késlelteti a diagram rajzolást, ha a Progress nézetből váltunk,
   * hogy a diagram konténer létrejöhessen.
   */
  renderCurrentChart(): void {
    const targetStatistic = this._statistics; 
    if (targetStatistic !== StatisticType.Progress && this.chartContainer?.nativeElement) {
        Plotly.purge(this.chartContainer.nativeElement);
    }
    if (targetStatistic === StatisticType.Progress) {
        this.title = "statistics.PROGRESS";
        this.fetchAndSetProgress();
        this.cdr.markForCheck(); 
        return; 
    }
    setTimeout(() => {
        if (this._statistics === targetStatistic && this.chartContainer?.nativeElement) {
            switch (targetStatistic) {
                case StatisticType.Tan:
                    this.fetchAndRenderChart(this.statisticsService.studentTAN(), createT, "statistics.TAN");
                    break;
                case StatisticType.LinearRegression:
                    this.fetchAndRenderChart(this.statisticsService.studentLinearisRegression(), createLR, "statistics.LINEAR_REGRESSION");
                    break;
                case StatisticType.AllTan:
                    this.fetchAndRenderChart(this.statisticsService.allTAN(), createAT, "statistics.ALL_TAN");
                    break;
            }
        } else if (this._statistics === targetStatistic) {
            console.error('Chart container STILL not found after timeout!');
            this.title = "Hiba"; 
            if(this.chartContainer?.nativeElement) { 
               this.chartContainer.nativeElement.innerHTML = `<p style="text-align: center; padding: 20px;">Hiba a diagram konténer betöltésekor.</p>`;
            }
            this.cdr.markForCheck(); 
        }
    }, 0); 
  }

  /**
   * @private
   * @method fetchAndRenderChart
   * @description Általános metódus diagram adatok lekérésére és kirajzolására.
   */
  private async fetchAndRenderChart(
    dataObservable: Observable<any>,
    createChartFn: (targetElement: HTMLDivElement, response: any) => void,
    titleKey: string
  ): Promise<void> {
      this.title = titleKey;
      this.cdr.markForCheck(); 
      try {
          if (!this.chartContainer?.nativeElement) {
              console.error(`Chart container not found when trying to render ${titleKey}`);
              return; 
          }
          const targetElement = this.chartContainer.nativeElement; 
          const response = await firstValueFrom(dataObservable.pipe(takeUntil(this.destroy$)));
          createChartFn(targetElement, response);
      } catch (error) {
          console.error(`${titleKey} Hiba: `, error);
          if (this.chartContainer?.nativeElement) { 
             this.chartContainer.nativeElement.innerHTML = `<p style="text-align: center; padding: 20px;">Adatlekérési hiba.</p>`;
             this.cdr.markForCheck(); 
          }
      }
  }

  /**
   * @private
   * @method fetchAndSetProgress
   * @description Lekérdezi és beállítja a progress adatokat.
   */
  private async fetchAndSetProgress(): Promise<void> {
      try {
          const response = await firstValueFrom(this.statisticsService.progres().pipe(takeUntil(this.destroy$)));
          this.progressData = response as ProgressResponse;
      } catch (error) {
          console.error('Progress Hiba: ', error);
          this.progressData = null;
      } finally {
          this.cdr.markForCheck();
      }
  }

  /**
   * @method setupResizeListener
   * @description Beállítja az ablak átméretezés figyelését (debounced).
   */
  setupResizeListener(): void {
    this.resizeSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.ngZone.run(() => {
        if (this.chartContainer?.nativeElement && this._statistics !== StatisticType.Progress) {
          Plotly.Plots.resize(this.chartContainer.nativeElement);
        }
      });
    });
  }

  /** @HostListener Figyeli az ablak átméretezését. */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.resizeSubject.next();
  }

  /** @method Navigál az előző statisztikai nézetre. */
  navigatePrevious(): void {
    const currentIndex = this.statisticsTypes.indexOf(this._statistics);
    const previousIndex = (currentIndex - 1 + this.statisticsTypes.length) % this.statisticsTypes.length;
    this.statisctics = this.statisticsTypes[previousIndex];
  }

  /** @method Navigál a következő statisztikai nézetre. */
  navigateNext(): void {
    const currentIndex = this.statisticsTypes.indexOf(this._statistics);
    const nextIndex = (currentIndex + 1) % this.statisticsTypes.length;
    this.statisctics = this.statisticsTypes[nextIndex];
  }
}
