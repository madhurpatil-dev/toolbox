import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CurrencyConverterService } from '../../services/currency-converter.service';
import type { ConversionRatesResponse } from '../../services/currency-converter.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
    selector: 'app-currencyconverter',
    templateUrl: './currencyconverter.component.html',
    styleUrls: ['./currencyconverter.component.css'],
    standalone: false
})
export class CurrencyconverterComponent implements OnInit {
  conversionRates: Record<string, number> = {};
  fromCurrency: string = 'USD';
  toCurrency: string = 'INR';
  amount: number = 1;
  result: number = 0;
  isMobile: boolean | undefined;
  isLargeScreen: boolean = false;
  isLoadingRates = false;
  errorMessage = '';
  copyStatus = '';
  today: Date = new Date();
  swapCurrencies(): void {
    const temp = this.fromCurrency;
    this.fromCurrency = this.toCurrency;
    this.toCurrency = temp;
    this.convert();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 600; // Adjust this value as needed
  }

  countryNames: any = {
    USD: 'United States',
    EUR: 'Eurozone',
    JPY: 'Japan',
    GBP: 'United Kingdom',
    AUD: 'Australia',
    CAD: 'Canada',
    CHF: 'Switzerland',
    CNY: 'China',
    SEK: 'Sweden',
    NZD: 'New Zealand',
    NOK: 'Norway',
    MXN: 'Mexico',
    SGD: 'Singapore',
    HKD: 'Hong Kong',
    KRW: 'South Korea',
    TRY: 'Turkey',
    INR: 'India',
    BRL: 'Brazil',
    ZAR: 'South Africa',
    RUB: 'Russia',
    AED: 'United Arab Emirates',
    ARS: 'Argentina',
    CLP: 'Chile',
    COP: 'Colombia',
    EGP: 'Egypt',
    IDR: 'Indonesia',
    ILS: 'Israel',
    MYR: 'Malaysia',
    PHP: 'Philippines',
    PLN: 'Poland',
    SAR: 'Saudi Arabia',
    THB: 'Thailand',
    VND: 'Vietnam',
    UAH: 'Ukraine',
    HUF: 'Hungary',
    CZK: 'Czech Republic',
    DKK: 'Denmark',
    ISK: 'Iceland',
    HRK: 'Croatia',
    RON: 'Romania',
    BGN: 'Bulgaria',
    KWD: 'Kuwait',
    QAR: 'Qatar',
    OMR: 'Oman',
    JOD: 'Jordan',
    LKR: 'Sri Lanka',
    NGA: 'Nigeria',
    KEN: 'Kenya',
    ETH: 'Ethiopia',
    ZMB: 'Zambia',
    BWA: 'Botswana',
    ARG: 'Argentina',
    PER: 'Peru',
    CHN: 'China',
    JPN: 'Japan',
    USA: 'United States of America',
    CAN: 'Canada',
    BRA: 'Brazil',
    IND: 'India',
    AUS: 'Australia',
    NGR: 'Nigeria',
    SAF: 'South Africa',
    EGY: 'Egypt',
    MEX: 'Mexico',
    FRA: 'France',
    GER: 'Germany',
    ITA: 'Italy',
    ESP: 'Spain',
    RUS: 'Russia',
    CHL: 'Chile',
    COL: 'Colombia',
    VNZ: 'Venezuela',
    ECU: 'Ecuador',
    PAN: 'Panama',
    CUB: 'Cuba',
    ZIM: 'Zimbabwe',
    UGA: 'Uganda',
    TAN: 'Tanzania',
    RWA: 'Rwanda',
    BDI: 'Burundi',
    DRC: 'Democratic Republic of the Congo',
    CAF: 'Central African Republic',
    CMR: 'Cameroon',
    SOM: 'Somalia',
    SUD: 'Sudan',
    LBY: 'Libya',
    MAR: 'Morocco',
    TUN: 'Tunisia',
    DZA: 'Algeria',
    MLI: 'Mali',
    SEN: 'Senegal',
    GMB: 'Gambia',
    GNB: 'Guinea-Bissau',
    GNQ: 'Equatorial Guinea',
    CIV: 'Ivory Coast',
    GHA: 'Ghana',
    TGO: 'Togo',
    BEN: 'Benin',
    NIG: 'Niger',
    CHD: 'Chad',
    SDN: 'Sudan',
    SSD: 'South Sudan',
    ERI: 'Eritrea',
    DJI: 'Djibouti',
    COM: 'Comoros',
    MDG: 'Madagascar',
    SYC: 'Seychelles',
    MUS: 'Mauritius',
    ZAM: 'Zambia',
    MZA: 'Mozambique',
    MWI: 'Malawi',
    ANG: 'Angola',
    NAM: 'Namibia',
    SWA: 'Swaziland',
    LES: 'Lesotho',
    MAD: 'Madeupland',
    AWG: 'Aruba',
    AFN: 'Afghanistan',
    ALL: 'Albania',
    AMD: 'Armenia',
    AOA: 'Angola',
    AZN: 'Azerbaijan',
    BAM: 'Bosnia and Herzegovina',
    BBD: 'Barbados',
    BTD: 'Bhutan',
    BHD: 'Bahrain',
    BIF: 'Burundi',
    BMD: 'Bermuda',
    BND: 'Brunei',
    BOB: 'Bolivia',
    BSD: 'Bahamas',
    BTN: 'Bhutan',
    BZD: 'Belize',
    CDF: 'Democratic Republic of the Congo',
    CRC: 'Costa Rica',
    CUP: 'Cuba',
    CVE: 'Cape Verde',
    DJF: 'Djibouti',
    DOP: 'Dominican Republic',
    ERN: 'Eritrea',
    ETB: 'Ethiopia',
    FJD: 'Fiji',
    FKP: 'Falkland Islands',
    GEL: 'Georgia',
    GGP: 'Guernsey',
    GHS: 'Ghana',
    GIP: 'Gibraltar',
    GMD: 'Gambia',
    GNF: 'Guinea',
    GTQ: 'Guatemala',
    GYD: 'Guyana',
    HNL: 'Honduras',
    HTG: 'Haiti',
    IMP: 'Isle of Man',
    IQD: 'Iraq',
    IRR: 'Iran',
    JEP: 'Jersey',
    JMD: 'Jamaica',
    KES: 'Kenya',
    KGS: 'Kyrgyzstan',
    KHR: 'Cambodia',
    KID: 'Kiribati',
    KMF: 'Comoros',
    KYD: 'Cayman Islands',
    KZT: 'Kazakhstan',
    LAK: 'Laos',
    LBP: 'Lebanon',
    LRD: 'Liberia',
    LSL: 'Lesotho',
    LYD: 'Libya',
    MDL: 'Moldova',
    MGA: 'Madagascar',
    MKD: 'North Macedonia',
    MMK: 'Myanmar',
    MNT: 'Mongolia',
    MOP: 'Macau',
    MRU: 'Mauritania',
    MUR: 'Mauritius',
    MVR: 'Maldives',
    MWK: 'Malawi',
    MZN: 'Mozambique',
    NAD: 'Namibia',
    NGN: 'Nigeria',
    NIO: 'Nicaragua',
    NPR: 'Nepal',
    PAB: 'Panama',
    PEN: 'Peru',
    PGK: 'Papua New Guinea',
    PKR: 'Pakistan',
    PYG: 'Paraguay',
    RSD: 'Serbia',
    RWF: 'Rwanda',
    SBD: 'Solomon Islands',
    SCR: 'Seychelles',
    SDG: 'Sudan',
    SHP: 'Saint Helena',
    SLE: 'Sierra Leone',
    SLL: 'Sierra Leone',
    SOS: 'Somalia',
    SRD: 'Suriname',
    SSP: 'South Sudan',
    STN: 'Sao Tome and Principe',
    SYP: 'Syria',
    SZL: 'Eswatini',
    TJS: 'Tajikistan',
    TMT: 'Turkmenistan',
    TND: 'Tunisia',
    TOP: 'Tonga',
    TTD: 'Trinidad and Tobago',
    TVD: 'Tuvalu',
    TWD: 'Taiwan',
    TZS: 'Tanzania',
    UGX: 'Uganda',
    UYU: 'Uruguay',
    UZS: 'Uzbekistan',
    VES: 'Venezuela',
    VUV: 'Vanuatu',
    WST: 'Samoa',
    XAF: 'Central African CFA franc',
    XCD: 'Eastern Caribbean Dollar',
    XDR: 'Special Drawing Rights',
    XOF: 'West African CFA franc',
    XPF: 'CFP Franc',
    YER: 'Yemen',
    ZMW: 'Zambia',
    ZWL: 'Zimbabwe',
  };


  constructor(
    private converterService: CurrencyConverterService,
    private breakpointObserver: BreakpointObserver,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.fetchConversionRates();
    this.breakpointObserver.observe([Breakpoints.Large, Breakpoints.XLarge])
    .subscribe(result => {
      this.isLargeScreen = result.matches;
      this.changeDetectorRef.markForCheck();
    });
  }



  fetchConversionRates(): void {
    this.isLoadingRates = true;
    this.changeDetectorRef.markForCheck();
    this.converterService.getConversionRates().pipe(
      finalize(() => {
        this.isLoadingRates = false;
        this.changeDetectorRef.markForCheck();
      }),
    ).subscribe({
      next: (data: ConversionRatesResponse) => {
        if (!data?.rates || Object.keys(data.rates).length === 0) {
          this.errorMessage = 'Exchange rates are currently unavailable. Try again later.';
          this.changeDetectorRef.markForCheck();
          return;
        }
        this.errorMessage = '';
        this.conversionRates = data.rates;
        this.convert();
        this.changeDetectorRef.markForCheck();
      },
      error: (error: unknown) => {
        console.error('Currency rates could not be loaded.', error);
        this.errorMessage = 'Exchange rates are currently unavailable. Try again later.';
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  convert(): void {
    this.copyStatus = '';
    if (this.hasRates) {
      this.result = this.converterService.convert(
        this.amount,
        this.fromCurrency,
        this.toCurrency,
        this.conversionRates
      );
      if (!Number.isFinite(this.result)) {
        this.result = 0;
      }
    }
  }

  get hasRates(): boolean {
    return Object.keys(this.conversionRates).length > 0;
  }

  reset(): void {
    this.fromCurrency = 'USD';
    this.toCurrency = 'INR';
    this.amount = 1;
    this.copyStatus = '';
    this.convert();
  }

  async copyResult(): Promise<void> {
    if (!this.hasRates) return;

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable.');
      await navigator.clipboard.writeText(`${this.result.toFixed(2)} ${this.toCurrency}`);
      this.copyStatus = 'Conversion result copied.';
    } catch (error) {
      console.warn('Currency conversion result could not be copied.', error);
      this.copyStatus = 'Could not copy the result. Select it and copy it manually.';
    }
  }

  getCountryName(currencyCode: string): string {
    return this.countryNames[currencyCode] || currencyCode;
  }

  validateAmount(): void {
    if (this.amount < 0) {
      this.amount = Math.abs(this.amount);
    }
  }
}
