import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { ServicesComponent } from './pages/services/services.component';
import { ContactComponent } from './pages/contact/contact.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Home | Hidalgo Bail Bonds' },
  { path: 'about', component: AboutComponent, title: 'About Us | Hidalgo Bail Bonds' },
  { path: 'services', component: ServicesComponent, title: 'Our Services | Hidalgo Bail Bonds' },
  { path: 'contact', component: ContactComponent, title: 'Contact Us | Hidalgo Bail Bonds' },
  { path: '**', redirectTo: '', pathMatch: 'full' } // Redirección para rutas no encontradas
];
