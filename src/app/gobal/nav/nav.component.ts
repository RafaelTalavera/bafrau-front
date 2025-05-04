import { Component, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';

declare var $: any;

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    // Sólo en la primera visita, marca y recarga:
    if (!sessionStorage.getItem('navReloaded')) {
      sessionStorage.setItem('navReloaded', 'true');
      window.location.reload();
    } else {
      this.loadPlugins();
    }
  }

  private loadPlugins(): void {
    // Toggle y treeview
    ($('[data-widget="pushmenu"]') as any).PushMenu();
    ($('[data-widget="treeview"]') as any).Treeview();
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
  }
}
