import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WeatherComponent } from '../components/weather/weather.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [WeatherComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToolUiModule, RouterModule.forChild([{ path: '', component: WeatherComponent }])],
})
export class WeatherModule {}
