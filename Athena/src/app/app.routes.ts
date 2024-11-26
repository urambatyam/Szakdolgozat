import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistrationComponent } from './pages/registration/registration.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ElectronicControllerComponent } from './pages/electronic-controller/electronic-controller.component';
import { CurriculumComponent } from './pages/curriculum/curriculum.component';
import { CurriculumDeveloperComponent } from './pages/curriculum-developer/curriculum-developer.component';
import { CourseForumComponent } from './pages/course-forum/course-forum.component';

export const routes: Routes = [
    {
        path: 'registration',
        loadComponent: () =>
          import('./pages/registration/registration.component').then(
            (c) => c.RegistrationComponent
          ),
    },
    {
        path: 'profile',
        loadComponent: () =>
            import('./pages/profile/profile.component').then(
              (c) => c.ProfileComponent
            )
    },
    {
        path: 'electronic-controller',
        loadComponent: () =>
            import('./pages/electronic-controller/electronic-controller.component').then(
              (c) => c.ElectronicControllerComponent
            )
    },
    {
        path: 'curriculum',
        loadComponent: () =>
            import('./pages/curriculum/curriculum.component').then(
              (c) => c.CurriculumComponent
            )
    },
    {
        path: 'curriculum-developer',
        loadComponent: () =>
            import('./pages/curriculum-developer/curriculum-developer.component').then(
              (c) => c.CurriculumDeveloperComponent
            )
    },
    {
        path: 'course-forum',
        loadComponent: () =>
            import('./pages/course-forum/course-forum.component').then(
              (c) => c.CourseForumComponent
            )
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