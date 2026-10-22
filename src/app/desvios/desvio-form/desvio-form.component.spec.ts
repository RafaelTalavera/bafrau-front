import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { OrganizacionService } from '../../organizacion/service/organizacion-service';
import { DesvioDetalle } from '../models/desvio.model';
import { DesviosService } from '../services/desvios.service';
import { DesvioFormComponent } from './desvio-form.component';

describe('DesvioFormComponent', () => {
  let component: DesvioFormComponent;
  let service: jasmine.SpyObj<DesviosService>;
  let router: Router;

  const created: DesvioDetalle = {
    id: 7, numero: 10, organizacionId: 2, razonSocial: 'Empresa', fechaDeteccion: '2026-10-22',
    sitioEstablecimiento: 'Planta', inspector: 'Inspector', estado: 'PRIMERA_OBSERVACION', porcentaje: 75,
    fechaCreacion: '2026-10-22T10:00:00Z', descripcion: 'Descripción', accionesInmediatas: [],
    accionesCorrectivasSugeridas: [], activo: true, fechaModificacion: '2026-10-22T10:00:00Z',
    evidencias: [], seguimientos: []
  };

  beforeEach(() => {
    service = jasmine.createSpyObj<DesviosService>('DesviosService', ['crear', 'subirEvidencia']);
    const organizaciones = jasmine.createSpyObj<OrganizacionService>('OrganizacionService', ['getOrganizacionesRepresentacionTecnica']);
    organizaciones.getOrganizacionesRepresentacionTecnica.and.returnValue(of([]));
    TestBed.configureTestingModule({
      imports: [DesvioFormComponent],
      providers: [
        { provide: DesviosService, useValue: service },
        { provide: OrganizacionService, useValue: organizaciones },
        provideRouter([])
      ]
    });
    component = TestBed.createComponent(DesvioFormComponent).componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    component.form.setValue({
      organizacionId: '2', fechaDeteccion: '2026-10-22', indiceGravedad: 'LEVE', condicionOperacion: 'NORMAL',
      sitioEstablecimiento: 'Planta', descripcion: 'Descripción',
      accionesInmediatas: [{ descripcion: 'Contener', responsable: '', fechaEjecucion: '' }],
      accionesCorrectivasSugeridas: [{ descripcion: 'Corregir', responsable: '', fechaEjecucion: '' }],
      responsablesReferentes: ''
    });
  });

  it('mantiene el flujo exitoso y evita envíos duplicados', () => {
    const response = new Subject<DesvioDetalle>();
    service.crear.and.returnValue(response);
    component.guardar(); component.guardar();
    expect(service.crear).toHaveBeenCalledTimes(1);
    expect(component.saving).toBeTrue();
    response.next(created); response.complete();
    expect(router.navigate).toHaveBeenCalledWith(['/desvios', 7]);
    expect(component.saving).toBeFalse();
  });

  it('asigna errores simples y de FormArray sin borrar validaciones de cliente', () => {
    const response = new Subject<DesvioDetalle>();
    service.crear.and.returnValue(response);
    component.guardar();
    component.form.controls.fechaDeteccion.setErrors({ required: true });
    response.error(apiError(400, {
      code: 'DESVIO_VALIDATION_ERROR', message: 'Datos inválidos',
      fieldErrors: { fechaDeteccion: 'Fecha inválida', 'accionesInmediatas[0].descripcion': 'Acción inválida' }
    }));
    expect(component.form.controls.fechaDeteccion.errors).toEqual({ required: true, server: 'Fecha inválida' });
    expect(component.accionesInmediatas.at(0).get('descripcion')?.getError('server')).toBe('Acción inválida');
    expect(component.fieldErrorEntries.length).toBe(2);
  });

  [
    { status: 0, message: 'No se pudo conectar' },
    { status: 401, message: 'sesión' },
    { status: 403, message: 'permisos' },
    { status: 409, message: 'conflicto' },
    { status: 500, message: 'error interno' },
    { status: 503, message: 'temporalmente' }
  ].forEach(testCase => it(`usa fallback seguro para status ${testCase.status}`, () => {
    service.crear.and.returnValue(throwError(() => apiError(testCase.status, 'respuesta no JSON')));
    component.guardar();
    expect(component.error).toContain(testCase.message);
    expect(component.form.value.descripcion).toBe('Descripción');
    expect(service.crear).toHaveBeenCalledTimes(1);
    expect(component.saving).toBeFalse();
  }));

  it('prioriza el mensaje público y muestra correlationId del header', () => {
    service.crear.and.returnValue(throwError(() => apiError(409, { code: 'DESVIO_DATA_CONFLICT', message: 'Conflicto informado' }, 'ref-123')));
    component.guardar();
    expect(component.error).toBe('Conflicto informado');
    expect(component.correlationId).toBe('ref-123');
  });

  it('usa el fallback final para una respuesta sin JSON', () => {
    service.crear.and.returnValue(throwError(() => apiError(418, 'texto')));
    component.guardar();
    expect(component.error).toBe('No se pudo crear el desvío.');
  });
});

function apiError(status: number, error: unknown, correlationId?: string): HttpErrorResponse {
  return new HttpErrorResponse({ error, status, headers: correlationId ? new HttpHeaders({ 'X-Correlation-ID': correlationId }) : undefined });
}
