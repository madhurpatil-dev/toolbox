import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'image-studio', loadChildren: () => import('./tools/image-studio.module').then((module) => module.ImageStudioModule) },
  { path: 'age-calculator', loadChildren: () => import('./tools/age-calculator.module').then((module) => module.AgeCalculatorModule) },
  { path: 'currencyconverter', loadChildren: () => import('./tools/currency-converter.module').then((module) => module.CurrencyConverterModule) },
  { path: 'colorpicker', loadChildren: () => import('./tools/color-explorer.module').then((module) => module.ColorExplorerModule) },
  { path: 'worldclock', loadChildren: () => import('./tools/world-clock.module').then((module) => module.WorldClockModule) },
  { path: 'fontconverter', loadChildren: () => import('./tools/font-explorer.module').then((module) => module.FontExplorerModule) },
  { path: 'data-manipulation', loadChildren: () => import('./tools/data-manipulator.module').then((module) => module.DataManipulatorModule) },
  { path: 'weather-service', loadChildren: () => import('./tools/weather.module').then((module) => module.WeatherModule) },
  { path: 'qr-studio', loadChildren: () => import('./tools/qr-studio.module').then((module) => module.QrStudioModule) },
  { path: 'unit-converter', loadChildren: () => import('./tools/unit-converter.module').then((module) => module.UnitConverterModule) },
  { path: 'text-diff', loadChildren: () => import('./tools/text-diff.module').then((module) => module.TextDiffModule) },
  { path: 'security-studio', loadChildren: () => import('./tools/security-studio.module').then((module) => module.SecurityStudioModule) },
];

@NgModule({ imports: [RouterModule.forChild(routes)] })
export class ToolsModule {}
