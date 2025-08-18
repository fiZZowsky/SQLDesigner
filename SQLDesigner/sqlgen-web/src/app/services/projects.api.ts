import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  IdResponse, ProjectListItemDto, ProjectUpsertDto
} from '../models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectsApi {
  constructor(private http: HttpClient) {}

  list(): Observable<ProjectListItemDto[]> {
    return this.http.get<ProjectListItemDto[]>('/api/projects');
  }

  get(id: number): Observable<ProjectUpsertDto> {
    return this.http.get<ProjectUpsertDto>(`/api/projects/${id}`);
  }

  create(payload: ProjectUpsertDto): Observable<IdResponse> {
    return this.http.post<IdResponse>('/api/projects', payload);
  }

  update(id: number, payload: ProjectUpsertDto): Observable<void> {
    return this.http.put<void>(`/api/projects/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/projects/${id}`);
  }

  generate(id: number): Observable<Blob> {
    return this.http.post(`/api/projects/${id}/generate`, {}, { responseType: 'blob' as const });
  }
}
