import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, HostListener } from '@angular/core';
import { Inject } from '@angular/core';
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
  title = 'EverydayKit';
  isNavigating = false;

  constructor(
    private router: Router,
    destroyRef: DestroyRef,
    private toolPreferences: ToolPreferencesService,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {
    this.router.events.pipe(takeUntilDestroyed(destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isNavigating = true;
      }
      if (event instanceof NavigationEnd) {
        this.isNavigating = false;
        this.toolPreferences.recordVisit(event.urlAfterRedirects);
        if (event.urlAfterRedirects !== '/' && !event.urlAfterRedirects.startsWith('/country-explorer')) {
          this.loadToolTheme();
        }
        window.scrollTo(0, 0);
      }
      if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isNavigating = false;
      }
    });
  }

  private loadToolTheme(): void {
    if (this.document.getElementById('tool-material-theme')) return;

    const themeLink = this.document.createElement('link');
    themeLink.id = 'tool-material-theme';
    themeLink.rel = 'stylesheet';
    themeLink.href = new URL('assets/material/indigo-pink.css', this.document.baseURI).toString();
    themeLink.onerror = () => console.error('Unable to load the Material tool theme.');
    this.document.head.appendChild(themeLink);
  }

  @HostListener('window:keydown', ['$event'])
  async focusToolSearch(event: KeyboardEvent): Promise<void> {
    const isCommandK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    const isSlash = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (!isCommandK && !isSlash) return;

    const target = event.target;
    const isEditable = target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || (target instanceof HTMLElement && target.isContentEditable);
    if (isSlash && isEditable) return;

    if (this.router.url === '/' && this.document.querySelector('#tool-search')) return;

    event.preventDefault();
    if (this.router.url !== '/' && !await this.router.navigateByUrl('/')) return;
    this.document.querySelector<HTMLInputElement>('#tool-search')?.focus();
  }
}
