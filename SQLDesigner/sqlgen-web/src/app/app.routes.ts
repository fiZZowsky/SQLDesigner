import { Routes } from '@angular/router';
import { ProjectListComponent } from './pages/project-list.component';
import { ProjectEditorComponent } from './pages/project-editor.component';

export const routes: Routes = [
    { path: '', component: ProjectListComponent },
    { path: 'projects/new', component: ProjectEditorComponent },
    { path: 'projects/:id', component: ProjectEditorComponent },
    { path: '**', redirectTo: '' }
];
