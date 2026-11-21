import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CalculatorComponent } from '../components/calculator/calculator.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [CalculatorComponent],
  imports: [CommonModule, ToolUiModule, RouterModule.forChild([{ path: '', component: CalculatorComponent }])],
})
export class CalculatorModule {}
