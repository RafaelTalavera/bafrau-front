// src/app/app-routing.module.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { UsuariosComponent } from './usuarios/usuarios.component';

import { HomeComponent } from './gobal/home/home.component';
import { AccionesComponent } from './matriz/acciones/acciones.component';
import { FactoresComponent } from './matriz/factores/componentes/factores.component';
import { FormMatrizComponent } from './matriz/matriz/for-informe/for-matriz.component';
import { FormInformesComponent } from './form-inicial-cliente/form/form-informes.component';
import { ForNominaEmpleadosComponent } from './form-inicial-cliente/for-nomina-empleados/for-nomina-empleados.component';
import { ForTelefonoEmpleadosComponent } from './form-inicial-cliente/for-telefono-empleados/for-telefono-empleados.component';
import { ForCorreoEmpleadosComponent } from './form-inicial-cliente/for-correo-empleados/for-correo-empleados.component';
import { ForServiciosDisponiblesComponent } from './form-inicial-cliente/for-servicios-disponibles/for-servicios-disponibles.component';
import { ForSectorComponent } from './form-inicial-cliente/for-sector/for-sector.component';
import { ForProcesoComponent } from './form-inicial-cliente/for-proceso/for-proceso.component';
import { ForInsumoComponent } from './form-inicial-cliente/for-insumo/for-insumo.component';
import { ForProcedimientoComponent } from './form-inicial-cliente/for-procedimiento/for-procedimiento.component';
import { ForAdjuntoInformeComponent } from './form-inicial-cliente/for-adjunto-informe/for-adjunto-informe.component';
import { InformeAuditoriaComponent } from './informe-auditoria/informe-auditoria.component';
import { InicioCapitulosComponent } from './informe-auditoria/inicio-capitulos/inicio-capitulos.component';
import { InicioFormularioInicialComponent } from './form-inicial-cliente/inicio-formulario-inicial/inicio-formulario-inicial.component';



export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'factor', component: FactoresComponent },
  { path: 'accion', component: AccionesComponent},
  { path: 'usuarios', component: UsuariosComponent },
  { path: 'matriz', component: FormMatrizComponent },
  { path: 'form-informe', component: FormInformesComponent}, 
  { path: 'for-nomina-empleados/:informeId', component: ForNominaEmpleadosComponent },
  { path: 'for-telefono/:informeId', component: ForTelefonoEmpleadosComponent },
  { path: 'for-correo/:informeId', component: ForCorreoEmpleadosComponent },
  { path: 'for-servicio/:informeId', component: ForServiciosDisponiblesComponent},
  { path: 'for-sector/:informeId', component: ForSectorComponent},
  { path: 'for-proceso/:informeId' , component: ForProcesoComponent},
  { path: 'for-insumo/:procesoId', component: ForInsumoComponent},
  { path: 'for-insumo/:informeId', component: ForInsumoComponent },
  { path: 'for-procedimiento/:informeId', component: ForProcedimientoComponent},
  { path: 'for-adjunto-informe/:informeId', component: ForAdjuntoInformeComponent},
  { path: 'for-auditoria', component: InformeAuditoriaComponent},
  { path: 'capitulos/:informeId', component: InicioCapitulosComponent },
  { path: 'for-inicial-cliente', component: InicioFormularioInicialComponent},


  { path: '**', redirectTo: 'login' }, // Redirigir cualquier ruta no válida a 'home'
  { path: '**', redirectTo: '' },

];

