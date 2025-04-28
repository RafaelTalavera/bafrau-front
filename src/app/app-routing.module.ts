// src/app/app-routing.module.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { UsuariosComponent } from './usuarios/usuarios.component';


import { AccionesComponent } from './matriz/acciones/acciones.component';
import { FactoresComponent } from './matriz/factores/componentes/factores.component';
import { InicioCapitulosComponent } from './informe-auditoria/inicio-capitulos/inicio-capitulos.component';
import { InicioFormularioInicialComponent } from './form-inicial-cliente/inicio-formulario-inicial/inicio-formulario-inicial.component';
import { OrganizacionFormComponent } from './organizacion/organizacion-form/organizacion-form.component';
import { PonderacionMatrizComponent } from './matriz/ponderacion-matriz/ponderacion-matriz.component';
import { MatrizImpactosComponent } from './matriz/matriz-impactos/matriz-impactos.component';
import { MatrizCausaEfectoV1Component } from './matriz/matriz-causa-efecto-v1/matriz-causa-efecto-v1.component';
import { MatrizCausaEfectoV1VisualizacionComponent } from './matriz/matriz-causa-efecto-v1-visualizacion/matriz-causa-efecto-v1-visualizacion.component';




export const routes: Routes = [

  { path: 'login', component: LoginComponent },
  { path: 'factor', component: FactoresComponent },
  { path: 'accion', component: AccionesComponent},
  { path: 'usuarios', component: UsuariosComponent },

  { path: 'organizacion-form', component: OrganizacionFormComponent}, 

  { path: 'matriz-ponderacion', component: PonderacionMatrizComponent },
  { path: 'matriz-impacto', component: MatrizImpactosComponent},
  { path: 'matriz-causa-efecto', component: MatrizCausaEfectoV1Component},
  { path: 'matriz-causa-efecto-visualizacion', component: MatrizCausaEfectoV1VisualizacionComponent},

   


  { path: 'capitulos/:informeId', component: InicioCapitulosComponent },
  { path: 'for-inicial-cliente', component: InicioFormularioInicialComponent},


  { path: '**', redirectTo: 'login' }, // Redirigir cualquier ruta no válida a 'home'
  { path: '**', redirectTo: '' },

];

