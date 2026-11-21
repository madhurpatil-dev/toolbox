import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => {
    if (environment.production && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/service-worker.js')
        .catch((error: unknown) => console.warn('Offline support could not be enabled.', error));
    }
  })
  .catch((error: unknown) => console.error('Application bootstrap failed.', error));
