import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let originalTheme: string | undefined;

  beforeEach(() => {
    originalTheme = document.documentElement.dataset['theme'];
    localStorage.removeItem('toolbox-theme');
  });

  afterEach(() => {
    if (originalTheme === undefined) {
      delete document.documentElement.dataset['theme'];
    } else {
      document.documentElement.dataset['theme'] = originalTheme;
    }
    localStorage.removeItem('toolbox-theme');
  });

  it('emits theme changes for components with theme-dependent visuals', () => {
    const service = new ThemeService(document);
    const onThemeChange = vi.fn();
    const subscription = service.changes$.subscribe(onThemeChange);
    const nextTheme = service.isDark ? 'light' : 'dark';

    service.toggle();

    expect(service.theme).toBe(nextTheme);
    expect(onThemeChange).toHaveBeenCalledWith(nextTheme);
    subscription.unsubscribe();
  });
});
