import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ToolPreferencesService } from '../../services/tool-preferences.service';

type ToolCategory = 'Everyday' | 'World' | 'Creative' | 'Converters';
type ToolView = 'all' | 'favorites' | 'recent';

interface Service {
  title: string;
  description: string;
  image: string;
  route: string;
  color: string;
  category: ToolCategory;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    standalone: false
})
export class HomeComponent {
  @ViewChild('toolSearch') toolSearch?: ElementRef<HTMLInputElement>;
  searchTerm = '';
  activeCategory: ToolCategory | 'All' = 'All';
  activeView: ToolView = 'all';
  readonly categories: Array<ToolCategory | 'All'> = ['All', 'Everyday', 'World', 'Creative', 'Converters'];

  allServices: Service[] = [
    {
      title: 'Calculator',
      description: 'Perform basic and advanced calculations with our user-friendly calculator',
      image: './assets/calculatorImage.png',
      route: 'calculator',
      color: '#4e73df',
      category: 'Everyday',
    },
    {
      title: 'Age Calculator',
      description: 'Find out the age according to your birth date',
      image: './assets/calculator.png',
      route: 'age-calculator',
      color: '#1cc88a',
      category: 'Everyday',
    },
    {
      title: 'Currency Converter',
      description: 'Convert currencies easily with real-time exchange rates from around the world',
      image: './assets/currencyConverter.png',
      route: 'currencyconverter',
      color: '#36b9cc',
      category: 'Converters',
    },
    {
      title: 'Find Capital',
      description: 'Discover the capitals of different countries quickly, efficiently and accurately',
      image: './assets/findCapital.png',
      route: 'findcapital',
      color: '#f6c23e',
      category: 'World',
    },
    {
      title: 'Color Picker',
      description: 'Explore a variety of colors and their RGB formats with our interactive color picker including Gradient Color',
      image: './assets/colorPicker.jpg',
      route: 'colorpicker',
      color: '#e74a3b',
      category: 'Creative',
    },
    {
      title: 'Find Flag',
      description: 'Discover flags of different countries quickly and easily',
      image: './assets/findFlag.png',
      route: 'findflag',
      color: '#5a5c69',
      category: 'World',
    },
    {
      title: 'World Clock',
      description: 'Check realtime date and time across different timezones',
      image: './assets/clock.png',
      route: 'worldclock',
      color: '#858796',
      category: 'World',
    },
    {
      title: 'Find Population',
      description: 'Find out the population of any country with detailed data analysis',
      image: './assets/population.jpg',
      route: 'population',
      color: '#6610f2',
      category: 'World',
    },
    {
      title: 'Data Manipulator',
      description: 'Perform over 40 different operations, including encoding, decoding, and string transformations',
      image: './assets/datamanipulation.jpg',
      route: 'data-manipulation',
      color: '#5a5c69',
      category: 'Creative',
    },
    {
      title: 'Font Converter',
      description: 'Convert your normal text to amazing fonts for social media and design',
      image: './assets/fontconverter.png',
      route: 'fontconverter',
      color: '#1cc88a',
      category: 'Creative',
    },
    {
      title: 'Weather Info',
      description: 'Check current weather conditions and forecasts for any location',
      image: './assets/weather-thumb.svg',
      route: 'weather-service',
      color: '#36b9cc',
      category: 'World',
    }
  ];

  constructor(readonly preferences: ToolPreferencesService) {}

  get filteredServices(): Service[] {
    const query = this.searchTerm.trim().toLowerCase();
    let services = this.allServices.filter(({ title, description, category }) =>
      !query || `${title} ${description} ${category}`.toLowerCase().includes(query),
    );

    if (this.activeCategory !== 'All') {
      services = services.filter((service) => service.category === this.activeCategory);
    }
    if (this.activeView === 'favorites') {
      const favoriteOrder = this.preferences.favoriteRoutes();
      services = services
        .filter((service) => favoriteOrder.includes(service.route))
        .sort((left, right) => favoriteOrder.indexOf(left.route) - favoriteOrder.indexOf(right.route));
    } else if (this.activeView === 'recent') {
      const recentOrder = this.preferences.recentRoutes();
      services = services
        .filter((service) => recentOrder.includes(service.route))
        .sort((left, right) => recentOrder.indexOf(left.route) - recentOrder.indexOf(right.route));
    }

    return services;
  }

  get favoriteCount(): number {
    return this.preferences.favoriteRoutes().length;
  }

  get recentCount(): number {
    return this.preferences.recentRoutes().length;
  }

  onSearchInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.searchTerm = event.target.value;
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    if (this.toolSearch) {
      this.toolSearch.nativeElement.value = '';
      this.toolSearch.nativeElement.focus();
    }
  }

  toggleFavorite(event: Event, route: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.preferences.toggleFavorite(route);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.activeCategory = 'All';
    this.activeView = 'all';
    if (this.toolSearch) this.toolSearch.nativeElement.value = '';
  }

  @HostListener('window:keydown', ['$event'])
  handleSearchShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.toolSearch?.nativeElement.focus();
    } else if (
      event.key === '/' &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !(event.target instanceof HTMLInputElement) &&
      !(event.target instanceof HTMLTextAreaElement) &&
      !(event.target instanceof HTMLSelectElement) &&
      !(event.target instanceof HTMLElement && event.target.isContentEditable)
    ) {
      event.preventDefault();
      this.toolSearch?.nativeElement.focus();
    }
  }
}
