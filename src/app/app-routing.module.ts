import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NotFoundComponent } from './components/not-found/not-found.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
  },
  {
    path: 'country-explorer',
    loadChildren: () => import('./countries.module').then((m) => m.CountriesModule),
  },
  { path: 'findcapital', redirectTo: 'country-explorer', pathMatch: 'full' },
  { path: 'findflag', redirectTo: 'country-explorer', pathMatch: 'full' },
  {
    path: 'population',
    redirectTo: 'country-explorer',
    pathMatch: 'full',
  },
  {
    path: '',
    loadChildren: () => import('./tools.module').then((m) => m.ToolsModule),
  },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
