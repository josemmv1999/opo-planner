export interface MaterialRow {
  id: number;
  topic_id: number;
  title: string;
  file_name: string;
  mime_type: string;
  uploaded_at: string;
}

export const toMaterial = (row: MaterialRow) => ({
  id: row.id,
  topicId: row.topic_id,
  title: row.title,
  uploadedAt: row.uploaded_at,
  fileUrl: `/api/materials/${row.id}/file`,
});
