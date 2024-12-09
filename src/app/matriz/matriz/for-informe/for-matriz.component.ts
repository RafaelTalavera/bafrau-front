import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';


import { HttpClient } from '@angular/common/http';
import { InformeService } from './matriz.service.component';
import { NavComponent } from '../../../gobal/nav/nav.component';
import { FooterComponent } from '../../../gobal/footer/footer.component';
import Swal from 'sweetalert2';
import { ItemInforme, Matriz } from '../../../models/matriz';

@Component({
  selector: 'app-form-informe',
  standalone: true,
  imports: [CommonModule, FormsModule, NavComponent, FooterComponent],
  templateUrl: './for-matriz.component.html',
  styleUrls: ['./for-matriz.component.css']
})
export class FormMatrizComponent {
  informe: Matriz = {
    id: 0,
    fecha: '',
    organizacion: '',
    direccion: '',
    rubro: '',
    items: []
  };

  factores: { [index: number]: any[] } = {};
  acciones: { [index: number]: any[] } = {};


  constructor(private informeService: InformeService, private http: HttpClient) { }

  addItem() {
    this.informe.items.push({
      id: 0,
      magnitude: 0,
      importance: 0,
      accionId: 0,
      factorId: 0
    } as ItemInforme);
  }

  removeItem(index: number) {
    this.informe.items.splice(index, 1);
    delete this.factores[index];
    delete this.acciones[index];
  }

  onClasificacionFactorChange(index: number) {
    const clasificacion = this.informe.items[index].clasificacionFactor;
    console.log(`Clasificación del Factor seleccionada en el índice ${index}:`, clasificacion);
    
    this.http.get<any[]>(`http://localhost:8080/api/factores/${clasificacion}`).subscribe(data => {
      console.log(`Datos recibidos para la clasificación del Factor "${clasificacion}":`, data);
      this.factores[index] = data;
    }, error => {
      console.error(`Error al obtener factores para la clasificación "${clasificacion}":`, error);
    });
  }
  
  onClasificacionAccionChange(index: number) {
    const clasificacion = this.informe.items[index].clasificacionAccion;
    console.log(`Clasificación de la Acción seleccionada en el índice ${index}:`, clasificacion);
  
    this.http.get<any[]>(`http://localhost:8080/api/acciones/${clasificacion}`).subscribe(data => {
      console.log(`Datos recibidos para la clasificación de la Acción "${clasificacion}":`, data);
      this.acciones[index] = data;
    }, error => {
      console.error(`Error al obtener acciones para la clasificación "${clasificacion}":`, error);
    });
  }
  

  onSubmit(informeForm: NgForm) {
    if (informeForm.valid) {
      this.informeService.createInforme(this.informe).subscribe(response => {
        console.log('Informe creado:', response);
        Swal.fire({
          title: 'Éxito',
          text: 'El informe ha sido creado exitosamente.',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
      }, error => {
        console.error('Error al crear el informe:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al crear el informe.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      });
      informeForm.resetForm();
    }
  }
}
