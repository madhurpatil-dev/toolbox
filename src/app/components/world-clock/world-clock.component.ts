import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { countries } from '../../constants/countries';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { WorldTimeService } from '../../services/world-service.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-world-clock',
    templateUrl: './world-clock.component.html',
    styleUrls: ['./world-clock.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush // Optimize change detection
    ,
    standalone: false
})
export class WorldClockComponent implements OnInit, OnDestroy {
  countries = countries;
  selectedCountryCode: string = '';
  errorMessage: string = '';

  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;
  timezone: string = '';

  isLargeScreen: boolean = false;

  private countryChangeSubject = new Subject<string>();
  private intervalId: any; // Store the interval ID

  constructor(
    private worldTimeService: WorldTimeService,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Large, Breakpoints.XLarge])
      .subscribe(result => {
        this.isLargeScreen = result.matches;
      });

    this.countryChangeSubject.pipe(
      debounceTime(300), // Debounce user input
      distinctUntilChanged() // Only emit if the value has changed
    ).subscribe(countryCode => {
      this.fetchTime(countryCode);
    });
  }

  ngOnDestroy() {
    // Clear the interval when the component is destroyed
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  onCountryChange() {
    if (!this.selectedCountryCode) {
      return;
    }

    this.countryChangeSubject.next(this.selectedCountryCode);
  }

  fetchTime(countryCode: string) {
    this.worldTimeService.getTimeByCountry(countryCode)
      .subscribe({
        next: (data: any) => {
          if (data.datetime) {
            this.errorMessage = '';
            this.processTime(data.datetime);
            this.timezone = data.timezone;
            this.cdr.markForCheck(); // Manually trigger change detection
          } else {
            this.errorMessage = 'Unexpected response from API';
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to fetch time. Please try again later.';
          this.cdr.markForCheck(); // Manually trigger change detection
        }
      });
  }

  processTime(datetime: string) {
    const dateTimeParts = datetime.split('T');
    let timeParts = dateTimeParts[1].split(':');

    this.hours = parseInt(timeParts[0]);
    this.minutes = parseInt(timeParts[1]);
    this.seconds = parseInt(timeParts[2]);

    this.startClock();
  }

  startClock() {
    // Clear the existing interval if it exists
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Start a new interval
    this.intervalId = setInterval(() => {
      this.seconds++;
      if (this.seconds === 60) {
        this.seconds = 0;
        this.minutes++;
      }
      if (this.minutes === 60) {
        this.minutes = 0;
        this.hours++;
      }
      if (this.hours === 24) {
        this.hours = 0;
      }
      this.cdr.markForCheck(); // Manually trigger change detection
    }, 1000);
  }

  getHourRotation(): string {
    return `rotate(${(this.hours % 12) * 30 + this.minutes * 0.5}deg)`;
  }

  getMinuteRotation(): string {
    return `rotate(${this.minutes * 6}deg)`;
  }

  getSecondRotation(): string {
    return `rotate(${this.seconds * 6}deg)`;
  }

  // Format time as HH:MM:SS AM/PM
  getFormattedTime(): string {
    const pad = (num: number) => num < 10 ? `0${num}` : num;
    const hours12 = this.hours % 12 || 12; // Convert to 12-hour format (0 becomes 12)
    const ampm = this.hours < 12 ? 'AM' : 'PM'; // Determine AM/PM
    return `${pad(hours12)}:${pad(this.minutes)}:${pad(this.seconds)} ${ampm}`;
  }
  
  getCurrentDate(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

}
