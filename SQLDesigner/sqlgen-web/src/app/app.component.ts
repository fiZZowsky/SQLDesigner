import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar>
      <span>SQL Generator</span>
      <span style="flex:1 1 auto;"></span>
      <a mat-button routerLink="/">Projekty</a>
      <a mat-button color="primary" routerLink="/projects/new">Nowy projekt</a>
    </mat-toolbar>

    <div class="container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .container { padding: 16px; max-width: 1200px; margin: 0 auto; }
    mat-toolbar { position: sticky; top: 0; z-index: 10; }
  `]
})
export class AppComponent {}
