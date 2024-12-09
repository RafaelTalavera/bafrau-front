import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { NavbarComponent } from "./gobal/navbar/navbar.component";
import { HomeComponent } from "./gobal/home/home.component";
import { UsuariosComponent } from "./usuarios/usuarios.component";
import { FooterComponent } from "./gobal/footer/footer.component";
import { FactoresComponent } from "./matriz/factores/componentes/factores.component";
import { AccionesComponent } from "./matriz/acciones/acciones.component";
import { FormInformesComponent } from "./form-inicial-cliente/form/form-informes.component";
import { ForNominaEmpleadosComponent } from "./form-inicial-cliente/for-nomina-empleados/for-nomina-empleados.component";
import { ForTelefonoEmpleadosComponent } from "./form-inicial-cliente/for-telefono-empleados/for-telefono-empleados.component";
import { ForCorreoEmpleadosComponent } from "./form-inicial-cliente/for-correo-empleados/for-correo-empleados.component";
import { ForServiciosDisponiblesComponent } from "./form-inicial-cliente/for-servicios-disponibles/for-servicios-disponibles.component";
import { ForSectorComponent } from "./form-inicial-cliente/for-sector/for-sector.component";
import { MatProgressBarModule } from '@angular/material/progress-bar';







@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterModule, 
           MatProgressBarModule,  
          ]
})
export class AppComponent {
  title = 'bafrau';
}
