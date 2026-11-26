import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { TopicMaterial } from '../../common/models/syllabus.model';

const URL = '/api/materials';
const ADMIN_URL = '/api/admin/materials';

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  readonly #http = inject(HttpClient);

  getTopicMaterials(topicId: number): Observable<TopicMaterial[]> {
    return this.#http.get<TopicMaterial[]>(URL, { params: { topicId } });
  }

  uploadMaterial(topicId: number, file: File): Observable<TopicMaterial> {
    return this.#http.post<TopicMaterial>(`${ADMIN_URL}/file`, file, {
      params: { topicId, name: file.name },
      headers: { 'Content-Type': file.type },
    });
  }

  deleteMaterial(materialId: number): Observable<number> {
    return this.#http.delete<void>(`${ADMIN_URL}/${materialId}`).pipe(map(() => materialId));
  }
}
