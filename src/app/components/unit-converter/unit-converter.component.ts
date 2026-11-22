import { Component } from '@angular/core';

type Unit = { name: string; symbol: string; factor: number };
type UnitCategory = { name: string; units: Unit[] };

@Component({
  selector: 'app-unit-converter',
  templateUrl: './unit-converter.component.html',
  styleUrls: ['./unit-converter.component.css'],
  standalone: false,
})
export class UnitConverterComponent {
  category = 'Length';
  categories: Record<string, UnitCategory> = {
    Length: { name: 'Length', units: [
      { name: 'Meter', symbol: 'm', factor: 1 },
      { name: 'Kilometer', symbol: 'km', factor: 1000 },
      { name: 'Centimeter', symbol: 'cm', factor: 0.01 },
      { name: 'Millimeter', symbol: 'mm', factor: 0.001 },
      { name: 'Mile', symbol: 'mi', factor: 1609.344 },
      { name: 'Yard', symbol: 'yd', factor: 0.9144 },
      { name: 'Foot', symbol: 'ft', factor: 0.3048 },
      { name: 'Inch', symbol: 'in', factor: 0.0254 },
    ] },
    Mass: { name: 'Mass', units: [
      { name: 'Kilogram', symbol: 'kg', factor: 1 },
      { name: 'Gram', symbol: 'g', factor: 0.001 },
      { name: 'Milligram', symbol: 'mg', factor: 0.000001 },
      { name: 'Metric ton', symbol: 't', factor: 1000 },
      { name: 'Pound', symbol: 'lb', factor: 0.45359237 },
      { name: 'Ounce', symbol: 'oz', factor: 0.028349523125 },
    ] },
    Area: { name: 'Area', units: [
      { name: 'Square meter', symbol: 'm²', factor: 1 },
      { name: 'Square kilometer', symbol: 'km²', factor: 1000000 },
      { name: 'Square foot', symbol: 'ft²', factor: 0.09290304 },
      { name: 'Square mile', symbol: 'mi²', factor: 2589988.110336 },
      { name: 'Acre', symbol: 'ac', factor: 4046.8564224 },
      { name: 'Hectare', symbol: 'ha', factor: 10000 },
    ] },
    Volume: { name: 'Volume', units: [
      { name: 'Liter', symbol: 'L', factor: 1 },
      { name: 'Milliliter', symbol: 'mL', factor: 0.001 },
      { name: 'Cubic meter', symbol: 'm³', factor: 1000 },
      { name: 'US gallon', symbol: 'gal', factor: 3.785411784 },
      { name: 'US cup', symbol: 'cup', factor: 0.2365882365 },
      { name: 'Fluid ounce', symbol: 'fl oz', factor: 0.0295735295625 },
    ] },
    Speed: { name: 'Speed', units: [
      { name: 'Meter/sec', symbol: 'm/s', factor: 1 },
      { name: 'Kilometer/hour', symbol: 'km/h', factor: 0.2777777778 },
      { name: 'Mile/hour', symbol: 'mph', factor: 0.44704 },
      { name: 'Foot/sec', symbol: 'ft/s', factor: 0.3048 },
      { name: 'Knot', symbol: 'kn', factor: 0.5144444444 },
    ] },
    Time: { name: 'Time', units: [
      { name: 'Second', symbol: 'sec', factor: 1 },
      { name: 'Millisecond', symbol: 'ms', factor: 0.001 },
      { name: 'Minute', symbol: 'min', factor: 60 },
      { name: 'Hour', symbol: 'hr', factor: 3600 },
      { name: 'Day', symbol: 'day', factor: 86400 },
      { name: 'Week', symbol: 'week', factor: 604800 },
    ] },
    Data: { name: 'Data', units: [
      { name: 'Byte', symbol: 'B', factor: 1 },
      { name: 'Kilobyte', symbol: 'KB', factor: 1000 },
      { name: 'Megabyte', symbol: 'MB', factor: 1000000 },
      { name: 'Gigabyte', symbol: 'GB', factor: 1000000000 },
      { name: 'Kibibyte', symbol: 'KiB', factor: 1024 },
      { name: 'Mebibyte', symbol: 'MiB', factor: 1048576 },
      { name: 'Gibibyte', symbol: 'GiB', factor: 1073741824 },
    ] },
    Temperature: { name: 'Temperature', units: [
      { name: 'Celsius', symbol: '°C', factor: 1 },
      { name: 'Fahrenheit', symbol: '°F', factor: 1 },
      { name: 'Kelvin', symbol: 'K', factor: 1 },
    ] },
  };
  value = 1;
  from = 'm';
  to = 'km';
  result = 0;
  copyStatus = '';

  setCategory(category: string): void {
    this.category = category;
    const units = this.categories[category].units;
    this.from = units[0].symbol;
    this.to = units[1]?.symbol ?? units[0].symbol;
    this.convert();
  }

  get units(): Unit[] {
    return this.categories[this.category].units;
  }

  convert(): void {
    this.copyStatus = '';
    if (!Number.isFinite(this.value)) {
      this.result = 0;
      return;
    }
    if (this.category === 'Temperature') {
      this.result = this.convertTemperature(this.value, this.from, this.to);
      return;
    }
    const from = this.units.find((unit) => unit.symbol === this.from);
    const to = this.units.find((unit) => unit.symbol === this.to);
    this.result = from && to ? this.value * from.factor / to.factor : 0;
  }

  swap(): void {
    [this.from, this.to] = [this.to, this.from];
    this.convert();
  }

  reset(): void {
    this.value = 1;
    this.category = 'Length';
    this.from = 'm';
    this.to = 'km';
    this.result = 0;
    this.convert();
  }

  async copy(): Promise<void> {
    await navigator.clipboard?.writeText(`${this.format(this.result)} ${this.to}`);
    this.copyStatus = 'Converted value copied';
  }

  format(value: number): string {
    if (!Number.isFinite(value)) return '0';
    return Number(value.toPrecision(10)).toLocaleString('en-US', { maximumFractionDigits: 8 });
  }

  private convertTemperature(value: number, from: string, to: string): number {
    const celsius = from === '°F' ? (value - 32) * 5 / 9 : from === 'K' ? value - 273.15 : value;
    return to === '°F' ? celsius * 9 / 5 + 32 : to === 'K' ? celsius + 273.15 : celsius;
  }
}
