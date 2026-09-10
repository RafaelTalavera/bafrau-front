// src/app/app-routing.module.ts
import { Routes } from '@angular/router';
import { roleGuard } from './auth/service/role-guard';
import { ShellLayoutComponent } from './layout/shell-layout/shell-layout.component';
import { pendingChangesGuard } from './guards/pending-changes.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    component: ShellLayoutComponent,
    children: [
      // Matriz Leopold
      { path: 'matriz-ponderacion', loadComponent: () => import('./matriz/matriz-ponderacion/ponderacion-matriz.component').then(m => m.PonderacionMatrizComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'matriz-impacto', loadComponent: () => import('./matriz/matriz-impactos/matriz-impactos.component').then(m => m.MatrizImpactosComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'matriz-causa-efecto', loadComponent: () => import('./matriz/matriz-causa-efecto-v1/matriz-causa-efecto-v1.component').then(m => m.MatrizCausaEfectoV1Component), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'matriz-causa-efecto-visualizacion', loadComponent: () => import('./matriz/matriz-causa-efecto-v1-visualizacion/matriz-causa-efecto-v1-visualizacion.component').then(m => m.MatrizCausaEfectoV1VisualizacionComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'matriz-copiar', loadComponent: () => import('./matriz/copiar-matriz/copiar-matriz.component').then(m => m.CopiarMatrizComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'matriz-causa-efecto-v1-visualizacion/:razonSocial/:sectionId', loadComponent: () => import('./matriz/matriz-causa-efecto-v1-visualizacion/matriz-causa-efecto-v1-visualizacion.component').then(m => m.MatrizCausaEfectoV1VisualizacionComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'matriz-ponderacion/:razonSocial/:sectionId', loadComponent: () => import('./matriz/matriz-ponderacion/ponderacion-matriz.component').then(m => m.PonderacionMatrizComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'matriz-impactos/:seccionId', loadComponent: () => import('./matriz/matriz-impactos/matriz-impactos.component').then(m => m.MatrizImpactosComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'matriz-impacto/:razonSocial/:sectionId', loadComponent: () => import('./matriz/matriz-impactos/matriz-impactos.component').then(m => m.MatrizImpactosComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'matriz-factor', loadComponent: () => import('./matriz/factores/componentes/factores.component').then(m => m.FactoresComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR'] } },
      { path: 'matriz-accion', loadComponent: () => import('./matriz/acciones/acciones.component').then(m => m.AccionesComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR'] } },

      // Organizacion
      { path: 'organizacion-form', loadComponent: () => import('./organizacion/organizacion-form/organizacion-form.component').then(m => m.OrganizacionFormComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },

      // Legales
      { path: 'documento-form', loadComponent: () => import('./legal/form-documento/form-documento.component').then(m => m.FormDocumentoComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'documento', loadComponent: () => import('./legal/documento/documento.component').then(m => m.DocumentoComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'registro-inventario', loadComponent: () => import('./legal/inventario-registro/inventario-registro.component').then(m => m.InventarioRegistroComponent), canActivate: [roleGuard], canDeactivate: [pendingChangesGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'registro-semaforo', loadComponent: () => import('./legal/semaforo-requisitos/semaforo-requisitos.component').then(m => m.SemaforoRequisitosComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'reporte-legal-organizacion', loadComponent: () => import('./legal/reporte-legal-organizacion/reporte-legal-organizacion.component').then(m => m.ReporteLegalOrganizacionComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },

      // Residuos
      { path: 'residuo', loadComponent: () => import('./residuo/residuo/residuo.component').then(m => m.ResiduoComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'residuo-inventario', loadComponent: () => import('./residuo/inventario/residuo-inventario/residuo-inventario.component').then(m => m.ResiduoInventarioComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },

      // Desvios y seguimientos
      { path: 'desvios', loadComponent: () => import('./desvios/desvios-list/desvios-list.component').then(m => m.DesviosListComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'desvios/nuevo', loadComponent: () => import('./desvios/desvio-form/desvio-form.component').then(m => m.DesvioFormComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'desvios/:id', loadComponent: () => import('./desvios/desvio-detail/desvio-detail.component').then(m => m.DesvioDetailComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },

      // Informe
      { path: 'informe-formato', loadComponent: () => import('./informe-auditoria/style-template/style-template.component').then(m => m.StyleTemplateComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'informe', loadComponent: () => import('./informe-auditoria/informe-auditoria.component').then(m => m.InformeAuditoriaComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'capitulos/:informeId', loadComponent: () => import('./informe-auditoria/capitulo/capitulo.component').then(m => m.CapituloComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'capitulo/:capituloId/seccion', loadComponent: () => import('./informe-auditoria/seccion/seccion.component').then(m => m.SeccionComponent) },
      { path: 'encabezado/:informeId', loadComponent: () => import('./informe-auditoria/encabezado/encabezado.component').then(m => m.EncabezadoComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'caratula/:informeId', loadComponent: () => import('./informe-auditoria/caratula/caratula.component').then(m => m.CaratulaComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'informes/:id/preview', loadComponent: () => import('./informe-auditoria/preview/informe/informe-preview.component').then(m => m.InformePreviewComponent) },
      { path: 'informes/:id/previewCaraula', loadComponent: () => import('./informe-auditoria/preview/caratula/preview-caratula.component').then(m => m.PreviewCaratulaComponent) },

      // Configuracion y menu
      { path: 'menu', loadComponent: () => import('./gobal/menu-table/menu-table.component').then(m => m.MenuTableComponent), canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR', 'USER'] } },
      { path: 'usuarios', loadComponent: () => import('./usuarios/usuarios.component').then(m => m.UsuariosComponent), canActivate: [roleGuard], canDeactivate: [pendingChangesGuard], data: { roles: ['ADMINISTRATOR'] } }
    ]
  },
  { path: '**', redirectTo: 'menu' }
];
