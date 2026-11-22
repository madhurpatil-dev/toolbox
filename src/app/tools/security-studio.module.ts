import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SecurityStudioComponent } from '../components/security-studio/security-studio.component';
import { ToolUiModule } from '../tool-ui.module';

@NgModule({
  declarations: [SecurityStudioComponent],
  imports: [CommonModule, FormsModule, ToolUiModule, RouterModule.forChild([{ path: '', component: SecurityStudioComponent }])],
})
export class SecurityStudioModule {}
