import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

export function buildEmptyTable(fb: FormBuilder): FormGroup {
  return fb.group({
    schema: ['dbo'],
    name: [''],
    primaryKeyName: [''],
    columns: fb.control([] as any[]),
    foreignKeys: fb.control([] as any[]),
    indexes: fb.control([] as any[]),
    checkConstraints: fb.control([] as any[]),
    uniqueConstraints: fb.control([] as any[]),
  });
}

@Component({
  standalone: true,
  selector: 'app-table-editor',
imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DragDropModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatCheckboxModule, MatIconModule
  ],
  template: `
  <mat-card class="table-card" [formGroup]="group">
    <div class="table-header">
      <div class="row">
        <mat-form-field class="w-160">
          <mat-label>Schema</mat-label>
          <input matInput formControlName="schema">
        </mat-form-field>
        <mat-form-field class="w-240">
          <mat-label>Nazwa tabeli</mat-label>
          <input matInput formControlName="name" required>
        </mat-form-field>
        <mat-form-field class="grow">
          <mat-label>Nazwa PK (opcjonalnie)</mat-label>
          <input matInput formControlName="primaryKeyName">
        </mat-form-field>
      </div>
      <button mat-icon-button color="warn" (click)="remove.emit()" title="Usuń tabelę">
        <mat-icon>delete</mat-icon>
      </button>
    </div>

    <!-- KOLUMNY -->
    <section>
      <div class="section-header">
        <h4>Kolumny</h4>
        <button mat-stroked-button (click)="addColumn()"><mat-icon>add</mat-icon> Kolumna</button>
      </div>

      <div cdkDropList (cdkDropListDropped)="reorderColumn($event)">
        <div class="column-card" *ngFor="let c of columns; let i = index" cdkDrag>
          <div class="row">
            <mat-form-field class="w-200">
              <mat-label>Nazwa</mat-label>
              <input matInput [(ngModel)]="c.name" required>
            </mat-form-field>

            <mat-form-field class="w-180">
              <mat-label>Typ</mat-label>
              <mat-select [(ngModel)]="c.dataType">
                <mat-option *ngFor="let t of dataTypes" [value]="t">{{t}}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field class="w-120" *ngIf="hasLength(c.dataType)">
              <mat-label>Długość</mat-label>
              <input matInput type="number" [(ngModel)]="c.length">
            </mat-form-field>

            <mat-form-field class="w-120" *ngIf="hasPrecScale(c.dataType)">
              <mat-label>Precision</mat-label>
              <input matInput type="number" [(ngModel)]="c.precision">
            </mat-form-field>

            <mat-form-field class="w-120" *ngIf="hasPrecScale(c.dataType)">
              <mat-label>Scale</mat-label>
              <input matInput type="number" [(ngModel)]="c.scale">
            </mat-form-field>
          </div>

          <div class="row">
            <mat-checkbox [(ngModel)]="c.isNullable">NULL</mat-checkbox>
            <mat-checkbox [(ngModel)]="c.isPrimaryKey">PK</mat-checkbox>
            <mat-form-field class="w-120" *ngIf="c.isPrimaryKey">
              <mat-label>PK order</mat-label>
              <input matInput type="number" [(ngModel)]="c.primaryKeyOrder">
            </mat-form-field>

            <mat-checkbox [(ngModel)]="c.isIdentity">IDENTITY</mat-checkbox>
            <mat-form-field class="w-120" *ngIf="c.isIdentity">
              <mat-label>Seed</mat-label>
              <input matInput type="number" [(ngModel)]="c.identitySeed">
            </mat-form-field>
            <mat-form-field class="w-120" *ngIf="c.isIdentity">
              <mat-label>Increment</mat-label>
              <input matInput type="number" [(ngModel)]="c.identityIncrement">
            </mat-form-field>

            <mat-checkbox [(ngModel)]="c.isUnique">UNIQUE</mat-checkbox>
          </div>

          <div class="row">
            <mat-form-field class="grow">
              <mat-label>DEFAULT</mat-label>
              <input matInput [(ngModel)]="c.defaultSql" placeholder="np. GETDATE() lub 'abc'">
            </mat-form-field>
            <mat-form-field class="w-220">
              <mat-label>Rodzaj default</mat-label>
              <mat-select [(ngModel)]="c.defaultKind">
                <mat-option value="None">None</mat-option>
                <mat-option value="RawExpression">RawExpression</mat-option>
                <mat-option value="Literal">Literal</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-icon-button color="warn" (click)="removeColumn(i)" title="Usuń kolumnę">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- UNIQUE (multi) -->
    <section>
      <div class="section-header">
        <h4>UNIQUE (wielokolumnowe)</h4>
        <button mat-stroked-button (click)="addUnique()"><mat-icon>add</mat-icon> UNIQUE</button>
      </div>
      <div class="mini-row" *ngFor="let u of uniqueConstraints; let ui = index">
        <mat-form-field class="w-240">
          <mat-label>Nazwa (opcjonalnie)</mat-label>
          <input matInput [(ngModel)]="u.name">
        </mat-form-field>
        <mat-form-field class="grow">
          <mat-label>Kolumny (CSV)</mat-label>
          <input matInput [(ngModel)]="u.columnsCsv" placeholder="np. ColA, ColB">
        </mat-form-field>
        <button mat-icon-button color="warn" (click)="removeUnique(ui)" title="Usuń">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </section>

    <!-- CHECK -->
    <section>
      <div class="section-header">
        <h4>CHECK</h4>
        <button mat-stroked-button (click)="addCheck()"><mat-icon>add</mat-icon> CHECK</button>
      </div>
      <div class="mini-row" *ngFor="let c of checkConstraints; let ci = index">
        <mat-form-field class="w-240">
          <mat-label>Nazwa (opcjonalnie)</mat-label>
          <input matInput [(ngModel)]="c.name">
        </mat-form-field>
        <mat-form-field class="grow">
          <mat-label>Wyrażenie</mat-label>
          <input matInput [(ngModel)]="c.expression" placeholder="np. Total >= 0">
        </mat-form-field>
        <button mat-icon-button color="warn" (click)="removeCheck(ci)">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </section>

    <!-- INDEKSY -->
    <section>
      <div class="section-header">
        <h4>Indeksy</h4>
        <button mat-stroked-button (click)="addIndex()"><mat-icon>add</mat-icon> Indeks</button>
      </div>
      <div class="index-card" *ngFor="let i of indexes; let ii = index">
        <div class="row">
          <mat-form-field class="w-240">
            <mat-label>Nazwa (opcjonalnie)</mat-label>
            <input matInput [(ngModel)]="i.name">
          </mat-form-field>
          <mat-checkbox [(ngModel)]="i.isUnique">UNIQUE</mat-checkbox>
          <mat-form-field class="grow">
            <mat-label>INCLUDE (CSV)</mat-label>
            <input matInput [(ngModel)]="i.includeColumnsCsv" placeholder="np. Total, Note">
          </mat-form-field>
          <button mat-icon-button color="warn" (click)="removeIndex(ii)">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
        <div class="mini-row" *ngFor="let c of i.columns; let ci = index">
          <mat-form-field class="w-240">
            <mat-label>Kolumna</mat-label>
            <input matInput [(ngModel)]="c.columnName">
          </mat-form-field>
          <mat-checkbox [(ngModel)]="c.descending">DESC</mat-checkbox>
          <button mat-button (click)="removeIndexColumn(ii, ci)"><mat-icon>remove</mat-icon>Kolumna</button>
        </div>
        <button mat-stroked-button (click)="addIndexColumn(ii)">
          <mat-icon>add</mat-icon> Kolumna indeksu
        </button>
      </div>
    </section>

    <!-- FOREIGN KEYS -->
    <section>
      <div class="section-header">
        <h4>Relacje (FK)</h4>
        <button mat-stroked-button (click)="addFk()"><mat-icon>add</mat-icon> FK</button>
      </div>
      <div class="fk-card" *ngFor="let f of foreignKeys; let fi = index">
        <div class="row">
          <mat-form-field class="w-240">
            <mat-label>Nazwa (opcjonalnie)</mat-label>
            <input matInput [(ngModel)]="f.name">
          </mat-form-field>
          <mat-form-field class="w-140">
            <mat-label>Ref. schema</mat-label>
            <input matInput [(ngModel)]="f.refSchema">
          </mat-form-field>
          <mat-form-field class="w-220">
            <mat-label>Ref. tabela</mat-label>
            <input matInput [(ngModel)]="f.refTable">
          </mat-form-field>
          <mat-form-field class="w-180">
            <mat-label>ON DELETE</mat-label>
            <mat-select [(ngModel)]="f.onDeleteAction">
              <mat-option [value]="null">brak</mat-option>
              <mat-option value="CASCADE">CASCADE</mat-option>
              <mat-option value="SET NULL">SET NULL</mat-option>
              <mat-option value="SET DEFAULT">SET DEFAULT</mat-option>
              <mat-option value="NO ACTION">NO ACTION</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-icon-button color="warn" (click)="removeFk(fi)"><mat-icon>delete</mat-icon></button>
        </div>

        <div class="mini-row" *ngFor="let c of f.columns; let ci = index">
          <mat-form-field class="w-240">
            <mat-label>Kolumna</mat-label>
            <input matInput [(ngModel)]="c.columnName">
          </mat-form-field>
          <mat-form-field class="w-240">
            <mat-label>Ref. kolumna</mat-label>
            <input matInput [(ngModel)]="c.refColumnName">
          </mat-form-field>
          <button mat-button (click)="removeFkColumn(fi, ci)"><mat-icon>remove</mat-icon>Kolumna</button>
        </div>

        <button mat-stroked-button (click)="addFkColumn(fi)">
          <mat-icon>add</mat-icon> Kolumna relacji
        </button>
      </div>
    </section>
  </mat-card>
  `,
  styles: [`
    .table-card { margin: 12px 0; padding: 12px; }
    .table-header { display:flex; gap:8px; align-items:flex-start; justify-content:space-between; }
    .row { display:flex; gap:12px; align-items:center; flex-wrap: wrap; }
    .mini-row { display:flex; gap:12px; align-items:center; margin: 4px 0; flex-wrap: wrap; }
    .w-160{width:160px} .w-180{width:180px} .w-200{width:200px} .w-220{width:220px} .w-240{width:240px}
    .w-120{width:120px}
    .grow { flex:1 1 auto; min-width:240px; }
    .section-header { display:flex; align-items:center; justify-content:space-between; margin-top:10px; }
    .column-card, .index-card, .fk-card { border:1px solid rgba(0,0,0,0.12); border-radius:8px; padding:10px; margin:8px 0; }
  `]
})
export class TableEditorComponent {
  @Input({ required: true }) group!: any;
  @Output() remove = new EventEmitter<void>();

  dataTypes = ['int','bigint','smallint','tinyint','bit',
    'nvarchar','varchar','nchar','char','varbinary',
    'decimal','numeric',
    'datetime2','datetime','smalldatetime','date','time','datetimeoffset',
    'uniqueidentifier','float','real','money','smallmoney','xml'];

  get columns(): any[] { return this.group.controls['columns'].value || []; }
  set columns(v: any[]) { this.group.controls['columns'].setValue(v); this.group.markAsDirty(); }

  get indexes(): any[] { return this.group.controls['indexes'].value || []; }
  set indexes(v: any[]) { this.group.controls['indexes'].setValue(v); this.group.markAsDirty(); }

  get checkConstraints(): any[] { return this.group.controls['checkConstraints'].value || []; }
  set checkConstraints(v: any[]) { this.group.controls['checkConstraints'].setValue(v); this.group.markAsDirty(); }

  get uniqueConstraints(): any[] { return this.group.controls['uniqueConstraints'].value || []; }
  set uniqueConstraints(v: any[]) { this.group.controls['uniqueConstraints'].setValue(v); this.group.markAsDirty(); }

  get foreignKeys(): any[] { return this.group.controls['foreignKeys'].value || []; }
  set foreignKeys(v: any[]) { this.group.controls['foreignKeys'].setValue(v); this.group.markAsDirty(); }

  addColumn() {
    const c = { name:'', dataType:'int', length:null, precision:null, scale:null,
      isNullable:false, isPrimaryKey:false, primaryKeyOrder:null,
      isIdentity:false, identitySeed:1, identityIncrement:1,
      defaultSql:null, defaultKind:'None', isUnique:false };
    this.columns = [...this.columns, c];
  }
  removeColumn(i: number) { const next=[...this.columns]; next.splice(i,1); this.columns = next; }
  reorderColumn(e: any) { const arr=[...this.columns]; moveItemInArray(arr, e.previousIndex, e.currentIndex); this.columns = arr; }

  addUnique() { this.uniqueConstraints = [...this.uniqueConstraints, { name: '', columnsCsv: '' }]; }
  removeUnique(i: number) { const a=[...this.uniqueConstraints]; a.splice(i,1); this.uniqueConstraints = a; }

  addCheck() { this.checkConstraints = [...this.checkConstraints, { name: '', expression: '' }]; }
  removeCheck(i: number) { const a=[...this.checkConstraints]; a.splice(i,1); this.checkConstraints = a; }

  addIndex() { this.indexes = [...this.indexes, { name: '', isUnique: false, includeColumnsCsv: '', columns: [] }]; }
  removeIndex(i: number) { const a=[...this.indexes]; a.splice(i,1); this.indexes = a; }
  addIndexColumn(i: number) { const a=[...this.indexes]; a[i] = { ...a[i], columns: [...a[i].columns, { columnName:'', descending:false }] }; this.indexes = a; }
  removeIndexColumn(i: number, ci: number) { const a=[...this.indexes]; const cols=[...a[i].columns]; cols.splice(ci,1); a[i]={...a[i],columns:cols}; this.indexes = a; }

  addFk() { this.foreignKeys = [...this.foreignKeys, { name:'', refSchema:'dbo', refTable:'', onDeleteAction:null, columns:[] }]; }
  removeFk(i: number) { const a=[...this.foreignKeys]; a.splice(i,1); this.foreignKeys = a; }
  addFkColumn(i: number) { const a=[...this.foreignKeys]; a[i]={...a[i],columns:[...a[i].columns,{columnName:'',refColumnName:''}]}; this.foreignKeys = a; }
  removeFkColumn(i: number, ci: number) { const a=[...this.foreignKeys]; const cols=[...a[i].columns]; cols.splice(ci,1); a[i]={...a[i],columns:cols}; this.foreignKeys = a; }

  hasLength(dt: string) { return ['varchar','nvarchar','char','nchar','varbinary'].includes((dt||'').toLowerCase()); }
  hasPrecScale(dt: string) { return ['decimal','numeric'].includes((dt||'').toLowerCase()); }
}
