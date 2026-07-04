import api from './api'

// Jobs API functions — used with TanStack Query
// Each function maps to one API endpoint

export const jobsApi = {
  // GET /api/jobs?search=&department=&type=&status=
  list: (params = {}) =>
    api.get('/jobs', { params }).then((r) => r.data.jobs),

  // GET /api/jobs/:id
  get: (id) =>
    api.get(`/jobs/${id}`).then((r) => r.data.job),

  // POST /api/jobs  (recruiter)
  create: (data) =>
    api.post('/jobs', data).then((r) => r.data.job),

  // PATCH /api/jobs/:id  (recruiter)
  update: ({ id, ...data }) =>
    api.patch(`/jobs/${id}`, data).then((r) => r.data.job),

  // DELETE /api/jobs/:id  (recruiter)
  remove: (id) =>
    api.delete(`/jobs/${id}`).then((r) => r.data),
}
