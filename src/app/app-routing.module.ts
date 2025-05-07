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
import { FormDocumentoComponent } from './legal/form-documento/form-documento.component';
import { DocumentoComponent } from './legal/documento/documento.component';
import { ResiduoComponent } from './residuo/residuo/residuo.component';
import { ResiduoInventarioComponent } from './residuo/inventario/residuo-inventario/residuo-inventario.component';
import { InventarioRegistroComponent } from './legal/inventario-registro/inventario-registro.component';
import { SemaforoRequisitosComponent } from './legal/semaforo-requisitos/semaforo-requisitos.component';




export const routes: Routes = [

  { path: 'login', component: LoginComponent },

  {
    path: 'usuarios', component: UsuariosComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR'] }
  },


  //Matriz Leopold
  {
    path: 'matriz-ponderacion', component: PonderacionMatrizComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },
  {
    path: 'matriz-impacto', component: MatrizImpactosComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },
  {
    path: 'matriz-causa-efecto', component: MatrizCausaEfectoV1Component,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },
  {
    path: 'matriz-causa-efecto-visualizacion', component: MatrizCausaEfectoV1VisualizacionComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },
  {
    path: 'matriz-factor', component: FactoresComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR'] }
  },
  {
    path: 'matriz-accion', component: AccionesComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR'] }
  },

  //Organización
  {
    path: 'organizacion-form', component: OrganizacionFormComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },
  {
    path: 'organizacion-form', component: OrganizacionFormComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },

  //Legales 
  {
    path: 'documento-form', component: FormDocumentoComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },

  {
    path: 'documento', component: DocumentoComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },

  //Residuos

  {
    path: 'residuo', component: ResiduoComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },

  //Inventario 
  {
    path: 'residuo-inventario', component: ResiduoInventarioComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },

  //legal
  {
    path: 'registro-inventario', component: InventarioRegistroComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },

  {
    path: 'registro-semaforo', component: SemaforoRequisitosComponent,
    canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] }
  },

  { path: '**', redirectTo: 'login' }, // Redirigir cualquier ruta no válida a 'home'
  { path: '**', redirectTo: '' },

];

