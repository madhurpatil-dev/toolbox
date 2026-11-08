import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnDestroy } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { Subscription } from 'rxjs';

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
  private refreshInterval?: ReturnType<typeof setInterval>;
  private breakpointSubscription?: Subscription;

  ngOnInit(): void {
    this.breakpointSubscription = this.breakpointObserver.observe([Breakpoints.Large, Breakpoints.XLarge])
      .subscribe(result => {
        this.isLargeScreen = result.matches;
      });
    
    this.refreshInterval = setInterval(() => {
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

      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const birthDateOnly = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      const totalMonths = (todayDate.getFullYear() - birthDateOnly.getFullYear()) * 12
        + todayDate.getMonth() - birthDateOnly.getMonth();
      const completedMonths = totalMonths - (todayDate.getDate() < birthDateOnly.getDate() ? 1 : 0);
      const monthAnniversary = this.addMonthsClamped(birthDateOnly, completedMonths);
      const days = Math.round((
        Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate())
        - Date.UTC(monthAnniversary.getFullYear(), monthAnniversary.getMonth(), monthAnniversary.getDate())
      ) / (1000 * 60 * 60 * 24));

      const diffTime = Math.abs(today.getTime() - birthDate.getTime());
      
      this.age = {
        years: Math.floor(completedMonths / 12),
        months: completedMonths % 12,
        days,
        hours: Math.floor(diffTime / (1000 * 60 * 60)),
        minutes: Math.floor(diffTime / (1000 * 60)),
        seconds: Math.floor(diffTime / 1000)
      };
      
      this.showResults = true;
    }
  }

  private addMonthsClamped(date: Date, months: number): Date {
    const monthIndex = date.getFullYear() * 12 + date.getMonth() + months;
    const year = Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    const day = Math.min(date.getDate(), new Date(year, month + 1, 0).getDate());
    return new Date(year, month, day);
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
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.breakpointSubscription?.unsubscribe();
  }
}
