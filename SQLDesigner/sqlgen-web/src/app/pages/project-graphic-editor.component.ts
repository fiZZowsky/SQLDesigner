import {
  Component,
  OnInit,
  inject,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
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

interface GColumn {
  name: string;
  type: string;
}

interface GTable {
  id: number;
  x: number;
  y: number;
  name: string;
  columns: GColumn[];
}

interface FkLink {
  from: { t: number; c: number };
  to: { t: number; c: number };
  type: string;
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
      <div class="table-list">
        <h3>Tables</h3>
        <ul>
          <li *ngFor="let t of tables" (click)="selectTable(t, $event)">{{ t.name }}</li>
        </ul>
        <button mat-stroked-button (click)="addTable()">Add table</button>
      </div>

<div class="canvas" #canvas (click)="canvasClick($event)">
        <svg class="relations">
          <line *ngFor="let fk of fks; let i = index"
            [attr.x1]="getColCenter(fk.from).x" [attr.y1]="getColCenter(fk.from).y"
            [attr.x2]="getColCenter(fk.to).x" [attr.y2]="getColCenter(fk.to).y"
            class="fk-line" [class.selected]="selectedFkIndex===i" (click)="selectFk(i, $event)"></line>
        </svg>
        <div class="table" *ngFor="let t of tables"
             [attr.data-id]="t.id"
             [style.left.px]="t.x" [style.top.px]="t.y"
             (click)="selectTable(t, $event)"
             (mousedown)="startDrag(t, $event)">
          <div class="table-header">{{ t.name }}</div>
          <div class="column" *ngFor="let c of t.columns; let i = index"
               (click)="selectColumn(t, c, $event)"
               (mousedown)="$event.stopPropagation()"
               [class.selected]="selectedColumn?.table===t && selectedColumn?.column===c">
            {{ c.name }}: {{ c.type }}
          </div>
          <button mat-mini-button (click)="addColumn(t, $event)"><mat-icon>add</mat-icon></button>
        </div>
      </div>

        <div class="props" *ngIf="selected || selectedColumn || selectedFkIndex!==null">
        <ng-container *ngIf="selected">
          <h3>Właściwości tabeli</h3>
          <label>Nazwa:
            <input [(ngModel)]="selected.name">
          </label>
        </ng-container>

        <ng-container *ngIf="selectedColumn && !selected && selectedFkIndex===null">
          <h3>Właściwości kolumny</h3>
          <label>Nazwa:
            <input [(ngModel)]="selectedColumn.column.name">
          </label>
          <label>Typ:
            <input [(ngModel)]="selectedColumn.column.type">
          </label>
          <div *ngIf="!relationForm">
            <button mat-stroked-button type="button" (click)="startAddFk()">Dodaj relację</button>
          </div>
          <div *ngIf="relationForm">
            <label>Tabela docelowa:
              <select [(ngModel)]="relationForm.toTableId" (ngModelChange)="relationForm.toColumnIdx=null">
                <option [ngValue]="null">-- wybierz --</option>
                <option *ngFor="let t of tables" [ngValue]="t.id" [disabled]="t===selectedColumn.table">{{t.name}}</option>
              </select>
            </label>
            <label>Kolumna docelowa:
              <select [(ngModel)]="relationForm.toColumnIdx">
                <option [ngValue]="null">-- wybierz --</option>
                <option *ngFor="let c of getTableById(relationForm.toTableId)?.columns; let i=index" [ngValue]="i">{{c.name}}</option>
              </select>
            </label>
            <label>Typ relacji:
              <select [(ngModel)]="relationForm.type">
                <option value="1:1">1 do 1</option>
                <option value="1:N">1 do N</option>
                <option value="N:1">N do 1</option>
                <option value="N:N">N do N</option>
              </select>
            </label>
            <button mat-raised-button color="primary" type="button" (click)="confirmAddFk()">Dodaj</button>
            <button mat-button type="button" (click)="relationForm=null">Anuluj</button>
          </div>
        </ng-container>

        <ng-container *ngIf="selectedFkIndex!==null && !selected && !selectedColumn">
          <h3>Właściwości relacji</h3>
          <div>Kolumna źródłowa: {{ getTableById(fks[selectedFkIndex].from.t)?.name }}.{{ getColumnName(fks[selectedFkIndex].from) }}</div>
          <label>Tabela docelowa:
            <select [(ngModel)]="fks[selectedFkIndex].to.t" (ngModelChange)="onFkChange()">
              <option *ngFor="let t of tables" [ngValue]="t.id">{{t.name}}</option>
            </select>
          </label>
          <label>Kolumna docelowa:
            <select [(ngModel)]="fks[selectedFkIndex].to.c" (ngModelChange)="onFkChange()">
              <option *ngFor="let c of getTableById(fks[selectedFkIndex].to.t)?.columns; let i=index" [ngValue]="i">{{c.name}}</option>
            </select>
          </label>
          <label>Typ relacji:
            <select [(ngModel)]="fks[selectedFkIndex].type">
              <option value="1:1">1 do 1</option>
              <option value="1:N">1 do N</option>
              <option value="N:1">N do 1</option>
              <option value="N:N">N do N</option>
            </select>
          </label>
          <button mat-stroked-button color="warn" type="button" (click)="removeFk(selectedFkIndex)">Usuń relację</button>
        </ng-container>
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
.table-list { width:200px; border-right:1px solid #ccc; padding:8px; }
    .table-list ul { list-style:none; padding:0; margin:0 0 8px 0; }
    .table-list li { cursor:pointer; padding:4px 0; }
    .table-list li:hover { background:#eee; }
    .canvas { flex:1; position:relative; user-select:none; background-size:20px 20px; background-image:linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px); }
    .table { position:absolute; border:1px solid #555; background:#fff; padding:4px; cursor:move; user-select:none; }
    .table-header { font-weight:bold; }
    .table button { margin-top:4px; }
    .column.selected { background:#def; }
    .props { width:200px; border-left:1px solid #ccc; padding:8px; }
    .relations { position:absolute; width:100%; height:100%; pointer-events:none; }
    .fk-line { stroke:#555; stroke-width:2; pointer-events:stroke; }
    .fk-line.selected { stroke:#d00; }
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
  fks: FkLink[] = [];
  private tableId = 1;
  selected: GTable | null = null;
  selectedColumn: { table: GTable; column: GColumn } | null = null;
  selectedFkIndex: number | null = null;
  relationForm: { toTableId: number | null; toColumnIdx: number | null; type: string } | null = null;
  originalFk: FkLink | null = null;
  dragging: GTable | null = null;
  dragOffsetX = 0;
  dragOffsetY = 0;

  canvasRect: DOMRect | null = null;
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLDivElement>;

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
    this.selected = null;
    this.selectedColumn = null;
    this.selectedFkIndex = null;
    this.relationForm = null;
  }

  addTable() {
    const offset = this.tables.length * 40;
    this.addTableAt(100 + offset, 100 + offset);
  }

  addTableAt(x: number, y: number) {
    this.tables.push({ id: this.tableId++, x, y, name: 'Tabela' + this.tableId, columns: [] });
  }

  startDrag(t: GTable, e: MouseEvent) {
    e.stopPropagation();
    this.dragging = t;
    this.dragOffsetX = e.offsetX;
    this.dragOffsetY = e.offsetY;
    const canvasEl = this.canvas?.nativeElement;
    this.canvasRect = canvasEl.getBoundingClientRect();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.dragging || !this.canvasRect) return;
    this.dragging.x = e.clientX - this.canvasRect.left - this.dragOffsetX;
    this.dragging.y = e.clientY - this.canvasRect.top - this.dragOffsetY;
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.dragging = null;
  }

  selectTable(t: GTable, e: MouseEvent) {
    e.stopPropagation();
    this.selected = t;
    this.selectedColumn = null;
    this.selectedFkIndex = null;
    this.relationForm = null;
  }

  selectColumn(t: GTable, c: GColumn, e: MouseEvent) {
    e.stopPropagation();
    this.selectedColumn = { table: t, column: c };
    this.selected = null;
    this.selectedFkIndex = null;
    this.relationForm = null;
  }

  startAddFk() {
    this.relationForm = { toTableId: null, toColumnIdx: null, type: '1:N' };
  }

  confirmAddFk() {
    if (!this.selectedColumn || !this.relationForm) return;
    const fromTable = this.selectedColumn.table.id;
    const fromIdx = this.selectedColumn.table.columns.indexOf(this.selectedColumn.column);
    const toTableId = this.relationForm.toTableId;
    const toColumnIdx = this.relationForm.toColumnIdx;
    if (toTableId === null || toColumnIdx === null) return;
    const exists = this.fks.some(f => f.from.t === fromTable && f.from.c === fromIdx && f.to.t === toTableId && f.to.c === toColumnIdx);
    if (!exists) {
      this.fks.push({ from: { t: fromTable, c: fromIdx }, to: { t: toTableId, c: toColumnIdx }, type: this.relationForm.type });
    }
    this.relationForm = null;
  }

  selectFk(i: number, e: MouseEvent) {
    e.stopPropagation();
    this.selectedFkIndex = i;
    this.selected = null;
    this.selectedColumn = null;
    this.relationForm = null;
    this.originalFk = JSON.parse(JSON.stringify(this.fks[i]));
  }

  removeFk(i: number) {
    this.fks.splice(i, 1);
    this.selectedFkIndex = null;
  }

  onFkChange() {
    if (this.selectedFkIndex === null) return;
    const fk = this.fks[this.selectedFkIndex];
    const duplicate = this.fks.some((f, idx) => idx !== this.selectedFkIndex && f.from.t === fk.from.t && f.from.c === fk.from.c && f.to.t === fk.to.t && f.to.c === fk.to.c);
    if (duplicate && this.originalFk) {
      Object.assign(fk.to, this.originalFk.to);
    } else if (this.originalFk) {
      this.originalFk = JSON.parse(JSON.stringify(fk));
    }
  }

  addColumn(t: GTable, e: MouseEvent) {
    e.stopPropagation();
    t.columns.push({ name: 'kolumna' + (t.columns.length + 1), type: 'int' });
  }

getTableById(id: number | null | undefined) {
    return this.tables.find(tt => tt.id === id);
  }

  getColumnName(ref: { t: number; c: number }) {
    return this.getTableById(ref.t)?.columns[ref.c]?.name;
  }

  getColCenter(ref: { t: number; c: number }) {
    const canvasEl = this.canvas.nativeElement;
    const tableEl = canvasEl.querySelector(`.table[data-id='${ref.t}']`);
    if (!tableEl) return { x: 0, y: 0 };
    const cols = tableEl.querySelectorAll('.column');
    const colEl = cols[ref.c] as HTMLElement | undefined;
    if (!colEl) return { x: 0, y: 0 };
    const canvasRect = canvasEl.getBoundingClientRect();
    const rect = colEl.getBoundingClientRect();
    return { x: rect.left - canvasRect.left + rect.width / 2, y: rect.top - canvasRect.top + rect.height / 2 };
  }

  private toDto(): ProjectUpsertDto {
    const tables: TableDto[] = this.tables.map(t => {
      const tableFks = this.fks
        .filter(f => f.from.t === t.id)
        .map(f => ({
          name: null,
          refSchema: '',
          refTable: this.tables.find(tt => tt.id === f.to.t)?.name || '',
          columns: [
            {
              columnName: t.columns[f.from.c].name,
              refColumnName:
                this.tables.find(tt => tt.id === f.to.t)?.columns[f.to.c].name || '',
            },
          ],
        }));
      return {
        schema: '',
        name: t.name,
        primaryKeyName: null,
        columns: t.columns.map(c => ({
          name: c.name,
          dataType: c.type,
          isNullable: true,
          isPrimaryKey: false,
          isIdentity: false,
          identitySeed: 1,
          identityIncrement: 1,
          defaultKind: 'None',
          isUnique: false,
        })),
        foreignKeys: tableFks,
        indexes: [],
        checkConstraints: [],
        uniqueConstraints: [],
      };
    });
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
      columns: t.columns.map(c => ({ name: c.name, type: c.dataType })),
    }));
    this.fks = [];
    dto.tables.forEach((t, idx) => {
      const fromTable = this.tables[idx];
      t.foreignKeys.forEach(fk => {
        const toTable = this.tables.find(tt => tt.name === fk.refTable);
        if (!toTable) return;
        fk.columns.forEach(col => {
          const fromIdx = fromTable.columns.findIndex(c => c.name === col.columnName);
          const toIdx = toTable.columns.findIndex(c => c.name === col.refColumnName);
          if (fromIdx >= 0 && toIdx >= 0) {
            this.fks.push({ from: { t: fromTable.id, c: fromIdx }, to: { t: toTable.id, c: toIdx }, type: '1:N' });
          }
        });
      });
    });
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
