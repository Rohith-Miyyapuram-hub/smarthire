import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../../services/jobsApi'
import { applicationsApi } from '../../services/applicationsApi'
import { aiApi } from '../../services/aiApi'

// ─── Stage configuration ─────────────────────────────────────────────────────

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected']

const STAGE_CFG = {
  Applied:   { headerBg: { background: '#f8fafc' }, headerBorder: { borderBottom: '2px solid #e2e8f0' }, dot: { background: '#94a3b8' }, badge: { bg: '#f1f5f9', color: '#475569' } },
  Screening: { headerBg: { background: '#eff6ff' }, headerBorder: { borderBottom: '2px solid #bfdbfe' }, dot: { background: '#3b82f6' }, badge: { bg: '#dbeafe', color: '#1e40af' } },
  Interview: { headerBg: { background: '#fffbeb' }, headerBorder: { borderBottom: '2px solid #fcd34d' }, dot: { background: '#f59e0b' }, badge: { bg: '#fef3c7', color: '#92400e' } },
  Offer:     { headerBg: { background: '#f0fdf4' }, headerBorder: { borderBottom: '2px solid #86efac' }, dot: { background: '#22c55e' }, badge: { bg: '#dcfce7', color: '#166534' } },
  Rejected:  { headerBg: { background: '#fef2f2' }, headerBorder: { borderBottom: '2px solid #fecaca' }, dot: { background: '#ef4444' }, badge: { bg: '#fee2e2', color: '#991b1b' } },
}

function scoreStyle(score) {
  if (!score && score !== 0) return { bg: '#f3f4f6', color: '#6b7280' }
  if (score >= 80) return { bg: '#f0fdf4', color: '#166534' }
  if (score >= 60) return { bg: '#fef3c7', color: '#92400e' }
  return { bg: '#fef2f2', color: '#991b1b' }
}

// ─── Interview Questions Panel ────────────────────────────────────────────────

function InterviewQuestions({ jobId, stage, candidateName, candidateBackground }) {
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const result = await aiApi.interviewQuestions({ jobId, stage, candidateName, candidateBackground })
      setQuestions(result.questions)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate questions. Check your OpenAI API key.')
    } finally {
      setLoading(false)
    }
  }

  const TYPE_COLORS = {
    technical:    { bg: '#eff6ff', color: '#1d4ed8' },
    behavioral:   { bg: '#fdf4ff', color: '#7e22ce' },
    situational:  { bg: '#fef3c7', color: '#92400e' },
    motivational: { bg: '#f0fdf4', color: '#166534' },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Interview questions
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {questions ? 'Regenerate' : 'Generate with AI'}
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}

      {!questions && !loading && (
        <p className="text-xs text-gray-400 italic">
          Click "Generate with AI" to get {stage}-stage questions tailored to this role.
        </p>
      )}

      {questions && (
        <div className="flex flex-col gap-2">
          {questions.map((q, i) => {
            const tc = TYPE_COLORS[q.type] || TYPE_COLORS.behavioral
            const isOpen = expanded === i
            return (
              <div
                key={i}
                className="rounded-xl border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full text-left p-3 flex items-start gap-2 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs font-bold text-gray-400 shrink-0 mt-0.5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 leading-snug">{q.question}</p>
                    <span
                      className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full capitalize"
                      style={{ background: tc.bg, color: tc.color }}
                    >
                      {q.type}
                    </span>
                  </div>
                  <svg
                    className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5 transition-transform"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <polyline points="6 9 12 15 18 9" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 flex flex-col gap-2 bg-gray-50">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-0.5">What to listen for</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{q.whatToListenFor}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-0.5">Follow-up</p>
                      <p className="text-xs text-gray-600 italic">"{q.followUp}"</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Candidate card ───────────────────────────────────────────────────────────

function CandidateCard({ app, isDragging, onDragStart, onDragEnd, onClick }) {
  const name = app.personalInfo
    ? `${app.personalInfo.firstName} ${app.personalInfo.lastName}`
    : (app.candidate?.name || 'Unknown')
  const jobTitle = app.job?.title || ''
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const cfg = STAGE_CFG[app.stage] || STAGE_CFG.Applied
  const ss = scoreStyle(app.score)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-3 cursor-grab active:cursor-grabbing select-none hover:shadow-sm transition-all"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-400 truncate">{jobTitle}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={cfg.badge}>{app.stage}</span>
        {app.score != null && (
          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.color }}>
            {app.score}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Candidate drawer ─────────────────────────────────────────────────────────

function CandidateDrawer({ app, onClose, onMoveStage }) {
  const [notes, setNotes] = useState(app?.recruiterNotes || '')
  const [notesSaved, setNotesSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const queryClient = useQueryClient()

  const { mutate: saveNotes } = useMutation({
    mutationFn: ({ id, notes: n }) => applicationsApi.saveNotes({ id, notes: n }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    },
  })

  if (!app) return null

  const name = app.personalInfo
    ? `${app.personalInfo.firstName} ${app.personalInfo.lastName}`
    : (app.candidate?.name || 'Unknown')
  const email = app.personalInfo?.email || app.candidate?.email || ''
  const cfg = STAGE_CFG[app.stage] || STAGE_CFG.Applied
  const ss = scoreStyle(app.score)
  const currentIdx = STAGES.indexOf(app.stage)
  const nextStage = STAGES[currentIdx + 1]
  const canMoveForward = nextStage && nextStage !== 'Rejected'

  const TABS = ['profile', 'questions', 'notes']

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 40 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, background: '#fff', zIndex: 50, overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold">
              {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{name}</p>
              <p className="text-xs text-gray-400 leading-tight">{email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stage + score strip */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={cfg.badge}>
            <span className="w-1.5 h-1.5 rounded-full" style={cfg.dot} />
            {app.stage}
          </span>
          {app.score != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">AI score</span>
              <span className="text-base font-bold" style={{ color: ss.color }}>{app.score}</span>
              <span className="text-xs text-gray-400">/100</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 px-5 border-b border-gray-100 shrink-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-2.5 text-xs font-medium capitalize transition-colors border-b-2"
              style={
                activeTab === tab
                  ? { color: '#4f46e5', borderColor: '#4f46e5' }
                  : { color: '#9ca3af', borderColor: 'transparent' }
              }
            >
              {tab === 'questions' ? 'AI Questions' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Profile tab */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Application details</p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Experience', value: app.personalInfo?.experience },
                    { label: 'Phone',      value: app.personalInfo?.phone      },
                    { label: 'LinkedIn',   value: app.personalInfo?.linkedin   },
                    { label: 'Portfolio',  value: app.personalInfo?.portfolio  },
                    { label: 'Source',     value: app.source                   },
                  ].filter(f => f.value).map(({ label, value }) => (
                    <div key={label} className="flex items-start gap-2 text-xs">
                      <span className="w-24 text-gray-400 shrink-0">{label}</span>
                      <span className="text-gray-700 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {app.coverLetter && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cover letter</p>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{app.coverLetter}</p>
                </div>
              )}

              {app.stageHistory && app.stageHistory.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Stage history</p>
                  <div className="flex flex-col gap-0">
                    {app.stageHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-2 h-2 rounded-full mt-0.5" style={STAGE_CFG[h.stage]?.dot || { background: '#94a3b8' }} />
                          {i < app.stageHistory.length - 1 && <div className="w-0.5 h-4 bg-gray-100 my-0.5" />}
                        </div>
                        <div className="pb-2">
                          <p className="text-xs font-medium text-gray-700">{h.stage}</p>
                          {h.note && <p className="text-xs text-gray-400">{h.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Questions tab */}
          {activeTab === 'questions' && (
            <InterviewQuestions
              jobId={app.job?._id}
              stage={app.stage}
              candidateName={name}
              candidateBackground={`Experience: ${app.personalInfo?.experience || 'unknown'}. ${app.coverLetter ? 'Has provided cover letter.' : 'No cover letter.'}`}
            />
          )}

          {/* Notes tab */}
          {activeTab === 'notes' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recruiter notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add private notes about this candidate..."
                rows={8}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => saveNotes({ id: app._id, notes })}
                className="self-start text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {notesSaved ? 'Saved!' : 'Save notes'}
              </button>
            </div>
          )}
        </div>

        {/* Move stage footer */}
        <div className="border-t border-gray-100 px-5 py-4 flex flex-col gap-2 shrink-0">
          {canMoveForward && (
            <button
              onClick={() => onMoveStage(app._id, nextStage)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              Move to {nextStage}
            </button>
          )}
          {app.stage !== 'Rejected' && (
            <button
              onClick={() => onMoveStage(app._id, 'Rejected')}
              className="w-full border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              Reject candidate
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Main Pipeline page ───────────────────────────────────────────────────────

function Pipeline() {
  const queryClient = useQueryClient()
  const [selectedJobId, setSelectedJobId] = useState('')
  const [selected, setSelected] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)

  const { data: jobs = [] } = useQuery({
    queryKey: ['recruiter-jobs'],
    queryFn: () => jobsApi.list({ status: 'active' }),
  })

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications', selectedJobId],
    queryFn: () => applicationsApi.list(selectedJobId ? { jobId: selectedJobId } : {}),
  })

  const { mutate: moveStage } = useMutation({
    mutationFn: ({ id, stage }) => applicationsApi.updateStage({ id, stage }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      if (selected && selected._id === updated._id) setSelected(updated)
    },
  })

  function handleDragStart(id) { setDraggingId(id) }
  function handleDragEnd() { setDraggingId(null); setDragOverStage(null) }
  function handleDragOver(e, stage) { e.preventDefault(); setDragOverStage(stage) }

  function handleDrop(targetStage) {
    if (!draggingId) return
    moveStage({ id: draggingId, stage: targetStage })
    setDraggingId(null)
    setDragOverStage(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Candidate Pipeline</h1>
          <p className="text-sm text-gray-400 mt-0.5">{applications.length} candidates</p>
        </div>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All jobs</option>
          {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(s => <div key={s} className="w-56 shrink-0 bg-gray-100 rounded-2xl h-64 animate-pulse" />)}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {STAGES.map((stage) => {
            const colApps = applications.filter(a => a.stage === stage)
            const cfg = STAGE_CFG[stage]
            const isOver = dragOverStage === stage

            return (
              <div
                key={stage}
                className="flex flex-col shrink-0 rounded-2xl overflow-hidden"
                style={{
                  width: 224,
                  background: isOver ? '#eef2ff' : '#f9fafb',
                  border: `2px ${isOver ? 'dashed' : 'solid'} ${isOver ? '#818cf8' : 'transparent'}`,
                  transition: 'background 150ms, border-color 150ms',
                }}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDrop={() => handleDrop(stage)}
              >
                <div className="px-3 py-2.5 flex items-center justify-between shrink-0" style={{ ...cfg.headerBg, ...cfg.headerBorder }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={cfg.dot} />
                    <span className="text-xs font-semibold text-gray-700">{stage}</span>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={cfg.badge}>
                    {colApps.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto">
                  {colApps.map(app => (
                    <CandidateCard
                      key={app._id}
                      app={app}
                      isDragging={draggingId === app._id}
                      onDragStart={() => handleDragStart(app._id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelected(app)}
                    />
                  ))}
                  {colApps.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-gray-300">
                      No candidates
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <CandidateDrawer
          app={selected}
          onClose={() => setSelected(null)}
          onMoveStage={(appId, newStage) => moveStage({ id: appId, stage: newStage })}
        />
      )}
    </div>
  )
}

export default Pipeline
