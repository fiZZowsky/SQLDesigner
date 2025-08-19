import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectsApi } from '../services/projects.api';
import { ProjectUpsertDto, TableDto } from '../models';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TableEditorComponent, buildEmptyTable } from '../widgets/table-editor.component';

@Component({
  standalone: true,
  selector: 'app-project-editor',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatIconModule,
    TableEditorComponent
  ],
  template: `
    <form [formGroup]="form">
      <div class="header">
        <h2>{{ isNew() ? 'Nowy projekt' : 'Edycja projektu' }}</h2>
        <span class="spacer"></span>
        <button mat-stroked-button type="button" (click)="save()">Zapisz</button>
        <button mat-raised-button color="primary" type="button" (click)="generate()">Generuj SQL</button>
      </div>

      <mat-card>
        <div class="row">
          <mat-form-field class="w-300">
            <mat-label>Nazwa projektu</mat-label>
            <input matInput [formControl]="form.controls['name']" required>
          </mat-form-field>

          <mat-form-field class="grow">
            <mat-label>Opis</mat-label>
            <input matInput [formControl]="form.controls['description']">
          </mat-form-field>
        </div>
      </mat-card>

      <div class="tables-header">
        <h3>Tabele</h3>
        <button mat-stroked-button color="primary" type="button" (click)="addTable()">
          <mat-icon>add</mat-icon> Dodaj tabelę
        </button>
      </div>

      <ng-container formArrayName="tables">
        <app-table-editor
          *ngFor="let t of tables.controls; let i = index"
          [group]="t"
          (remove)="removeTable(i)">
        </app-table-editor>
      </ng-container>
    </form>
  `,
  styles: [`
    .header { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .spacer { flex: 1 1 auto; }
    .row { display:flex; gap:12px; flex-wrap:wrap; }
    .w-300 { width:300px; }
    .grow { flex:1 1 auto; min-width: 240px; }
    .tables-header { display:flex; align-items:center; gap:12px; margin:16px 0 8px; }
  `]
})
export class ProjectEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ProjectsApi);

  id: number | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    tables: this.fb.array<FormGroup>([])
  });

  isNew = signal(true);
  get tables() { return this.form.controls['tables'] as FormArray; }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isNew.set(!idParam);
    if (idParam) {
      this.id = Number(idParam);
      this.api.get(this.id).subscribe(dto => this.loadDto(dto));
    } else {
      this.addTable();
    }
  }

  addTable() { this.tables.push(buildEmptyTable(this.fb)); }
  removeTable(i: number) { this.tables.removeAt(i); }

  private toDto(): ProjectUpsertDto {
    const raw = this.form.getRawValue();
    const tables: TableDto[] = (raw.tables ?? []).map((t: any) => ({
      schema: t.schema, name: t.name, primaryKeyName: t.primaryKeyName || null,
      columns: t.columns, foreignKeys: t.foreignKeys, indexes: t.indexes,
      checkConstraints: t.checkConstraints, uniqueConstraints: t.uniqueConstraints
    }));
    return { name: raw.name!, description: raw.description || null, tables };
  }

  private loadDto(dto: ProjectUpsertDto) {
    this.form.controls['name'].setValue(dto.name);
    this.form.controls['description'].setValue(dto.description ?? '');
    this.tables.clear();
    for (const t of dto.tables) {
      const g = buildEmptyTable(this.fb);
      g.patchValue(t);
      g.controls['columns'].setValue(t.columns ?? []);
      g.controls['foreignKeys'].setValue(t.foreignKeys ?? []);
      g.controls['indexes'].setValue(t.indexes ?? []);
      g.controls['checkConstraints'].setValue(t.checkConstraints ?? []);
      g.controls['uniqueConstraints'].setValue(t.uniqueConstraints ?? []);
      this.tables.push(g);
    }
  }

  save() {
    const payload = this.toDto();
    if (this.isNew()) {
      this.api.create(payload).subscribe(r => this.router.navigate(['/projects', r.id]));
    } else {
      this.api.update(this.id!, payload).subscribe(() => alert('Zapisano.'));
    }
  }

  generate() {
    const go = () => {
      if (this.id == null) return;
      this.api.generate(this.id).subscribe(blob => {
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = `${this.form.controls['name'].value || 'project'}.sql`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };
    if (this.isNew()) {
      const payload = this.toDto();
      this.api.create(payload).subscribe(r => {
        this.id = r.id; this.isNew.set(false);
        this.router.navigate(['/projects', r.id]).then(go);
      });
    } else {
      const payload = this.toDto();
      this.api.update(this.id!, payload).subscribe(go);
    }
  }
}
