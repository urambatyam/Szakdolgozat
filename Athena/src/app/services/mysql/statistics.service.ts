import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  courseBoxplot(courseId: number): Observable<any>{
    return this.http.get<any>(
      environment.baseUrl+'/statisticCB/'+courseId,
      {headers: this.auth.getHeaders()}
    );
  }

  courseCompletionRate(courseId: number): Observable<any>{
    return this.http.get<any>(
      environment.baseUrl+'/statisticCCR/'+courseId,
      {headers: this.auth.getHeaders()}
    );
  }
  courseGradeRate(courseId: number): Observable<any>{
    return this.http.get<any>(
      environment.baseUrl+'/statisticCGR/'+courseId,
      {headers: this.auth.getHeaders()}
    );
  }
  courseLinearRegression(courseId: number): Observable<any>{
    return this.http.get<any>(
      environment.baseUrl+'/statisticCLR/'+courseId,
      {headers: this.auth.getHeaders()}
    );
  }
  courseDistribution(courseId: number): Observable<any>{
    return this.http.get<any>(
      environment.baseUrl+'/statisticCD/'+courseId,
      {headers: this.auth.getHeaders()}
    );
  }
  studentCompletedCredits(): Observable<any>{
    return this.http.get<any>(
      environment.baseUrl+'/statisticTSCC',
      {headers: this.auth.getHeaders()}
    );
  }
  studentLinearisRegression(): Observable<any>{
    return this.http.get<any>(
      environment.baseUrl+'/statisticASLR',
      {headers: this.auth.getHeaders()}
    );
  }
  studentTAN(): Observable<any>{
    return this.http.get<any>(
      environment.baseUrl+'/statisticAST',
      {headers: this.auth.getHeaders()}
    );
  }
  allTAN(): Observable<any>{
    return this.http.get<any>(
      environment.baseUrl+'/statisticAT',
      {headers: this.auth.getHeaders()}
    );
  }
  progres(): Observable<any>{
    return this.http.get<any>(
      environment.baseUrl+'/statisticSP',
      {headers: this.auth.getHeaders()}
    );
  }
}
