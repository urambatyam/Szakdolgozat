import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {getAuth, provideAuth} from '@angular/fire/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB2hPf2Mki4FwUWZgeKYq6pTnQgqoKO3yA",
  authDomain: "athena-thesis.firebaseapp.com",
  projectId: "athena-thesis",
  storageBucket: "athena-thesis.firebasestorage.app",
  messagingSenderId: "546843154137",
  appId: "1:546843154137:web:dde338be1c7c2e5adc10c8",
  measurementId: "G-RXH43VCG4Z"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth())
  ]
};
