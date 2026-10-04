import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CalculatorComponent } from './components/calculator/calculator.component';
import { FindcapitalComponent } from './components/findcapital/findcapital.component';
import { HomeComponent } from './components/home/home.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CurrencyconverterComponent } from './components/currencyconverter/currencyconverter.component';
import { ColorDisplayComponent } from './components/color-display/color-display.component';
import { FindflagComponent } from './components/findflag/findflag.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FooterComponent } from './components/footer/footer.component';
import { WorldClockComponent } from './components/world-clock/world-clock.component';
import { WorldTimeService } from './services/world-service.service';
import { AgeCalculatorComponent } from './components/age-calculator/age-calculator.component';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CountriesComponent } from './components/countries/countries.component';
import { FontsComponent } from './components/fonts/fonts.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { StringManipulatorComponent } from './components/data-manipulator/string-manipulator.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { WeatherComponent } from './components/weather/weather.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner, MatSpinner } from '@angular/material/progress-spinner';
import {MatTabsModule} from '@angular/material/tabs';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { A11yModule } from '@angular/cdk/a11y';
import {
    ChartCardComponent,
    CountryCardComponent,
    CountrySearchComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonLoaderComponent,
    StatCardComponent,
} from './components/countries/countries-ui.components';


@NgModule({ declarations: [
        AppComponent,
        NavbarComponent,
        CalculatorComponent,
        FindcapitalComponent,
        HomeComponent,
        CurrencyconverterComponent,
        ColorDisplayComponent,
        FindflagComponent,
        FooterComponent,
        WorldClockComponent,
        AgeCalculatorComponent,
        FontsComponent,
        StringManipulatorComponent,
        WeatherComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        FormsModule,
        BrowserAnimationsModule,
        MatInputModule,
        MatCardModule,
        MatTabsModule,
        MatFormFieldModule,
        MatButtonModule,
        MatSelectModule,
        MatProgressSpinner,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonToggleModule,
        ReactiveFormsModule,
        MatToolbarModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        MatAutocompleteModule,
        MatDividerModule,
        MatChipsModule,
        NgxMatSelectSearchModule,
        A11yModule,
        CountriesComponent,
        ChartCardComponent,
        CountryCardComponent,
        CountrySearchComponent,
        EmptyStateComponent,
        ErrorStateComponent,
        SkeletonLoaderComponent,
        StatCardComponent], providers: [WorldTimeService, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule {}
