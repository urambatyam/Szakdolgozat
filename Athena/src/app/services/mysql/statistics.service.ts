import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProgressResponse, LinearRegressionResponse, TANResponse } from '../../pages/statistics/charts/common'; 

/**
 * @Injectable StatisticsService
 * @description
 * Szolgáltatás a különböző statisztikai adatok lekérdezéséhez a backend API-ról.
 * Tartalmaz metódusokat kurzus-specifikus és hallgató-specifikus statisztikákhoz.
 */
@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  /**
   * Lekérdezi egy adott kurzushoz tartozó boxplot diagram adatait.
   * @param courseId - A kurzus azonosítója.
   * @returns Observable, amely a boxplot adatokat tartalmazza.
   */
  courseBoxplot(courseId: number): Observable<any>{ 
    return this.http.get<any>(
      environment.baseUrl+'/statisticCB/'+courseId,
      {headers: this.auth.getHeaders()}
    );
  }

  /**
   * Lekérdezi egy adott kurzus teljesítési arányának adatait.
   * @param courseId - A kurzus azonosítója.
   * @returns Observable, amely a teljesítési arány adatokat tartalmazza .
   */
  courseCompletionRate(courseId: number): Observable<any>{ 
    return this.http.get<any>(
      environment.baseUrl+'/statisticCCR/'+courseId,
      {headers: this.auth.getHeaders()}
    );
  }

  /**
   * Lekérdezi egy adott kurzus jegyeloszlási arányának adatait.
   * @param courseId - A kurzus azonosítója.
   * @returns Observable, amely a jegyeloszlási arány adatokat tartalmazza .
   */
  courseGradeRate(courseId: number): Observable<any>{ 
    return this.http.get<any>(
      environment.baseUrl+'/statisticCGR/'+courseId,
      {headers: this.auth.getHeaders()}
    );
  }

  /**
   * Lekérdezi egy adott kurzushoz tartozó lineáris regressziós adatokat.
   * @param courseId - A kurzus azonosítója.
   * @returns Observable, amely a lineáris regressziós adatokat tartalmazza .
   */
  courseLinearRegression(courseId: number): Observable<any>{ 
    return this.http.get<any>(
      environment.baseUrl+'/statisticCLR/'+courseId,
      {headers: this.auth.getHeaders()}
    );
  }

  /**
   * Lekérdezi egy adott kurzus jegyeinek eloszlási adatait.
   * @param courseId - A kurzus azonosítója.
   * @returns Observable, amely az eloszlási adatokat tartalmazza .
   */
  courseDistribution(courseId: number): Observable<any>{ 
    return this.http.get<any>(
      environment.baseUrl+'/statisticCD/'+courseId,
      {headers: this.auth.getHeaders()}
    );
  }

  /**
   * Lekérdezi a bejelentkezett hallgató teljesített kreditjeinek számát félévenként.
   * @returns Observable, amely a kredit adatokat tartalmazza.
   */
  studentCompletedCredits(): Observable<any>{ 
    return this.http.get<any>(
      environment.baseUrl+'/statisticTSCC',
      {headers: this.auth.getHeaders()}
    );
  }

  /**
   * Lekérdezi a bejelentkezett hallgató tanulmányi átlagaira vonatkozó lineáris regressziós adatokat.
   * @returns Observable<LinearRegressionResponse> - A lineáris regressziós adatokat tartalmazó Observable.
   */
  studentLinearisRegression(): Observable<LinearRegressionResponse>{
    return this.http.get<LinearRegressionResponse>(
      environment.baseUrl+'/statisticASLR',
      {headers: this.auth.getHeaders()}
    );
  }

  /**
   * Lekérdezi a bejelentkezett hallgató tanulmányi átlagának alakulását félévenként.
   * @returns Observable<TANResponse> - A TAN adatokat tartalmazó Observable.
   */
  studentTAN(): Observable<TANResponse>{
    return this.http.get<TANResponse>(
      environment.baseUrl+'/statisticAST',
      {headers: this.auth.getHeaders()}
    );
  }

  /**
   * Lekérdezi az összesített tanulmányi átlag  alakulását félévenként.
   * @returns Observable<TANResponse> - Az összesített TAN adatokat tartalmazó Observable.
   */
  allTAN(): Observable<TANResponse>{
    return this.http.get<TANResponse>(
      environment.baseUrl+'/statisticAT',
      {headers: this.auth.getHeaders()}
    );
  }

  /**
   * Lekérdezi a bejelentkezett hallgató haladási adatait.
   * @returns Observable<ProgressResponse> - A haladási adatokat tartalmazó Observable.
   */
  progres(): Observable<ProgressResponse>{
    return this.http.get<ProgressResponse>(
      environment.baseUrl+'/statisticSP',
      {headers: this.auth.getHeaders()}
    );
  }
}
