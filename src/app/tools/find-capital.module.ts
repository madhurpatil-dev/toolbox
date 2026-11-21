import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FindcapitalComponent } from '../components/findcapital/findcapital.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [FindcapitalComponent],
  imports: [CommonModule, ReactiveFormsModule, ToolUiModule, RouterModule.forChild([{ path: '', component: FindcapitalComponent }])],
})
export class FindCapitalModule {}
