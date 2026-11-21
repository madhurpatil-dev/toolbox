import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ColorDisplayComponent } from '../components/color-display/color-display.component';

@NgModule({
  declarations: [ColorDisplayComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild([{ path: '', component: ColorDisplayComponent }])],
})
export class ColorExplorerModule {}
