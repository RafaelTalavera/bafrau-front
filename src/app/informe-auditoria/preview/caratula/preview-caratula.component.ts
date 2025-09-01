// src/app/preview-caratula/preview-caratula.component.ts

import { Component, ElementRef, ViewChild, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import panzoom from '@panzoom/panzoom';
import html2pdf from 'html2pdf.js';

import { CaratulaService } from '../../service/caratula.service';
import { CaratulaView } from '../../caratula/caratula.component';

import { NavComponent } from '../../../gobal/nav/nav.component';
import { FooterComponent } from '../../../gobal/footer/footer.component';

@Component({
  selector: 'app-preview-caratula',
  standalone: true,
  imports: [CommonModule, NavComponent, FooterComponent],
  templateUrl: './preview-caratula.component.html',
  styleUrls: ['./preview-caratula.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PreviewCaratulaComponent implements OnInit {
  @ViewChild('previewContainer', { static: false })
  previewContainer!: ElementRef<HTMLDivElement>;

  informeId!: number;
  previewHtml: SafeHtml | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private caratulaService: CaratulaService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.informeId = Number(params.get('id'));
      this.previewCaratula();
    });
  }

  async previewCaratula(): Promise<void> {
    this.loading = true;

    // 1) Cargar carátula desde el servicio
    const lista = await firstValueFrom(
      this.caratulaService.getByInforme(this.informeId)
    );
    const c = lista[0] as CaratulaView;

    // 2) URLs de los dos adjuntos
    const url1 = c.adjuntos?.[0]?.urlAdjunto || '';
    const url2 = c.adjuntos?.[1]?.urlAdjunto || '';

    // 3) Primera imagen (arriba)
    const primeraImagenHtml = url1 ? `
      <div style="text-align:center; margin:1.5em 0;">
        <img
          src="${url1}"
          style="
          padding: 20px; 
            width:80%;
            height:auto;
            object-fit:cover;
            border:none;
            display:block;
            margin:0 auto;
          "
          alt="Adjunto 1"
        />
      </div>
    ` : '';

    // 4) Título (entre las dos imágenes)
    const tituloHtml = `
  <h1
  class="titulo-realiza-extra"

    style="
      padding: 20px;
      font-size: 60px;
      margin: 0 0 .5em;
      text-align: center;
    "
  >
    ${c.titulo}
  </h1>
`;


    // 5) Segunda imagen (justo después del título)
    const segundaImagenHtml = url2 ? `
      <div style="text-align:center; margin:1.5em 0 0;">
        <img
          src="${url2}"
          style="
            padding: 20px; 
            width:60%;
            height:auto;
            object-fit:cover;
            border:none;
            display:block;
            margin:0 auto;
          "
          alt="Adjunto 2"
        />
      </div>
    ` : '';

// 6) Detalles: elaborador y fecha (va al final)
const detallesHtml = `
  <div class="nyala-text" style="margin-top: 20px;">          <!-- separa del elemento anterior -->
    <p style="margin-bottom: 200px;">        <!-- espacio abajo de este párrafo -->
      <strong>Equipo Técnico:</strong> ${c.elaborador}
    </p>
    <p style="margin-bottom: 0;">           <!-- último párrafo, sin margen extra abajo -->
      <strong>Fecha:</strong> ${c.fecha}
    </p>
  </div>
`;


    // 7) Construir el bloque en el orden: img1 → título → img2 → detalles
    const blockHtml = `
      <div class="section-block">
        ${primeraImagenHtml}
        ${tituloHtml}
        ${segundaImagenHtml}
        ${detallesHtml}
      </div>
    `;

    // 8) Medición para paginación (sin cambios)
    const mmToPx = (mm: number) => (mm / 25.4) * 96;
    const measurer = document.createElement('div');
    Object.assign(measurer.style, {
      position: 'absolute',
      visibility: 'hidden',
      width: `${mmToPx(210 - 20)}px`
    });
    document.body.appendChild(measurer);
    measurer.innerHTML = blockHtml;
    document.body.removeChild(measurer);

    // 9) Ensamblar página A4 con esquineros
    const pages = [
      `<div class="page">
         <!-- esquineros superiores -->
         <img class="corner top-right"
              src="assets/dist/img/esquina-2.png"
              alt="Esq. sup. der." />

         ${blockHtml}

         <!-- esquineros inferiores -->
         <img class="corner bottom-left"
              src="assets/dist/img/esquina-1.png"
              alt="Esq. inf. izq." />
       </div>`
    ];

    // 10) Inyectar en el modal de SweetAlert2
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(
      `<div class="preview-root">${pages.join('')}</div>`
    );

    // 11) Activar Panzoom
    setTimeout(() => {
      panzoom(this.previewContainer.nativeElement, {
        maxZoom: 3,
        minZoom: 1,
        bounds: true,
        boundsPadding: 0.1
      });
    });

    this.loading = false;
  }

  downloadPdf(): void {
    if (!this.previewContainer) return;
    html2pdf()
      .from(this.previewContainer.nativeElement)
      .set({
        margin: [0, 0, 0, 0],
        filename: 'caratula.pdf',
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          width: this.previewContainer.nativeElement.offsetWidth,
          windowWidth: this.previewContainer.nativeElement.offsetWidth
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css'], after: '.page' }
      })
      .save();
  }
}
