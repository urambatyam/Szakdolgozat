import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap ,throwError} from 'rxjs';
/**
 * Az autentikációs service (bejelentkezés,regisztráció,kijelentkezés,header, bejelentkezés ellnörzése)
 * 
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private LoggedUser = new BehaviorSubject<User | null>(null);
  public user$ = this.LoggedUser.asObservable();
  /**
   * Bejelentkezés
   * @param code Athéna kód
   * @param password jelszó
   * @return Observable<any>
   */
  public login(code:string, password:string): Observable<any>{
    return this.http.post<any>(
      environment.baseUrl+'/login',
      {code,password},)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          this.LoggedUser.next(response.user);
        })
      );
  }
  /**
   * Kijelentkezés
   * @return Observable<void>
   */
  public logout():Observable<void>{
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
  /**
   * Regisztráció 
   * @param newUser új felhasználó
   * @return Observable<any>
   */
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
  /**
   * Frisiti a lekért `LoggedUser` felhasználó adtokat
   * @returns Observable<User | null> felhasználó
   */
  public checkAuthentication(): Observable<User | null> {
    const headers = this.getHeaders();
    if (!headers.has('Authorization')) {
        this.LoggedUser.next(null);
        return of(null);
    }
    return this.http.post<User | null>(
      environment.baseUrl + `/role`,
      {},
      { headers }
    ).pipe(
      tap(user => {
        console.log('checkAuthentication successful, user:', user);
        this.LoggedUser.next(user); 
      }),
      catchError((error) => {
        console.error('checkAuthentication failed:', error);
        localStorage.removeItem('token'); 
        this.LoggedUser.next(null);
        return of(null); 
      })
    );
  }
  /**
   * A http kérések header-jének inicializálása
   * @return HttpHeaders
   */
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
  /**
   * Jelszó megváltoztatása 
   * @param code Athena kód
   * @param currentPassword jellenlegi jelszó
   * @param newPassword új jelszó
   * @return Observable<any>
   */
  updatePassword(code: string, currentPassword: string, newPassword: string): Observable<User | null> { 
    const headers = this.getHeaders();
    return this.http.put<any>( 
      environment.baseUrl + '/changePassword',
      { code, currentPassword, newPassword },
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error updating password:', error);
        return throwError(() => new Error('Jelszó frissítése sikertelen.')); 
      })
    );
  }
  /**
   * Email cím megváltoztatása
   * @param code Athena kód
   * @param password jelszó
   * @param newEmail új email
   * @return Observable<any>
   */
  updateEmail(code: string, password: string, newEmail: string): Observable<User | null> { 
    const headers = this.getHeaders();
    return this.http.put<any>( 
      environment.baseUrl + '/changeEmail',
      { code, password, newEmail },
      { headers }
    ).pipe(
      switchMap(() => {
        console.log('Email change successful, calling checkAuthentication...');
        return this.checkAuthentication(); 
      }),
      catchError(error => {
        console.error('Error updating email:', error);
        return throwError(() => new Error('Email cím frissítése sikertelen.')); 
      })
    );
  }
}
