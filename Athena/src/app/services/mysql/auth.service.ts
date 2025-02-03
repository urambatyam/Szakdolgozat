import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private tokenSecret = 'titok';
  private LoggedUser = new BehaviorSubject<User | null>(null);

  user$ = this.LoggedUser.asObservable();

  constructor(){
    const token = localStorage.getItem(this.tokenSecret);
    if(token){
      this.getUser();
    }
  }

  login(email:string, password:string): Observable<any>{
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

  logout(){
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
  register(newUser:User): Observable<any>{
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

  private getUser(){
    const headers = this.getHeaders();
    this.http.get<User>(
      environment.baseUrl+'/user',
      {headers}).subscribe({
        next: (user) => this.LoggedUser.next(user),
        error: () => {
          localStorage.removeItem('token');
          this.LoggedUser.next(null);
        }
      });
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
