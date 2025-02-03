import { inject } from '@angular/core';
import { map, catchError } from 'rxjs/operators';
import { CanActivateFn, Router, UrlTree  } from '@angular/router';
import { AuthService } from '../services/mysql/auth.service';
import { Observable, of } from 'rxjs';


export const roleGuard: CanActivateFn = (route, state):Observable<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as string[];

  return auth.user$.pipe(
    map(user => {
      if (!user) {
        return router.createUrlTree(['/login']);
      }
      const hasRole = expectedRoles.includes(user.role);
      return hasRole || router.createUrlTree(['/login']);
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  )
};
