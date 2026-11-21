import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

interface FontCategoriesInterface {
  sans: string[];
  serif: string[];
  mono: string[];
  display: string[];
  special: string[];
  [key: string]: string[]; // Index signature to allow string indexing
}

@Component({
    selector: 'app-fonts',
    templateUrl: './fonts.component.html',
    styleUrls: ['./fonts.component.css'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-in', style({ opacity: 1 })),
            ]),
        ]),
        trigger('slideIn', [
            transition(':enter', [
                style({ transform: 'translateY(20px)', opacity: 0 }),
                animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
            ]),
        ]),
    ],
    standalone: false
})
export class FontsComponent implements OnInit, OnDestroy {
  private themeObserver?: MutationObserver;
  private hasCustomTextColor = false;
  private breakpointSubscription?: Subscription;
  
  inputText: string = '';
  showPlaceholder: boolean = true;
  copiedTimeout?: ReturnType<typeof setTimeout>;
  recentlyUsedFonts: string[] = [];
  isCopied: boolean = false;
  fontSize: number = 16;
  fontWeight: string = 'normal';
  fontStyle: string = 'normal';
  textColor: string = '#333333';
  isLargeScreen: boolean = false;
  currentCategory: string = 'all';
  currentYear: number = new Date().getFullYear();

  // Categorized fonts
  fontCategories: FontCategoriesInterface = {
    sans: ['Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Century Gothic', 'Microsoft Sans Serif', 
          'Segoe UI', 'Tahoma', 'Trebuchet MS', 'Verdana'],
    serif: ['Bookman Old Style', 'Cambria', 'Century', 'Garamond', 'Georgia', 'Lucida Bright', 
           'Palatino', 'Palatino Linotype', 'Times', 'Times New Roman'],
    mono: ['Consolas', 'Courier', 'Courier New', 'Lucida Console', 'Lucida Sans Typewriter', 'MS Gothic'],
    display: ['Arial Rounded MT Bold', 'Bradley Hand ITC', 'Comic Sans MS', 'Franklin Gothic Medium', 
             'Gabriola', 'Impact', 'Lucida Calligraphy', 'Lucida Handwriting', 'Monotype Corsiva', 
             'MV Boli', 'Segoe Print', 'Segoe Script'],
    special: ['Lucida Sans Unicode', 'MS Outlook', 'MS Reference Sans Serif', 'Segoe UI Historic', 
             'Segoe UI Symbol', 'Symbol', 'Wingdings', 'Zapf Dingbats']
  };

  // Combine all fonts for the "all" category
  fonts: string[] = [
    ...this.fontCategories.sans,
    ...this.fontCategories.serif, 
    ...this.fontCategories.mono,
    ...this.fontCategories.display,
    ...this.fontCategories.special
  ].sort();

  // Featured font combinations for inspiration
  fontCombinations = [
    { heading: 'Segoe UI', body: 'Georgia', name: 'Modern Classic' },
    { heading: 'Arial Black', body: 'Calibri', name: 'Corporate Bold' },
    { heading: 'Century Gothic', body: 'Palatino Linotype', name: 'Elegant Contrast' },
    { heading: 'Verdana', body: 'Bookman Old Style', name: 'Reading Comfort' }
  ];

  selectedFont: string = 'Arial';
  convertedText: string = '';
  
  constructor(
    private breakpointObserver: BreakpointObserver,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.updateDefaultTextColor();
    this.themeObserver = new MutationObserver(() => this.updateDefaultTextColor());
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    try {
      const storedFonts = localStorage.getItem('recentFonts');
      if (storedFonts) {
        const recentFonts: unknown = JSON.parse(storedFonts);
        if (Array.isArray(recentFonts)) {
          this.recentlyUsedFonts = recentFonts.filter(
            (font): font is string => typeof font === 'string' && this.fonts.includes(font),
          ).slice(0, 5);
        }
      }
    } catch (error) {
      console.warn('Recent fonts could not be loaded.', error);
    }
    
    this.breakpointSubscription = this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge
    ]).subscribe(result => {
      this.isLargeScreen = result.breakpoints[Breakpoints.Large] || 
                           result.breakpoints[Breakpoints.XLarge];
    });
    
    this.convertText();
  }

  ngOnDestroy(): void {
    this.themeObserver?.disconnect();
    this.breakpointSubscription?.unsubscribe();
    if (this.copiedTimeout) clearTimeout(this.copiedTimeout);
  }

  private updateDefaultTextColor(): void {
    if (this.hasCustomTextColor) {
      return;
    }

    this.textColor = document.documentElement.dataset['theme'] === 'dark'
      ? getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f3f4f6'
      : '#333333';
  }

  getCategoryName(category: string): string {
  const categoryNames: {[key: string]: string} = {
    'all': 'All Fonts',
    'recent': 'Recently Used',
    'sans': 'Sans-Serif',
    'serif': 'Serif',
    'mono': 'Monospace',
    'display': 'Display',
    'special': 'Special'
  };
  return categoryNames[category] || category;
}

get isDarkMode(): boolean {
  return document.documentElement.dataset['theme'] === 'dark';
}

  convertText() {
    this.convertedText = this.inputText;
    this.showPlaceholder = !this.inputText;
    
    if (this.selectedFont && !this.recentlyUsedFonts.includes(this.selectedFont)) {
      this.recentlyUsedFonts.unshift(this.selectedFont);
      if (this.recentlyUsedFonts.length > 5) {
        this.recentlyUsedFonts.pop();
      }
      try {
        localStorage.setItem('recentFonts', JSON.stringify(this.recentlyUsedFonts));
      } catch (error) {
        console.warn('Recent fonts could not be saved.', error);
      }
    }
  }

  async copyConvertedText(): Promise<void> {
    try {
      const clipboard = navigator.clipboard;
      if (!clipboard) throw new Error('Clipboard access is unavailable.');

      const styledText = document.createElement('span');
      styledText.textContent = this.convertedText;
      styledText.style.fontFamily = this.selectedFont;
      styledText.style.fontSize = `${this.fontSize}px`;
      styledText.style.fontWeight = this.fontWeight;
      styledText.style.fontStyle = this.fontStyle;
      styledText.style.color = this.textColor;

      let copiedWithStyle = false;
      if (typeof ClipboardItem !== 'undefined' && clipboard.write) {
        const html = new Blob([styledText.outerHTML], { type: 'text/html' });
        const text = new Blob([this.convertedText], { type: 'text/plain' });
        await clipboard.write([new ClipboardItem({ 'text/html': html, 'text/plain': text })]);
        copiedWithStyle = true;
      } else {
        await clipboard.writeText(this.convertedText);
      }

      this.isCopied = true;
      this.snackBar.open(copiedWithStyle ? 'Styled text copied to clipboard!' : 'Text copied without formatting.', 'Dismiss', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: this.isDarkMode ? 'dark-snackbar' : 'light-snackbar'
      });
      clearTimeout(this.copiedTimeout);
      this.copiedTimeout = setTimeout(() => {
        this.isCopied = false;
      }, 2000);

    } catch (error) {
      console.warn('Styled text could not be copied.', error);
      this.snackBar.open('Failed to copy styled text. Please try selecting and copying manually.', 'Dismiss', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  applyFontCombination(heading: string, body: string) {
    this.selectedFont = body;
    this.convertText();
  }

  setFontSize(size: number) {
    this.fontSize = size;
  }

  setFontWeight(weight: string) {
    this.fontWeight = weight;
  }

  setFontStyle(style: string) {
    this.fontStyle = style;
  }

  setTextColor(color: string) {
    this.textColor = color;
    this.hasCustomTextColor = true;
  }

  filterByCategory(category: string) {
    this.currentCategory = category;
  }

  get filteredFonts(): string[] {
    if (this.currentCategory === 'all') {
      return this.fonts;
    } else if (this.currentCategory === 'recent') {
      return this.recentlyUsedFonts;
    } else {
      return this.fontCategories[this.currentCategory] || [];
    }
  }
}
