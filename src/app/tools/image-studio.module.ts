import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ImageStudioComponent } from '../components/image-studio/image-studio.component';

@NgModule({
  declarations: [ImageStudioComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: ImageStudioComponent }]),
  ],
})
export class ImageStudioModule {}
