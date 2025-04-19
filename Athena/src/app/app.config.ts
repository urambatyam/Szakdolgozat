import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { HttpClient} from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

/**
 * Létrehoz egy TranslateLoader-t, amely a fordítási fájlokat
 * a megadott útvonalról (`./assets/i18n/`) tölti be HTTP kéréssel.
 * @param http HttpClient instance a kérések végrehajtásához.
 * @returns TranslateHttpLoader instance.
 */
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

/**
 * Az alkalmazás központi konfigurációs objektuma.
 * Beállítja a routingot, a HTTP klienst, az animációkat,
 * a zónakezelést és a fordítási szolgáltatást.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
};
