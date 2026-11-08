import { Component, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { ToolPreferencesService } from './services/tool-preferences.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    standalone: false
})
export class AppComponent {
  title = 'toolsproject';
  isNavigating = false;

  constructor(
    private router: Router,
    destroyRef: DestroyRef,
    private toolPreferences: ToolPreferencesService,
  ) {
    this.router.events.pipe(takeUntilDestroyed(destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isNavigating = true;
      }
      if (event instanceof NavigationEnd) {
        this.isNavigating = false;
        this.toolPreferences.recordVisit(event.urlAfterRedirects);
        window.scrollTo(0, 0);
      }
      if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isNavigating = false;
      }
    });
  }
}
