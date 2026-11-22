import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QrStudioComponent } from '../components/qr-studio/qr-studio.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [QrStudioComponent],
  imports: [
    CommonModule,
    FormsModule,
    ToolUiModule,
    RouterModule.forChild([{ path: '', component: QrStudioComponent }]),
  ],
})
export class QrStudioModule {}
