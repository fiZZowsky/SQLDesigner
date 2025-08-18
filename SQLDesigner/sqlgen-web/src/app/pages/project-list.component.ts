import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectsApi } from '../services/projects.api';
import { ProjectListItemDto } from '../models';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-project-list',
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="header">
      <h2>Twoje projekty</h2>
      <a mat-stroked-button color="primary" routerLink="/projects/new">
        <mat-icon>add</mat-icon> Nowy projekt
      </a>
    </div>

    <div class="grid">
      <mat-card *ngFor="let p of projects" class="item">
        <mat-card-title>{{ p.name }}</mat-card-title>
        <mat-card-subtitle>Tabele: {{ p.tablesCount }}</mat-card-subtitle>
        <mat-card-actions>
          <a mat-button color="primary" [routerLink]="['/projects', p.id]">Edytuj</a>
          <button mat-button color="warn" (click)="remove(p.id)"><mat-icon>delete</mat-icon> Usuń</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .header { display:flex; align-items:center; gap:16px; margin-bottom:16px; }
    .header h2 { margin:0; flex:1 1 auto; }
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:12px; }
    .item { display:flex; flex-direction:column; }
  `]
})
export class ProjectListComponent implements OnInit {
  projects: ProjectListItemDto[] = [];
  constructor(private api: ProjectsApi, private router: Router) {}

  ngOnInit() { this.load(); }
  load() { this.api.list().subscribe(r => this.projects = r); }
  remove(id: number) {
    if (!confirm('Na pewno usunąć projekt?')) return;
    this.api.delete(id).subscribe(() => this.load());
  }
}
