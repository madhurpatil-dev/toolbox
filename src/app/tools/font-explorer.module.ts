import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontsComponent } from '../components/fonts/fonts.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [FontsComponent],
  imports: [CommonModule, FormsModule, ToolUiModule, RouterModule.forChild([{ path: '', component: FontsComponent }])],
})
export class FontExplorerModule {}
