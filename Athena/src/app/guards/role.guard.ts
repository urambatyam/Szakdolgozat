// src/app/guards/role.guard.ts
import { inject } from '@angular/core';
import { map, catchError, switchMap, of, Observable } from 'rxjs';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/mysql/auth.service';

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
