import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private LoggedUser = new BehaviorSubject<User | null>(null);
  public user$ = this.LoggedUser.asObservable();

  public login(email:string, password:string): Observable<any>{
    return this.http.post<any>(
      environment.baseUrl+'/login',
      {email,password},)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.LoggedUser.next(response.user);
        })
      );
  }

  public logout(){
    const headers = this.getHeaders();
    return this.http.post<any>(
      environment.baseUrl+'/logout',
      {},
      {headers})
      .pipe(
        tap(()=>{
          localStorage.removeItem('token');
          this.LoggedUser.next(null);
        })
      );
  }

  public register(newUser:User): Observable<any>{
    const headers = this.getHeaders();
    return this.http.post<any>(
      environment.baseUrl+'/register',
      newUser,
      {headers}).pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.LoggedUser.next(response.user);
        })
      );
  }

  public checkAuthentication(): Observable<User | null> {
    const headers = this.getHeaders();
    return this.http.post<User | null>(
      environment.baseUrl+`/role`,
      {},
      {headers}
    ).pipe(
      tap(user => {
        this.LoggedUser.next(user);
      }),
      catchError(() => {
        this.LoggedUser.next(null);
        return of(null);
      })
    );
  }

  public getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
    
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}
