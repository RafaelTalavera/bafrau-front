import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
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
[]