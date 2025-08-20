import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-project-editor-choice',
  imports: [MatButtonModule, MatCardModule, RouterLink],
  template: `
    <h2>Wybierz edytor</h2>
    <div class="choices">
      <button mat-raised-button color="primary" (click)="open('graphic')">Edytor graficzny</button>
      <button mat-stroked-button (click)="open('text')">Edytor tekstowy</button>
    </div>
  `,
  styles: [`
    h2 { margin-bottom:16px; }
    .choices { display:flex; gap:16px; }
  `]
})
export class ProjectEditorChoiceComponent {
  constructor(private router: Router, private route: ActivatedRoute) {}

  open(mode: 'graphic' | 'text') {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate([`/projects/${id}/${mode}`]);
    } else {
      this.router.navigate([`/projects/new/${mode}`]);
    }
  }
}