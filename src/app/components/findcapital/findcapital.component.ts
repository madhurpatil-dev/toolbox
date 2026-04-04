import { Component, OnInit } from '@angular/core';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { FindCapitalService } from '../../services/find-capital.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { trigger, transition, style, animate, state, query, stagger } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-findcapital',
    templateUrl: './findcapital.component.html',
    styleUrls: ['./findcapital.component.css'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ]),
        trigger('staggerIn', [
            transition('* => *', [
                query(':enter', [
                    style({ opacity: 0, transform: 'translateY(10px)' }),
                    stagger('100ms', [
                        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
                    ])
                ], { optional: true })
            ])
        ]),
        trigger('pulse', [
            state('active', style({ transform: 'scale(1.05)' })),
            state('inactive', style({ transform: 'scale(1)' })),
            transition('inactive => active', animate('300ms ease-in')),
            transition('active => inactive', animate('300ms ease-out'))
        ]),
        trigger('rotate', [
            state('active', style({ transform: 'rotate(360deg)' })),
            state('inactive', style({ transform: 'rotate(0deg)' })),
            transition('inactive => active', animate('1000ms linear')),
            transition('active => inactive', animate('0ms'))
        ])
    ],
    standalone: false
})
export class FindcapitalComponent implements OnInit {
  selectedCountry: string = '';
  capital: string = '';
  error: string = '';
  countryNames: string[] = [];
  isLargeScreen: boolean = false;
  isLoading: boolean = true;
  isSearching: boolean = false;
  showResults: boolean = false;
  pulseState: string = 'inactive';
  recentSearches: {country: string, capital: string, flag: string}[] = [];
  countryFlag: string = '';
  countryInfo: any = null;
  themeMode: 'light' | 'dark' = 'light';
  currentYear: number = new Date().getFullYear();
  rotateState: string = 'inactive';
  searchInputFocused: boolean = false;
  
  protected searchTerm$ = new Subject<string>();

  constructor(
    private findCapitalService: FindCapitalService, 
    private breakpointObserver: BreakpointObserver,
    private snackBar: MatSnackBar
  ) { 
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.themeMode = prefersDark ? 'dark' : 'light';
    this.applyTheme();
  }

  ngOnInit(): void {
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

    this.setupSearchPipeline();
    this.fetchCountryNames();
    this.loadRecentSearches();
  }

  private setupSearchPipeline(): void {
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => {
        if (!term) return of(null);
        
        this.isSearching = true;
        this.pulseState = 'active';
        this.rotateState = 'active';
        return this.findCapitalService.findCapital(term).pipe(
          catchError(error => {
            this.handleFetchError(error);
            return of(null);
          })
        );
      })
    ).subscribe(
      (data) => {
        if (data) {
          this.handleCountryData(data);
        }
        this.isSearching = false;
        this.pulseState = 'inactive';
        this.rotateState = 'inactive';
        this.showResults = true;
      }
    );
  }

  private applyTheme(): void {
    if (this.themeMode === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  fetchCountryNames(): void {
    this.isLoading = true;
    this.findCapitalService.fetchCountryNames().subscribe(
      (data: any[]) => {
        this.countryNames = data.map(country => country.name.common).sort();
        this.isLoading = false;
      },
      (error) => {
        this.handleFetchError(error);
        this.isLoading = false;
      }
    );
  }

  onCountrySelected(): void {
    if (this.selectedCountry) {
      this.searchTerm$.next(this.selectedCountry);
    }
  }

  private handleCountryData(data: any): void {
    if (!data || data.status === 404) {
      this.handleNoCountryFound();
      return;
    }

    try {
      const countryData = Array.isArray(data) ? data[0] : data;
      
      if (!countryData || !countryData.name) {
        this.handleNoCountryFound();
        return;
      }

      this.countryInfo = countryData;
      this.countryFlag = countryData.flags?.svg || countryData.flags?.png || '';
      
      // Handle capital information
      if (this.selectedCountry.toLowerCase() === 'india') {
        this.capital = 'New Delhi';
      } else if (countryData.capital) {
        this.capital = Array.isArray(countryData.capital) 
          ? countryData.capital[0] 
          : countryData.capital;
      } else {
        this.capital = 'Capital information not available';
      }
      
      this.error = '';
      this.addToRecentSearches();
      
      this.snackBar.open(`Found capital for ${this.selectedCountry}!`, 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      this.handleFetchError(error);
    }
  }

  private handleNoCountryFound(): void {
    this.capital = '';
    this.countryFlag = '';
    this.countryInfo = null;
    this.error = 'Country information not available for the specified name.';
    
    this.snackBar.open(this.error, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  private handleFetchError(error: any): void {
    console.error('API Error:', error);
    this.capital = '';
    this.countryFlag = '';
    this.countryInfo = null;
    this.error = 'Error fetching data from the API. Please try again later.';
    this.isLoading = false;
    this.isSearching = false;
    
    this.snackBar.open(this.error, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private addToRecentSearches(): void {
    if (!this.selectedCountry || !this.capital) return;

    const existingIndex = this.recentSearches.findIndex(item => 
      item.country.toLowerCase() === this.selectedCountry.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      this.recentSearches.splice(existingIndex, 1);
    }
    
    this.recentSearches.unshift({
      country: this.selectedCountry,
      capital: this.capital,
      flag: this.countryFlag
    });
    
    if (this.recentSearches.length > 5) {
      this.recentSearches = this.recentSearches.slice(0, 5);
    }
    
    localStorage.setItem('recentCapitalSearches', JSON.stringify(this.recentSearches));
  }
  
  private loadRecentSearches(): void {
    const saved = localStorage.getItem('recentCapitalSearches');
    if (saved) {
      try {
        this.recentSearches = JSON.parse(saved);
      } catch (e) {
        this.recentSearches = [];
      }
    }
  }
  
  setCountry(country: string): void {
    this.selectedCountry = country;
    this.onCountrySelected();
  }
  
  toggleTheme(): void {
    this.themeMode = this.themeMode === 'light' ? 'dark' : 'light';
    this.applyTheme();
  }
  
  getFormattedPopulation(): string {
    if (!this.countryInfo?.population) return 'Unknown';
    return new Intl.NumberFormat().format(this.countryInfo.population);
  }
  
  getCurrencies(): string {
    if (!this.countryInfo?.currencies) return 'Unknown';
    
    return Object.values(this.countryInfo.currencies)
      .map((curr: any) => `${curr.name} (${curr.symbol || '—'})`)
      .join(', ');
  }
  
 getLanguages(): string {
  if (!this.countryInfo?.languages) return 'Unknown';

  const langs = this.countryInfo.languages;

  // If it's an array of objects like [{name: 'Pashto'}, {name: 'Dari'}]
  if (Array.isArray(langs)) {
    return langs.map((l: any) => l.name || l).join(', ');
  }

  // If it's a plain object like { pus: 'Pashto', prs: 'Dari' }
  return Object.values(langs).join(', ');
}
  
  resetSearch(): void {
    this.selectedCountry = '';
    this.capital = '';
    this.countryFlag = '';
    this.countryInfo = null;
    this.error = '';
    this.showResults = false;
  }
  
  getRegionInfo(): string {
    if (!this.countryInfo) return 'Unknown';
    
    const regionParts = [];
    if (this.countryInfo.region) regionParts.push(this.countryInfo.region);
    if (this.countryInfo.subregion) regionParts.push(this.countryInfo.subregion);
    
    return regionParts.join(' • ') || 'Unknown';
  }
  
  getTimezones(): string {
    if (!this.countryInfo?.timezones) return 'Unknown';
    return this.countryInfo.timezones.join(', ');
  }
  
  onSearchFocus(): void {
    this.searchInputFocused = true;
  }
  
  onSearchBlur(): void {
    this.searchInputFocused = false;
  }
}