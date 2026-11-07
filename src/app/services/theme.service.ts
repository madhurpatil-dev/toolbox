import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private currentTheme: AppTheme;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.currentTheme = this.readPreference();
    this.applyTheme();
  }

  get theme(): AppTheme {
    return this.currentTheme;
  }

  get isDark(): boolean {
    return this.currentTheme === 'dark';
  }

  toggle(): void {
    this.currentTheme = this.isDark ? 'light' : 'dark';
    this.applyTheme();
  }

  private readPreference(): AppTheme {
    try {
      return this.document.defaultView?.localStorage.getItem('toolbox-theme') === 'dark'
        ? 'dark'
        : 'light';
    } catch (error) {
      console.warn('Unable to read the saved theme preference.', error);
      return 'light';
    }
  }

  private applyTheme(): void {
    this.document.documentElement.dataset['theme'] = this.currentTheme;
    this.document.documentElement.style.colorScheme = this.currentTheme;

    try {
      this.document.defaultView?.localStorage.setItem('toolbox-theme', this.currentTheme);
    } catch (error) {
      console.warn('Unable to save the theme preference.', error);
    }
  }
}
