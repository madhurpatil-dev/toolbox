import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, signal } from '@angular/core';

const FAVORITES_KEY = 'toolbox-favorites';
const RECENT_TOOLS_KEY = 'toolbox-recent-tools';
const RECENT_TOOLS_LIMIT = 5;

@Injectable({ providedIn: 'root' })
export class ToolPreferencesService {
  readonly favoriteRoutes = signal(this.readRoutes(FAVORITES_KEY));
  readonly recentRoutes = signal(this.readRoutes(RECENT_TOOLS_KEY).slice(0, RECENT_TOOLS_LIMIT));

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  isFavorite(route: string): boolean {
    return this.favoriteRoutes().includes(route);
  }

  toggleFavorite(route: string): void {
    const favorites = this.isFavorite(route)
      ? this.favoriteRoutes().filter((favorite) => favorite !== route)
      : [route, ...this.favoriteRoutes()];

    this.favoriteRoutes.set(favorites);
    this.saveRoutes(FAVORITES_KEY, favorites);
  }

  recordVisit(url: string): void {
    const route = url.split(/[/?#]/).filter(Boolean)[0];
    if (!route) return;

    const recentRoutes = [
      route,
      ...this.recentRoutes().filter((recentRoute) => recentRoute !== route),
    ].slice(0, RECENT_TOOLS_LIMIT);

    this.recentRoutes.set(recentRoutes);
    this.saveRoutes(RECENT_TOOLS_KEY, recentRoutes);
  }

  clearRecentTools(): void {
    this.recentRoutes.set([]);
    this.saveRoutes(RECENT_TOOLS_KEY, []);
  }

  private readRoutes(key: string): string[] {
    try {
      const saved = this.document.defaultView?.localStorage.getItem(key);
      if (!saved) return [];

      const routes: unknown = JSON.parse(saved);
      if (!Array.isArray(routes) || !routes.every((route: unknown) => typeof route === 'string')) {
        console.warn(`Ignoring invalid saved tool preferences for "${key}".`);
        return [];
      }

      const stringRoutes = routes.filter((route: unknown): route is string => typeof route === 'string');
      return [...new Set(stringRoutes)];
    } catch (error) {
      console.warn(`Unable to read saved tool preferences for "${key}".`, error);
      return [];
    }
  }

  private saveRoutes(key: string, routes: string[]): void {
    try {
      this.document.defaultView?.localStorage.setItem(key, JSON.stringify(routes));
    } catch (error) {
      console.warn(`Unable to save tool preferences for "${key}".`, error);
    }
  }
}
