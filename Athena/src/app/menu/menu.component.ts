import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../services/mysql/auth.service';
import { catchError, EMPTY, firstValueFrom, from, map, Subject, takeUntil, tap} from 'rxjs';
import { TranslateModule, TranslateService} from '@ngx-translate/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [ 
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatMenuModule,
    MatToolbarModule,
    MatSelectModule,
    TranslateModule 
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit, OnDestroy {
  ngOnDestroy(): void {
    this.menu$.complete();
  }
  private router = inject(Router);
  private auth = inject(AuthService);
  protected role: 'student'|'teacher'|'admin'|null = null; 
  private menu$ = new Subject<void>();
  protected selectedLang: string = 'hu';
  protected changeLang(event: MatSelectChange) {
    this.selectedLang = event.value;
    this.translate.use(event.value);
  }
  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang(this.selectedLang);
    this.translate.use(this.selectedLang); 
  }
  ngOnInit() {
    from(this.auth.user$).pipe(
      takeUntil(this.menu$),
      map(
        user => {
          this.role = user?.role ?? null;
        }
      ),
      tap(r => {console.log("role ",this.role)}),
      catchError(error => {
        console.error('Hiba: ', error);
        return EMPTY;
      })
    ).subscribe();
  }
  

  async logOut(){
    console.log("Sikeres kijelenkezés");
    await firstValueFrom(
      from(this.auth.logout())
    )
    this.router.navigateByUrl('login');
  } 
}


