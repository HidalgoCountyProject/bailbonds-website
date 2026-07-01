import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { ServicesComponent } from './pages/services/services.component';
import { ContactComponent } from './pages/contact/contact.component';
import { defendantInfoCompletedGuard } from './documents/guards/defendant-info-completed.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Affordable Bail Bonds' },
  { path: 'about', component: AboutComponent, title: 'About - Affordable Bail Bonds' },
  { path: 'services', component: ServicesComponent, title: 'Services - Affordable Bail Bonds' },
  { path: 'contact', component: ContactComponent, title: 'Contact - Affordable Bail Bonds' },
  { path: 'documents', redirectTo: 'wizard', pathMatch: 'full' },
  { path: 'wizard', loadComponent: () => import('./documents/role-selection.component').then(m => m.RoleSelectionComponent), title: 'Select Role - Affordable Bail Bonds' },
  { 
    path: 'wizard/indemnitor/:lang/defendant-info', 
    loadComponent: () => import('./documents/defendant-info.component').then(m => m.DefendantInfoComponent),
    title: 'Defendant Information - Affordable Bail Bonds'
  },
  { 
    path: 'wizard/:role',
    loadComponent: () => import('./documents/language-gate.component').then(m => m.LanguageGateComponent),
    title: 'Choose Language - Affordable Bail Bonds'
  },
  { 
    path: 'wizard/:role/:lang', 
    loadComponent: () => import('./documents/document-wizard.component').then(m => m.DocumentWizardComponent),
    canActivate: [defendantInfoCompletedGuard],
    title: 'Complete Documents - Affordable Bail Bonds'
  },
  { 
    path: 'download/:uploadId', 
    loadComponent: () => import('./pages/download/download.component').then(m => m.DownloadComponent), 
    title: 'Descargar Documentos - Affordable Bail Bonds' 
  },
  { path: '**', redirectTo: '', pathMatch: 'full' } // Redirección para rutas no encontradas
];
