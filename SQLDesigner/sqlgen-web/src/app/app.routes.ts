import { Routes } from '@angular/router';
import { ProjectListComponent } from './pages/project-list.component';
import { ProjectEditorComponent } from './pages/project-editor.component';
import { ProjectEditorChoiceComponent } from './pages/project-editor-choice.component';
import { ProjectGraphicEditorComponent } from './pages/project-graphic-editor.component';

export const routes: Routes = [
  { path: '', component: ProjectListComponent },
  { path: 'projects/new/text', component: ProjectEditorComponent },
  { path: 'projects/new/graphic', component: ProjectGraphicEditorComponent },
  { path: 'projects/new', component: ProjectEditorChoiceComponent },
  { path: 'projects/:id/text', component: ProjectEditorComponent },
  { path: 'projects/:id/graphic', component: ProjectGraphicEditorComponent },
  { path: 'projects/:id', component: ProjectEditorChoiceComponent },
  { path: '**', redirectTo: '' }
];