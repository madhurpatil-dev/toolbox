import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StringManipulatorComponent } from '../components/data-manipulator/string-manipulator.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [StringManipulatorComponent],
  imports: [CommonModule, FormsModule, ToolUiModule, RouterModule.forChild([{ path: '', component: StringManipulatorComponent }])],
})
export class DataManipulatorModule {}
