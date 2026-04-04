import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';

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
export class FontsComponent implements OnInit, AfterViewInit {
  @ViewChild('previewArea') previewArea!: ElementRef;
  @ViewChild('previewText') previewTextElement!: ElementRef;
  
  inputText: string = '';
  showPlaceholder: boolean = true;
  copiedTimeout: any;
  recentlyUsedFonts: string[] = [];
  isCopied: boolean = false;
  fontSize: number = 16;
  fontWeight: string = 'normal';
  fontStyle: string = 'normal';
  textColor: string = '#333333';
  isDarkMode: boolean = false;
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
    const storedFonts = localStorage.getItem('recentFonts');
    if (storedFonts) {
      this.recentlyUsedFonts = JSON.parse(storedFonts);
    }
    
    this.breakpointObserver.observe([
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

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.previewArea) {
        this.previewArea.nativeElement.focus();
      }
    }, 500);
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

  convertText() {
    this.convertedText = this.inputText;
    this.showPlaceholder = !this.inputText;
    
    if (this.selectedFont && !this.recentlyUsedFonts.includes(this.selectedFont)) {
      this.recentlyUsedFonts.unshift(this.selectedFont);
      if (this.recentlyUsedFonts.length > 5) {
        this.recentlyUsedFonts.pop();
      }
      localStorage.setItem('recentFonts', JSON.stringify(this.recentlyUsedFonts));
    }
  }

  copyConvertedText() {
    try {
      // Get the preview text element
      const previewElement = this.previewTextElement.nativeElement;
      
      // Create a range and select the text
      const range = document.createRange();
      range.selectNode(previewElement);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      
      // Execute the copy command
      document.execCommand('copy');
      
      // Clear the selection
      window.getSelection()?.removeAllRanges();
      
      // Show success message
      this.isCopied = true;
      this.snackBar.open('Styled text copied to clipboard!', 'Dismiss', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: this.isDarkMode ? 'dark-snackbar' : 'light-snackbar'
      });
      
      // Reset the copy button after a delay
      clearTimeout(this.copiedTimeout);
      this.copiedTimeout = setTimeout(() => {
        this.isCopied = false;
      }, 2000);
      
    } catch (err) {
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
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
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