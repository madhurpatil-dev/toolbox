import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UnitConverterComponent } from '../components/unit-converter/unit-converter.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [UnitConverterComponent],
  imports: [CommonModule, FormsModule, ToolUiModule, RouterModule.forChild([{ path: '', component: UnitConverterComponent }])],
})
export class UnitConverterModule {}
