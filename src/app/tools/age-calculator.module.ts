import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AgeCalculatorComponent } from '../components/age-calculator/age-calculator.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [AgeCalculatorComponent],
  imports: [CommonModule, FormsModule, ToolUiModule, RouterModule.forChild([{ path: '', component: AgeCalculatorComponent }])],
})
export class AgeCalculatorModule {}
