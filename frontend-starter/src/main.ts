import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withInterceptors, withXhr } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { AppComponent } from './app/components/app/app';
import { routes } from './app/routes';
import { authInterceptor } from './app/shared/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // withXhr() : le backend fetch (par défaut dans Angular 22) ne sait pas rapporter la progression d'un upload.
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
  ],
}).catch(console.error);
