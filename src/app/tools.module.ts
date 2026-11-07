import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { A11yModule } from '@angular/cdk/a11y';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { AgeCalculatorComponent } from './components/age-calculator/age-calculator.component';
import { CalculatorComponent } from './components/calculator/calculator.component';
import { ColorDisplayComponent } from './components/color-display/color-display.component';
import { CurrencyconverterComponent } from './components/currencyconverter/currencyconverter.component';
import { StringManipulatorComponent } from './components/data-manipulator/string-manipulator.component';
import { FindcapitalComponent } from './components/findcapital/findcapital.component';
import { FindflagComponent } from './components/findflag/findflag.component';
import { FontsComponent } from './components/fonts/fonts.component';
import { WeatherComponent } from './components/weather/weather.component';
import { WorldClockComponent } from './components/world-clock/world-clock.component';

const routes: Routes = [
  { path: 'calculator', component: CalculatorComponent },
  { path: 'age-calculator', component: AgeCalculatorComponent },
  { path: 'currencyconverter', component: CurrencyconverterComponent },
  { path: 'findcapital', component: FindcapitalComponent },
  { path: 'colorpicker', component: ColorDisplayComponent },
  { path: 'findflag', component: FindflagComponent },
  { path: 'worldclock', component: WorldClockComponent },
  { path: 'fontconverter', component: FontsComponent },
  { path: 'data-manipulation', component: StringManipulatorComponent },
  { path: 'weather-service', component: WeatherComponent },
];

@NgModule({
  declarations: [
    AgeCalculatorComponent,
    CalculatorComponent,
    ColorDisplayComponent,
    CurrencyconverterComponent,
    StringManipulatorComponent,
    FindcapitalComponent,
    FindflagComponent,
    FontsComponent,
    WeatherComponent,
    WorldClockComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatInputModule,
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatChipsModule,
    MatSelectModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinner,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatButtonToggleModule,
    A11yModule,
    NgxMatSelectSearchModule,
  ],
})
export class ToolsModule {}
