import { Component, OnInit } from '@angular/core';
import { InformeAuditoriaService } from './service/informe-auditoria.service';
import { InformeDTO } from './service/informe-dto.models';
import { FooterComponent } from "../gobal/footer/footer.component";
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavComponent } from '../gobal/nav/nav.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-informe-auditoria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FooterComponent, NavComponent],
  templateUrl: './informe-auditoria.component.html',
  styleUrls: ['./informe-auditoria.component.css']
})
export class InformeAuditoriaComponent implements OnInit {

  informes: InformeDTO[] = []; // Lista completa de informes
  filteredInformes: InformeDTO[] = []; // Lista filtrada para la búsqueda
  razonSocial = ''; // Texto de búsqueda
  private searchSubject = new Subject<string>(); // Observable para manejar la búsqueda

  constructor(private informeService: InformeAuditoriaService, private router: Router) { }

  ngOnInit(): void {
    // Cargar todas las razones sociales al iniciar
    this.informeService.obtenerRazonesSociales().subscribe(data => {
      this.informes = data;
      this.filteredInformes = data; // Muestra todos inicialmente
    });

    // Escuchar cambios en el término de búsqueda
    this.searchSubject.pipe(
      debounceTime(300), // Espera 300 ms después de la última entrada
      distinctUntilChanged() // Solo ejecuta si el valor cambió
    ).subscribe(searchText => {
      this.filtrarInformes(searchText);
    });
  }

  // Método para manejar la búsqueda mientras el usuario escribe
  onSearchChange(searchText: string): void {
    this.searchSubject.next(searchText); // Enviar el término de búsqueda
  }

  // Filtra la lista de informes según el término de búsqueda
  filtrarInformes(razonSocial: string): void {
    this.filteredInformes = this.informes.filter(informe =>
      informe.razonSocial.toLowerCase().includes(razonSocial.toLowerCase())
    );
  }

  irACapitulos(informeId: number, razonSocial: string): void {
    this.router.navigate(['/capitulos', informeId], { queryParams: { razonSocial } });
  }
}
