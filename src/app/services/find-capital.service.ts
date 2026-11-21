import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CountryRecord, CountryServiceService } from './country-service.service';

@Injectable({ providedIn: 'root' })
export class FindCapitalService {
  constructor(private readonly countryService: CountryServiceService) {}

  findCapital(countryName: string): Observable<{ data: { objects: CountryRecord[] } }> {
    const normalizedName = countryName.trim().toLocaleLowerCase();
    return this.countryService.getAllCountries().pipe(
      switchMap((countries) => {
        const country = countries.find(
          (item) => item.names?.common?.toLocaleLowerCase() === normalizedName,
        );
        if (!country?.codes?.alpha_2 || country.capitals?.length) {
          return of({ data: { objects: country ? [country] : [] } });
        }
        return this.countryService.getCountryByCode(country.codes.alpha_2).pipe(
          map((details) => ({ data: { objects: [details] } })),
        );
      }),
    );
  }

  fetchCountryNames(): Observable<string[]> {
    return this.countryService.getAllCountries().pipe(
      map((countries) => [
        'India/Bharat',
        ...countries
          .map((country) => country.names?.common)
          .filter((name): name is string => Boolean(name)),
      ]),
    );
  }
}
