import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CurrencyconverterComponent } from '../components/currencyconverter/currencyconverter.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [CurrencyconverterComponent],
  imports: [CommonModule, FormsModule, ToolUiModule, RouterModule.forChild([{ path: '', component: CurrencyconverterComponent }])],
})
export class CurrencyConverterModule {}
