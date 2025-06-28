import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavComponent } from "../nav/nav.component";
import { FooterComponent } from "../footer/footer.component";

interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

interface MenuGroup {
  title: string;
  icon: string;      // clase de Bootstrap Icon
  color: string;     // color de fondo
  items: MenuItem[];
}

@Component({
  selector: 'app-menu-table',
  standalone: true,
  imports: [CommonModule, RouterModule, NavComponent, FooterComponent],
  templateUrl: './menu-table.component.html',
  styleUrls: ['./menu-table.component.css']
})
export class MenuTableComponent {
  groups: MenuGroup[] = [

    {
      title: 'Matriz Leopold',
      icon: '',
      color: '#0d6efd',
      items: [

        { label: 'Causa-Efecto (Edición)', path: '/matriz-causa-efecto', icon: 'fas fa-industry' },
        { label: 'Causa-Efecto (Visual)', path: '/matriz-causa-efecto-visualizacion', icon: 'fas fa-eye' },
        { label: 'Ponderación', path: '/matriz-ponderacion', icon: 'fas fa-calculator' },
        { label: 'Impacto', path: '/matriz-impacto', icon: 'fas fa-bolt' },
        { label: 'Factores', path: '/matriz-factor', icon: 'fas fa-fire' },
        { label: 'Acciones', path: '/matriz-accion', icon: 'fas fa-screwdriver-wrench' }
      ]
    },
    {
      title: 'Informes',
      icon: '',
      color: '#0dcaf0',
      items: [

        { label: 'Listado Informes', path: '/informe', icon: 'fas fa-pen' },
        { label: 'Formato de Informe', path: '/informe-formato', icon: 'fas fa-brush' },
      ]
    },
    {
      title: 'Organización',
      icon: '',
      color: '#6f42c1',
      items: [
        { label: 'Formulario Organización', path: '/organizacion-form', icon: 'fas fa-square-plus' }
      ]
    },
    {
      title: 'Legales',
      icon: '',
      color: '#fd7e14',
      items: [
        { label: 'Nuevo Documento', path: '/documento-form', icon: 'fas fa-pen' },
        { label: 'Listado Documentos', path: '/documento', icon: 'fas fa-scale-balanced' }
      ]
    },

    {
      title: 'Control',
      icon: '',
      color: '#198754',
      items: [
        { label: 'Semáforo Requisitos', path: '/registro-semaforo', icon: 'fas fa-traffic-light' },
        { label: 'Registro Inventario', path: '/registro-inventario', icon: 'fas fa-calendar-days' },
      ]
    },

    {
      title: 'Residuos',
      icon: '',
      color: '#dc3545',
      items: [

        { label: 'Inventario Residuos', path: '/residuo-inventario', icon: 'fas fa-pencil' },
        { label: 'Residuos', path: '/residuo', icon: 'fas fa-trash' },
      ]
    },


    {
      title: 'Usuarios',
      icon: 'bi-people-fill',
      color: '#20c997',
      items: [
        { label: 'Gestión de Usuarios', path: '/usuarios', icon: 'fas fa-users' }
      ]
    },
  ];
}