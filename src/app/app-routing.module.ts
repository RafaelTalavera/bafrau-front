// src/app/app-routing.module.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { UsuariosComponent } from './usuarios/usuarios.component';


import { AccionesComponent } from './matriz/acciones/acciones.component';
import { FactoresComponent } from './matriz/factores/componentes/factores.component';
import { OrganizacionFormComponent } from './organizacion/organizacion-form/organizacion-form.component';
import { PonderacionMatrizComponent } from './matriz/matriz-ponderacion/ponderacion-matriz.component';
import { MatrizImpactosComponent } from './matriz/matriz-impactos/matriz-impactos.component';
import { MatrizCausaEfectoV1Component } from './matriz/matriz-causa-efecto-v1/matriz-causa-efecto-v1.component';
import { MatrizCausaEfectoV1VisualizacionComponent } from './matriz/matriz-causa-efecto-v1-visualizacion/matriz-causa-efecto-v1-visualizacion.component';
import { roleGuard } from './auth/service/role-guard';




export const routes: Routes = [

  { path: 'login', component: LoginComponent },
 
  { path: 'usuarios', component: UsuariosComponent , 
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR'] } },

  { path: 'organizacion-form', component: OrganizacionFormComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },

  { path: 'matriz-ponderacion', component: PonderacionMatrizComponent ,
     canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
  { path: 'matriz-impacto', component: MatrizImpactosComponent, 
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
  { path: 'matriz-causa-efecto', component: MatrizCausaEfectoV1Component, 
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
  { path: 'matriz-causa-efecto-visualizacion', component: MatrizCausaEfectoV1VisualizacionComponent,
     canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
  { path: 'matriz-factor', component: FactoresComponent , 
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR'] } },
  { path: 'matriz-accion', component: AccionesComponent, 
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR'] } },

  { path: 'organizacion-form' , component : OrganizacionFormComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },

   

  { path: '**', redirectTo: 'login' }, // Redirigir cualquier ruta no válida a 'home'
  { path: '**', redirectTo: '' },

];

