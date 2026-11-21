import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WorldClockComponent } from '../components/world-clock/world-clock.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [WorldClockComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToolUiModule, RouterModule.forChild([{ path: '', component: WorldClockComponent }])],
})
export class WorldClockModule {}
