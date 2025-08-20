import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { ProjectsApi } from '../services/projects.api';
import { ProjectUpsertDto, TableDto } from '../models';

interface GTable {
  id: number;
  x: number;
  y: number;
  name: string;
  columns: string[];
}

@Component({
  standalone: true,
  selector: 'app-project-graphic-editor',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule
  ],
  template: `
    <div class="header">
      <h2>{{ id ? 'Edycja projektu' : 'Nowy projekt' }}</h2>
      <span class="spacer"></span>
      <button mat-stroked-button type="button" (click)="save()">Zapisz</button>
      <button mat-raised-button color="primary" type="button" (click)="generate()">Generuj SQL</button>
    </div>

    <mat-card>
      <div class="row">
        <mat-form-field class="w-300">
          <mat-label>Nazwa projektu</mat-label>
          <input matInput [(ngModel)]="name" required>
        </mat-form-field>

        <mat-form-field class="grow">
          <mat-label>Opis</mat-label>
          <input matInput [(ngModel)]="description">
        </mat-form-field>
      </div>
    </mat-card>

    <div class="graphic-layout">
      <div class="toolbar">
        <button mat-button (click)="selectedTool='select'" [class.active]="selectedTool==='select'">
          <mat-icon>mouse</mat-icon>
        </button>
        <button mat-button (click)="selectedTool='table'" [class.active]="selectedTool==='table'">
          <mat-icon>table_chart</mat-icon>
        </button>
        <button mat-button (click)="selectedTool='fk'" [class.active]="selectedTool==='fk'">
          <mat-icon>share</mat-icon>
        </button>
      </div>

      <div class="canvas" (click)="canvasClick($event)">
        <svg class="relations">
          <line *ngFor="let fk of fks"
            [attr.x1]="getCenter(fk.from).x" [attr.y1]="getCenter(fk.from).y"
            [attr.x2]="getCenter(fk.to).x" [attr.y2]="getCenter(fk.to).y"></line>
        </svg>
        <div class="table" *ngFor="let t of tables"
             [style.left.px]="t.x" [style.top.px]="t.y"
             (click)="selectTable(t, $event)">
          <div class="table-header">{{ t.name }}</div>
          <div class="column" *ngFor="let c of t.columns">{{ c }}</div>
          <button mat-mini-button (click)="addColumn(t, $event)"><mat-icon>add</mat-icon></button>
        </div>
      </div>

      <div class="props" *ngIf="selected">
        <h3>Właściwości</h3>
        <label>Nazwa:
          <input [(ngModel)]="selected.name">
        </label>
      </div>
    </div>
  `,
  styles: [`
    .header { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .spacer { flex:1 1 auto; }
    .row { display:flex; gap:12px; flex-wrap:wrap; }
    .w-300 { width:300px; }
    .grow { flex:1 1 auto; min-width: 240px; }
    .graphic-layout { display:flex; height:600px; margin-top:16px; }
    .toolbar { width:60px; border-right:1px solid #ccc; display:flex; flex-direction:column; }
    .toolbar button.active { background:#ddd; }
    .canvas { flex:1; position:relative; }
    .table { position:absolute; border:1px solid #555; background:#fff; padding:4px; cursor:pointer; }
    .table-header { font-weight:bold; }
    .table button { margin-top:4px; }
    .props { width:200px; border-left:1px solid #ccc; padding:8px; }
    .relations { position:absolute; width:100%; height:100%; pointer-events:none; }
  `]
})
export class ProjectGraphicEditorComponent implements OnInit {
  private api = inject(ProjectsApi);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  id: number | null = null;
  name = '';
  description = '';

  tables: GTable[] = [];
  fks: { from: number; to: number }[] = [];
  private tableId = 1;
  selectedTool: 'select' | 'table' | 'fk' = 'select';
  selected: GTable | null = null;
  fkStart: GTable | null = null;

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = Number(idParam);
      this.api.get(this.id).subscribe(dto => this.loadDto(dto));
    } else {
      this.addTableAt(100, 100);
    }
  }

  canvasClick(e: MouseEvent) {
    if (this.selectedTool === 'table') {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.addTableAt(x, y);
      this.selectedTool = 'select';
    }
  }

  addTableAt(x: number, y: number) {
    this.tables.push({ id: this.tableId++, x, y, name: 'Tabela' + this.tableId, columns: [] });
  }

  selectTable(t: GTable, e: MouseEvent) {
    e.stopPropagation();
    if (this.selectedTool === 'fk') {
      if (!this.fkStart) {
        this.fkStart = t;
      } else if (this.fkStart !== t) {
        this.fks.push({ from: this.fkStart.id, to: t.id });
        this.fkStart = null;
      }
    } else {
      this.selected = t;
    }
  }

  addColumn(t: GTable, e: MouseEvent) {
    e.stopPropagation();
    t.columns.push('kolumna' + (t.columns.length + 1));
  }

  getCenter(id: number) {
    const t = this.tables.find(x => x.id === id)!;
    return { x: t.x + 60, y: t.y + 20 };
  }

  private toDto(): ProjectUpsertDto {
    const tables: TableDto[] = this.tables.map(t => ({
      schema: '',
      name: t.name,
      primaryKeyName: null,
      columns: t.columns.map(c => ({
        name: c,
        dataType: 'int',
        isNullable: true,
        isPrimaryKey: false,
        isIdentity: false,
        identitySeed: 1,
        identityIncrement: 1,
        defaultKind: 'None',
        isUnique: false
      })),
      foreignKeys: [],
      indexes: [],
      checkConstraints: [],
      uniqueConstraints: []
    }));
    return { name: this.name || 'Projekt', description: this.description || null, tables };
  }

  private loadDto(dto: ProjectUpsertDto) {
    this.name = dto.name;
    this.description = dto.description || '';
    this.tables = dto.tables.map(t => ({
      id: this.tableId++,
      x: 100,
      y: 100,
      name: t.name,
      columns: t.columns.map(c => c.name)
    }));
  }

  save() {
    const payload = this.toDto();
    if (this.id) {
      this.api.update(this.id, payload).subscribe(() => alert('Zapisano.'));
    } else {
      this.api.create(payload).subscribe(r => {
        this.id = r.id;
        this.router.navigate(['/projects', r.id, 'graphic']);
      });
    }
  }

  generate() {
    const go = () => {
      if (!this.id) return;
      this.api.generate(this.id).subscribe(blob => {
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = `${this.name || 'project'}.sql`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };
    if (!this.id) {
      const payload = this.toDto();
      this.api.create(payload).subscribe(r => {
        this.id = r.id;
        this.router.navigate(['/projects', r.id, 'graphic']).then(go);
      });
    } else {
      const payload = this.toDto();
      this.api.update(this.id, payload).subscribe(go);
    }
  }
}
