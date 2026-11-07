import { ElementRef } from '@angular/core';
import { vi } from 'vitest';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  it('filters tools by title and description', () => {
    const component = new HomeComponent();
    component.searchTerm = 'weather';

    expect(component.filteredServices.map((service) => service.route)).toEqual(['weather-service']);
  });

  it('focuses the search field with Ctrl/Cmd+K', () => {
    const component = new HomeComponent();
    const input = document.createElement('input');
    const focus = vi.spyOn(input, 'focus');
    component.toolSearch = new ElementRef(input);
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });

    component.handleSearchShortcut(event);

    expect(event.defaultPrevented).toBe(true);
    expect(focus).toHaveBeenCalledOnce();
  });
});
