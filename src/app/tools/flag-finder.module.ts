import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FindflagComponent } from '../components/findflag/findflag.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [FindflagComponent],
  imports: [CommonModule, ReactiveFormsModule, ToolUiModule, RouterModule.forChild([{ path: '', component: FindflagComponent }])],
})
export class FlagFinderModule {}
