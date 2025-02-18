import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { Course } from './models/course';

export const routes: Routes = [
    {
        path: 'registration',
        loadComponent: () =>
          import('./pages/registration/registration.component').then(
            (c) => c.RegistrationComponent
          ),
        canActivate: [roleGuard],
        data: { roles: ['admin'] }
    },
    {
        path: 'profile',
        loadComponent: () =>
            import('./pages/profile/profile.component').then(
              (c) => c.ProfileComponent
            ),
        canActivate: [roleGuard],
        data: { roles: ['admin','student','teacher'] }
    },
    {
        path: 'electronic-controller',
        loadComponent: () =>
            import('./pages/electronic-controller/electronic-controller.component').then(
              (c) => c.ElectronicControllerComponent
            ),
        canActivate: [roleGuard],
        data: { roles: ['admin','student','teacher'] }
    },
    {
        path: 'curriculum',
        loadComponent: () =>
            import('./pages/curriculum/curriculum.component').then(
              (c) => c.CurriculumComponent
            ),
        canActivate: [roleGuard],
        data: { roles: ['admin','student','teacher'] }
    },
    {
        path: 'curriculum-developer',
        loadComponent: () =>
            import('./pages/curriculum-developer/curriculum-developer.component').then(
              (c) => c.CurriculumDeveloperComponent
            ),
        canActivate: [roleGuard],
        data: { roles: ['admin','teacher'] }
    },
    {
        path: 'course-forum',
        loadComponent: () =>
            import('./pages/course-forum/course-forum.component').then(
              (c) => c.CourseForumComponent
            ),
        canActivate: [roleGuard],
        data: { roles: ['admin','student','teacher'] }
    },
    {
      path: 'forum',
      loadComponent: () =>
          import('./pages/course-forum/forum/forum.component').then(
            (c) => c.ForumComponent
          ),
      canActivate: [roleGuard],
      data: { roles: ['admin','student','teacher'] }
  },
    {
        path: 'login',
        loadComponent: () =>
            import('./pages/login/login.component').then(
              (c) => c.LoginComponent
            )
    },
    {path: '**', redirectTo: 'login'},
];
//https://www.youtube.com/watch?v=dT3f0KTdNyA