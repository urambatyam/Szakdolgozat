import { CanActivateFn } from '@angular/router';
import { UsersService } from '../services/users.service';
import { inject } from '@angular/core';
import { map, switchMap, take, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';


export const roleGuard: CanActivateFn = (route, state) => {
  const usersService = inject(UsersService);
  const auth = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as string[];

  // A bejelentkezett felhasználó azonosítójának lekérése 
  // (ezt a valós alkalmazásban pl. AuthService-ből kaphatjuk)
  const userId = 'current-user-id'; 

  return auth.isLoggedIn().pipe(
    take(1),
    switchMap(user => {
      if (!user) {
        // Ha nincs bejelentkezve, átirányítás a login oldalra
        router.navigate(['/login']);
        return of(false);
      }

      // Ha be van jelentkezve, lekérjük a felhasználó adatait
      return usersService.getById(user.uid).pipe(
        take(1),
        map(userData => {
          if (!userData) {
            // Ha nem találjuk a felhasználót a Firestoreban
            router.navigate(['/login']);
            return false;
          }

          // Ellenőrizzük a szerepkört
          const hasRole = expectedRoles.includes(userData.rang);

          if (!hasRole) {
            // Ha nincs meg a megfelelő szerepkör, átirányítjuk
            router.navigate(['/login']);
            return false;
          }

          return true;
        }),
        catchError(() => {
          // Hiba esetén átirányítás
          router.navigate(['/login']);
          return of(false);
        })
      );
    }),
    catchError(() => {
      // Egyéb hiba esetén átirányítás
      router.navigate(['/login']);
      return of(false);
    })
  );
};
