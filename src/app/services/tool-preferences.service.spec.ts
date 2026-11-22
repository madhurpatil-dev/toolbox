import { ToolPreferencesService } from './tool-preferences.service';

describe('ToolPreferencesService', () => {
  let preferences: ToolPreferencesService;

  beforeEach(() => {
    localStorage.removeItem('toolbox-favorites');
    localStorage.removeItem('toolbox-recent-tools');
    preferences = new ToolPreferencesService(document);
  });

  it('persists favorites and removes them when toggled again', () => {
    preferences.toggleFavorite('age-calculator');

    expect(preferences.isFavorite('age-calculator')).toBe(true);
    expect(localStorage.getItem('toolbox-favorites')).toBe('["age-calculator"]');

    preferences.toggleFavorite('age-calculator');
    expect(preferences.favoriteRoutes()).toEqual([]);
  });

  it('keeps unique recent tools in newest-first order and limits the list', () => {
    for (const route of ['age-calculator', 'worldclock', 'country-explorer', 'weather-service', 'image-studio', 'colorpicker']) {
      preferences.recordVisit(`/${route}?from=home`);
    }
    preferences.recordVisit('/weather-service');

    expect(preferences.recentRoutes()).toEqual([
      'weather-service',
      'colorpicker',
      'image-studio',
      'country-explorer',
      'worldclock',
    ]);
    expect(JSON.parse(localStorage.getItem('toolbox-recent-tools') ?? '[]')).toEqual(preferences.recentRoutes());
  });

  it('ignores the home route and can clear recent tools', () => {
    preferences.recordVisit('/');
    preferences.recordVisit('/age-calculator');
    preferences.clearRecentTools();

    expect(preferences.recentRoutes()).toEqual([]);
    expect(localStorage.getItem('toolbox-recent-tools')).toBe('[]');
  });

  it('migrates saved country tool favorites and history to Country Explorer', () => {
    localStorage.setItem('toolbox-favorites', '["findcapital","population","findflag"]');
    localStorage.setItem('toolbox-recent-tools', '["findflag","findcapital","population"]');
    const migrated = new ToolPreferencesService(document);

    expect(migrated.favoriteRoutes()).toEqual(['country-explorer']);
    expect(migrated.recentRoutes()).toEqual(['country-explorer']);
  });
});
