import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TextDiffComponent } from '../components/text-diff/text-diff.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [TextDiffComponent],
  imports: [CommonModule, FormsModule, ToolUiModule, RouterModule.forChild([{ path: '', component: TextDiffComponent }])],
})
export class TextDiffModule {}
