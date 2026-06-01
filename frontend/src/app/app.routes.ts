import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'jobs',
    loadComponent: () => import('./features/jobs/jobs-list/jobs-list.component').then(m => m.JobsListComponent)
  },
  {
    path: 'jobs/:id',
    loadComponent: () => import('./features/jobs/job-detail/job-detail.component').then(m => m.JobDetailComponent)
  },
  {
    path: 'applications',
    loadComponent: () => import('./features/applications/applications.component').then(m => m.ApplicationsComponent)
  },
  {
    path: 'companies',
    loadComponent: () => import('./features/companies/companies.component').then(m => m.CompaniesComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  // Configurações movidas para /profile (profile.component.ts)
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
