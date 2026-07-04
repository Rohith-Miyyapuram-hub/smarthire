import api from './api'

export const applicationsApi = {
  // GET /api/applications?jobId=&stage=
  list: (params = {}) =>
    api.get('/applications', { params }).then((r) => r.data.applications),

  // POST /api/applications  (multipart/form-data for resume)
  submit: (formData) =>
    api.post('/applications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.application),

  // PATCH /api/applications/:id/stage
  updateStage: ({ id, stage, note }) =>
    api.patch(`/applications/${id}/stage`, { stage, note }).then((r) => r.data.application),

  // PATCH /api/applications/:id/notes
  saveNotes: ({ id, notes }) =>
    api.patch(`/applications/${id}/notes`, { notes }).then((r) => r.data.application),
}
