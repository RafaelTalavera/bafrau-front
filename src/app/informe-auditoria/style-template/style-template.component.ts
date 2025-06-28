// src/app/style-template/style-template.component.ts
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import Swal from 'sweetalert2';
import { StyleTemplateDTO } from './models/style-template.DTO';
import { StyleTemplateService } from './service/style-template.service';
import { NavComponent } from "../../gobal/nav/nav.component";
import { FooterComponent } from "../../gobal/footer/footer.component";

@Component({
  selector: 'app-style-template',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NavComponent, FooterComponent],
  templateUrl: './style-template.component.html',
  styleUrls: ['./style-template.component.css']
})
export class StyleTemplateComponent implements OnInit {
  styles: StyleTemplateDTO[] = [];
  styleSelected: StyleTemplateDTO = this.resetStyle();

  constructor(private service: StyleTemplateService) {}

  ngOnInit(): void {
    this.loadStyles();
  }

  resetStyle(): StyleTemplateDTO {
    return {
      id: 0,
      nombre: '',
      fontFamily: '',
      fontSize: '',
      fontWeight: '',
      fontStyle: '',
      color: '',
      backgroundColor: '',
      lineHeight: '',
      textAlign: '',
      textDecoration: '',
      marginTop: '',
      marginBottom: '',
      marginLeft: '',
      marginRight: '',
      paddingTop: '',
      paddingBottom: '',
      paddingLeft: '',
      paddingRight: '',
      border: '',
      borderRadius: ''
    };
  }

  loadStyles(): void {
    this.service.findAll().subscribe({
      next: data => this.styles = data,
      error: err => Swal.fire('Error', 'No se pudieron cargar los estilos', 'error')
    });
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) return;

    const op = this.styleSelected.id > 0
      ? this.service.updateFactor(this.styleSelected)
      : this.service.create(this.styleSelected);

    op.subscribe({
      next: () => {
        Swal.fire('Éxito', `Estilo ${this.styleSelected.id>0 ? 'actualizado' : 'creado'}`, 'success');
        form.resetForm();
        this.styleSelected = this.resetStyle();
        this.loadStyles();
      },
      error: () => Swal.fire('Error', 'No se pudo guardar el estilo', 'error')
    });
  }

  edit(style: StyleTemplateDTO): void {
    this.styleSelected = { ...style };
  }

  remove(id: number): void {
    Swal.fire({
      title: 'Confirmar eliminación',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar'
    }).then(res => {
      if (res.isConfirmed) {
        this.service.remove(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Estilo eliminado correctamente', 'success');
            this.loadStyles();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el estilo', 'error')
        });
      }
    });
  }
}
