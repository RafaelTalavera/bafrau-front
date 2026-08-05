import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

type NavSection = 'auditoria' | 'matriz' | 'tecnica' | 'desvios' | 'configuracion';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly layoutFrameOffsetVar = '--layout-frame-offset';
  private readonly sectionMatchers: Record<NavSection, string[]> = {
    auditoria: ['/informe', '/informe-formato', '/capitulos/', '/capitulo/', '/encabezado/', '/caratula/', '/informes/'],
    matriz: ['/matriz-causa-efecto', '/matriz-causa-efecto-visualizacion', '/matriz-ponderacion', '/matriz-impacto', '/matriz-impactos', '/matriz-factor', '/matriz-accion'],
    tecnica: ['/registro-semaforo', '/reporte-legal-organizacion', '/registro-inventario', '/documento', '/documento-form', '/residuo-inventario', '/residuo', '/residuo-form'],
    desvios: ['/desvios'],
    configuracion: ['/usuarios']
  };

  isSidebarCollapsed = true;
  isSidebarHovered = false;
  openSections = new Set<NavSection>();

  constructor(
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isSidebarCollapsed = this.document.body.classList.contains('sidebar-collapse');
    this.syncBodyClasses();
    this.syncOpenSection(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(event => {
        this.syncOpenSection(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.style.removeProperty(this.layoutFrameOffsetVar);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(event?: Event): void {
    event?.preventDefault();
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.isSidebarHovered = false;
    this.syncBodyClasses();
  }

  setSidebarHoverState(isHovered: boolean): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isSidebarHovered = this.isSidebarCollapsed && isHovered;
    this.syncLayoutFrameOffset();
  }

  toggleSection(section: NavSection, event: Event): void {
    event.preventDefault();

    if (this.openSections.has(section)) {
      this.openSections.delete(section);
      return;
    }

    this.openSections.add(section);
  }

  isSectionOpen(section: NavSection): boolean {
    return this.openSections.has(section);
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    this.router.navigate(['/login']);
  }

  private syncBodyClasses(): void {
    const { body } = this.document;
    body.classList.add('hold-transition', 'sidebar-mini');
    body.classList.toggle('sidebar-collapse', this.isSidebarCollapsed);
    this.syncLayoutFrameOffset();
  }

  private syncLayoutFrameOffset(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isMobile = window.innerWidth <= 991.98;
    const frameOffset = isMobile
      ? '0px'
      : this.isSidebarCollapsed && !this.isSidebarHovered
        ? 'var(--layout-sidebar-collapsed-width)'
        : 'var(--layout-sidebar-width)';

    this.document.body.style.setProperty(this.layoutFrameOffsetVar, frameOffset);
  }

  private syncOpenSection(url: string): void {
    const matchedSection = (Object.entries(this.sectionMatchers) as Array<[NavSection, string[]]>)
      .find(([, patterns]) => patterns.some(pattern => url.startsWith(pattern)))
      ?.[0];

    this.openSections.clear();

    if (matchedSection) {
      this.openSections.add(matchedSection);
    }
  }
}
