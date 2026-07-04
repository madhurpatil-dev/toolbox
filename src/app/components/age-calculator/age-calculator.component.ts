import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnDestroy } from '@angular/core';
import { ThemePalette } from '@angular/material/core';

@Component({
    selector: 'app-age-calculator',
    templateUrl: './age-calculator.component.html',
    styleUrls: ['./age-calculator.component.css'],
    standalone: false
})
export class AgeCalculatorComponent implements OnDestroy {
  age: any = {};
  birthDate: Date | null = null;
  maxDate: Date;
  minDate: Date;
  isLargeScreen: boolean = false;
  primaryColor: ThemePalette = 'primary';
  accentColor: ThemePalette = 'accent';
  showResults: boolean = false;
  currentTime: Date = new Date();
  showCelebration: boolean = false;

  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Large, Breakpoints.XLarge])
      .subscribe(result => {
        this.isLargeScreen = result.matches;
      });
    
    // Update current time every second
    setInterval(() => {
      this.currentTime = new Date();
      if (this.birthDate) {
        this.calculateAge();
      }
    }, 1000);
  }

  constructor(private breakpointObserver: BreakpointObserver) {
    this.maxDate = new Date();
    this.minDate = new Date(1900, 0, 1);
  }

  calculateAge() {
    if (this.birthDate) {
      const today = new Date();
      const birthDate = new Date(this.birthDate);
      
      // Calculate years
      let age = today.getFullYear() - birthDate.getFullYear();
      const month = today.getMonth() - birthDate.getMonth();
      
      if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Calculate months
      let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
      months -= birthDate.getMonth();
      months += today.getMonth();
      
      // Calculate days
      const diffTime = Math.abs(today.getTime() - birthDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      this.age = {
        years: age,
        months: months,
        days: diffDays,
        hours: Math.floor(diffTime / (1000 * 60 * 60)),
        minutes: Math.floor(diffTime / (1000 * 60)),
        seconds: Math.floor(diffTime / 1000)
      };
      
      this.showResults = true;
    }
  }

  toggleCelebration() {
    this.showCelebration = !this.showCelebration;
    
    if (this.showCelebration) {
      setTimeout(() => {
        this.showCelebration = false;
      }, 3000);
    }
  }

  ngOnDestroy() {
    // Clear any intervals if needed
  }
}
