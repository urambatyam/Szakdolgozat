import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../services/mysql/auth.service';
import { catchError, EMPTY, filter, firstValueFrom, from, map, Observable, of, shareReplay, Subject, takeUntil} from 'rxjs';
import { TranslateModule, TranslateService} from '@ngx-translate/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
/**
 * Ez a menü itt lehet navigálni és nyelvet állitani
 */
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [ 
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatMenuModule,
    MatToolbarModule,
    MatSelectModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    TranslateModule,
    RouterOutlet 
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit, OnDestroy {
  
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private auth = inject(AuthService);
  private translate =  inject(TranslateService);
  /** Referencia az oldalsó menüre. */
  @ViewChild('drawer') drawer!: MatSidenav;
  /**
   * `Observable`, amely `true` értéket ad, ha a képernyő megfelel a 'Handset' (mobil) töréspontnak.
   * A `shareReplay` biztosítja, hogy a legutóbbi érték elérhető legyen új feliratkozók számára is.
   */
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
  .pipe(
    map(result => result.matches),
    shareReplay()
  );
  /** Egy `Subject` amit arra használok hogy menu kompones megsemisülése kor leiratkozn a `isHandset`-ről*/
  private menuDestroy$ = new Subject<void>();
  /** A bejelentkezett felhasználó szerepköre ('student', 'teacher', 'admin') vagy `null`, ha nincs bejelentkezve. */
  protected role: 'student'|'teacher'|'admin'|null = null; 
  /** Az aktuálisan kiválasztott nyelv kódja ('hu', 'en'). */
  protected selectedLang: string = 'hu';
  /**
   * Inicializálja a komponenst: beállítja az alapértelmezett nyelvet,
   * lekéri a felhasználói szerepkört, és elindítja a képernyőméret figyelését.
   */
  async ngOnInit() {
    this.translate.setDefaultLang(this.selectedLang);
    this.translate.use(this.selectedLang); 
        
    from(this.auth.user$).pipe(
      takeUntil(this.menuDestroy$),
        map(
          user => {
            this.role = user?.role ?? null;
          }
        ),
        catchError(error => {
          console.error('Hiba: ', error);
          return of({ role: null })
        })
    ).subscribe();
    
    this.isHandset$
    .pipe(
      filter(isHandset => !isHandset), 
      takeUntil(this.menuDestroy$)
    )
    .subscribe(() => {
      if (this.drawer && this.drawer.opened) {
        this.drawer.close();
      }
    });
  }
  /**
   * Kezeli a nyelvváltást a `mat-select` értékváltozása alapján.
   * Frissíti a `selectedLang` tulajdonságot és beállítja az alkalmazás nyelvét.
   * @param event A MatSelectChange esemény objektuma, amely tartalmazza az új értéket.
   */
  protected changeLang(event: MatSelectChange) {
    this.selectedLang = event.value;
    this.translate.use(event.value);
  }

  /**
   * Bezárja az oldalsó menüt.
   */
  protected closeSidenav() {
    if (this.drawer) {
      this.drawer.close();
    }
  }
  /**
   * Kijelentkezteti a felhasználót,
   * majd átirányítja a bejelentkezési oldalra.
   * Bezárja az oldalsó menüt, ha nyitva volt.
   */
  protected async logOut(){
    await firstValueFrom(
      from(this.auth.logout()).pipe(
        catchError(error => {
          console.error('Hiba: ', error);
          return EMPTY;
        })
      )
    )
    this.router.navigateByUrl('login');
    this.closeSidenav();
  } 
  /**
   * A komponens megsemmisülésekor lefutó életciklus metódus.
   * Lezárja az aktív RxJS feliratkozásokat a `menuDestroy$` Subject segítségével,
   * megelőzve a memóriaszivárgást.
   */
  ngOnDestroy(): void {
    this.menuDestroy$.next();
    this.menuDestroy$.complete();
  }
}


