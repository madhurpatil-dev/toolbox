import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Service {
  title: string;
  description: string;
  image: string;
  route: string;
  color: string;
}

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    standalone: false
})
export class HomeComponent implements OnInit {
  searchControl = new FormControl('');
  allServices: Service[] = [
    {
      title: 'Calculator',
      description: 'Perform basic and advanced calculations with our user-friendly calculator',
      image: './assets/calculatorImage.png',
      route: 'calculator',
      color: '#4e73df'
    },
    {
      title: 'Age Calculator',
      description: 'Find out the age according to your birth date',
      image: './assets/calculator.png',
      route: 'age-calculator',
      color: '#1cc88a'
    },
    {
      title: 'Currency Converter',
      description: 'Convert currencies easily with real-time exchange rates from around the world',
      image: './assets/currencyConverter.png',
      route: 'currencyconverter',
      color: '#36b9cc'
    },
    {
      title: 'Find Capital',
      description: 'Discover the capitals of different countries quickly, efficiently and accurately',
      image: './assets/findCapital.png',
      route: 'findcapital',
      color: '#f6c23e'
    },
    {
      title: 'Color Picker',
      description: 'Explore a variety of colors and their RGB formats with our interactive color picker including Gradient Color',
      image: './assets/colorPicker.jpg',
      route: 'colorpicker',
      color: '#e74a3b'
    },
    {
      title: 'Find Flag',
      description: 'Discover flags of different countries quickly and easily',
      image: './assets/findFlag.png',
      route: 'findflag',
      color: '#5a5c69'
    },
    {
      title: 'World Clock',
      description: 'Check realtime date and time across different timezones',
      image: './assets/clock.png',
      route: 'worldclock',
      color: '#858796'
    },
    {
      title: 'Find Population',
      description: 'Find out the population of any country with detailed data analysis',
      image: './assets/population.jpg',
      route: 'population',
      color: '#6610f2'
    },
    {
      title: 'Data Manipulator',
      description: 'Perform over 40 different operations, including encoding, decoding, and string transformations',
      image: './assets/datamanipulation.jpg',
      route: 'data-manipulation',
      color: '#5a5c69'
    },
    {
      title: 'Font Converter',
      description: 'Convert your normal text to amazing fonts for social media and design',
      image: './assets/fontconverter.png',
      route: 'fontconverter',
      color: '#1cc88a'
    },
    {
      title: 'Weather Info',
      description: 'Check current weather conditions and forecasts for any location',
      image: './assets/weather.jpg',
      route: 'weather-service',
      color: '#36b9cc'
    }
  ];
  filteredServices: Service[] = [];
  isSearchFocused: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.filteredServices = [...this.allServices];
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.filterServices(searchTerm || '');
      });
  }

  private filterServices(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredServices = [...this.allServices];
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredServices = this.allServices.filter(service => 
      service.title.toLowerCase().includes(term) || 
      service.description.toLowerCase().includes(term)
    );
  }

  onSearchFocus(): void {
    this.isSearchFocused = true;
  }

  onSearchBlur(): void {
    this.isSearchFocused = false;
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.filteredServices = [...this.allServices];
  }
}
