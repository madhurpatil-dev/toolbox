import { ElementRef } from '@angular/core';
import { vi } from 'vitest';
import { ToolPreferencesService } from '../../services/tool-preferences.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let preferences: ToolPreferencesService;

  beforeEach(() => {
    localStorage.removeItem('toolbox-favorites');
    localStorage.removeItem('toolbox-recent-tools');
    preferences = new ToolPreferencesService(document);
  });

  it('filters tools by title and description', () => {
    const component = new HomeComponent(preferences);
    component.searchTerm = 'weather';

    expect(component.filteredServices.map((service) => service.route)).toEqual(['weather-service']);
  });

  it('focuses the search field with Ctrl/Cmd+K', () => {
    const component = new HomeComponent(preferences);
    const input = document.createElement('input');
    const focus = vi.spyOn(input, 'focus');
    component.toolSearch = new ElementRef(input);
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });

    component.handleSearchShortcut(event);

    expect(event.defaultPrevented).toBe(true);
    expect(focus).toHaveBeenCalledOnce();
  });

  it('filters tools by category', () => {
    const component = new HomeComponent(preferences);
    component.activeCategory = 'World';

    expect(component.filteredServices.map((service) => service.route)).toEqual([
      'findcapital',
      'findflag',
      'worldclock',
      'population',
      'weather-service',
    ]);

    component.activeCategory = 'All';
    component.searchTerm = 'creative';
    expect(component.filteredServices.map((service) => service.route)).toEqual([
      'colorpicker',
      'data-manipulation',
      'fontconverter',
    ]);
  });

  it('shows favorites and recent tools in their saved order', () => {
    const component = new HomeComponent(preferences);
    preferences.toggleFavorite('calculator');
    preferences.toggleFavorite('worldclock');
    preferences.recordVisit('/worldclock');
    preferences.recordVisit('/calculator');

    component.activeView = 'favorites';
    expect(component.filteredServices.map((service) => service.route)).toEqual(['worldclock', 'calculator']);

    component.activeView = 'recent';
    expect(component.filteredServices.map((service) => service.route)).toEqual(['calculator', 'worldclock']);
  });

  it('focuses search with slash without hijacking typing', () => {
    const component = new HomeComponent(preferences);
    const input = document.createElement('input');
    const focus = vi.spyOn(input, 'focus');
    component.toolSearch = new ElementRef(input);
    const shortcut = new KeyboardEvent('keydown', { key: '/', cancelable: true });

    component.handleSearchShortcut(shortcut);
    expect(shortcut.defaultPrevented).toBe(true);
    expect(focus).toHaveBeenCalledOnce();

    const typing = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    Object.defineProperty(typing, 'target', { value: document.createElement('input') });
    component.handleSearchShortcut(typing);
    expect(typing.defaultPrevented).toBe(false);
    expect(focus).toHaveBeenCalledOnce();
  });
});
