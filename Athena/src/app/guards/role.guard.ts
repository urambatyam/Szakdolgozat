import { inject } from '@angular/core';
import { catchError, switchMap, of, Observable } from 'rxjs';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/mysql/auth.service';
/**
 * Ellenőrzi, hogy a bejelentkezett felhasználónak van-e megfelelő szerepköre
 * az adott útvonal eléréséhez.
 * Ha a felhasználó nincs bejelentkezve, vagy nincs megfelelő szerepköre,
 * átirányítja a '/login' útvonalra.
 *
 * @param route Az aktiválni kívánt útvonal. Tartalmazza a `data['roles']` tömböt.
 * @param state Az útválasztó állapota.
 * @returns Observable<boolean | UrlTree> `true`, ha a felhasználó hozzáférhet az útvonalhoz, egyébként egy `UrlTree`, ami a '/login' oldalra irányít.
 */
export const roleGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as string[];

  return auth.checkAuthentication().pipe(
    switchMap(user => {
      if (!user) {
        return of(router.createUrlTree(['/login']));
      }
      const hasRole = expectedRoles.includes(user.role);
      return of(hasRole || router.createUrlTree(['/login']));
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
