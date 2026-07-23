import { useState, useEffect, useRef } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English']
const MONTHS = ['July 2026', 'August 2026', 'September 2026', 'October 2026']
const FACULTY_OPTIONS = ['All Faculty', 'Mr. Sharma', 'Ms. Patel', 'Dr. Kapoor', 'Ms. Verma']

const SCHEDULE_DATA = {
  Mathematics: [
    { topic: 'Quadratic Equations', days: 4, start: '05 Jul', end: '08 Jul', faculty: 'Mr. Sharma', completion: 100, status: 'Completed' },
    { topic: 'Sequence & Series', days: 5, start: '09 Jul', end: '13 Jul', faculty: 'Mr. Sharma', completion: 60, status: 'In Progress' },
    { topic: 'Binomial Theorem', days: 6, start: '14 Jul', end: '19 Jul', faculty: 'Mr. Sharma', completion: 0, status: 'Pending' },
    { topic: 'Permutations & Combinations', days: 5, start: '20 Jul', end: '24 Jul', faculty: 'Mr. Sharma', completion: 0, status: 'Pending' },
    { topic: 'Probability', days: 4, start: '25 Jul', end: '28 Jul', faculty: 'Mr. Sharma', completion: 0, status: 'Pending' },
    { topic: 'Matrices & Determinants', days: 5, start: '29 Jul', end: '02 Aug', faculty: 'Mr. Sharma', completion: 0, status: 'Pending' },
  ],
  Physics: [
    { topic: 'Laws of Motion', days: 5, start: '01 Jul', end: '05 Jul', faculty: 'Dr. Kapoor', completion: 100, status: 'Completed' },
    { topic: 'Work, Energy & Power', days: 4, start: '06 Jul', end: '09 Jul', faculty: 'Dr. Kapoor', completion: 100, status: 'Completed' },
    { topic: 'Rotational Motion', days: 6, start: '10 Jul', end: '15 Jul', faculty: 'Dr. Kapoor', completion: 45, status: 'In Progress' },
    { topic: 'Gravitation', days: 4, start: '16 Jul', end: '19 Jul', faculty: 'Dr. Kapoor', completion: 0, status: 'Pending' },
    { topic: 'Oscillations & Waves', days: 5, start: '20 Jul', end: '24 Jul', faculty: 'Dr. Kapoor', completion: 0, status: 'Pending' },
  ],
  Chemistry: [
    { topic: 'Atomic Structure', days: 4, start: '01 Jul', end: '04 Jul', faculty: 'Ms. Patel', completion: 100, status: 'Completed' },
    { topic: 'Chemical Bonding', days: 5, start: '05 Jul', end: '09 Jul', faculty: 'Ms. Patel', completion: 100, status: 'Completed' },
    { topic: 'States of Matter', days: 4, start: '10 Jul', end: '13 Jul', faculty: 'Ms. Patel', completion: 75, status: 'In Progress' },
    { topic: 'Thermodynamics', days: 5, start: '14 Jul', end: '18 Jul', faculty: 'Ms. Patel', completion: 0, status: 'Pending' },
    { topic: 'Equilibrium', days: 6, start: '19 Jul', end: '24 Jul', faculty: 'Ms. Patel', completion: 0, status: 'Pending' },
  ],
  Biology: [
    { topic: 'Cell Structure & Function', days: 4, start: '01 Jul', end: '04 Jul', faculty: 'Ms. Verma', completion: 100, status: 'Completed' },
    { topic: 'Biomolecules', days: 5, start: '05 Jul', end: '09 Jul', faculty: 'Ms. Verma', completion: 80, status: 'In Progress' },
    { topic: 'Cell Division', days: 4, start: '10 Jul', end: '13 Jul', faculty: 'Ms. Verma', completion: 0, status: 'Pending' },
    { topic: 'Genetics & Evolution', days: 6, start: '14 Jul', end: '19 Jul', faculty: 'Ms. Verma', completion: 0, status: 'Pending' },
  ],
  English: [],
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const config = {
    Completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    'In Progress': 'bg-blue-100 text-blue-700 border border-blue-200',
    Pending: 'bg-gray-100 text-gray-500 border border-gray-200',
  }
  const dot = {
    Completed: 'text-emerald-500',
    'In Progress': 'text-blue-500',
    Pending: 'text-gray-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config[status]}`}>
      <span className={dot[status]}>{status === 'Pending' ? '○' : '●'}</span>
      {status}
    </span>
  )
}

function ProgressBar({ value, status }) {
  const barColor =
    status === 'Completed' ? 'bg-emerald-500' : status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-300'
  const trackColor =
    status === 'Completed' ? 'bg-emerald-100' : status === 'In Progress' ? 'bg-blue-100' : 'bg-gray-200'

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className={`flex-1 h-1.5 rounded-full ${trackColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{value}%</span>
    </div>
  )
}

function SummaryCard({ label, value, accent, icon }) {
  return (
    <div className="flex-1 min-w-[130px] rounded-2xl p-4 flex flex-col gap-1" style={{ background: '#ccd2dd' }}>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-3xl font-bold leading-none ${accent}`}>{value}</span>
    </div>
  )
}

function EmptyState({ onClose }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 gap-5">
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: '#ccd2dd' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="6" y="10" width="36" height="32" rx="4" fill="#94a3b8" />
          <rect x="6" y="10" width="36" height="9" rx="4" fill="#3B82F6" />
          <rect x="14" y="25" width="20" height="2" rx="1" fill="#cbd5e1" />
          <rect x="14" y="31" width="14" height="2" rx="1" fill="#cbd5e1" />
          <rect x="12" y="6" width="4" height="7" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="32" y="6" width="4" height="7" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800">No Schedule Available</p>
        <p className="text-sm text-gray-500 mt-1 max-w-xs leading-relaxed">
          No teaching schedule has been created for the selected subject and month.
        </p>
      </div>
      <button
        onClick={onClose}
        className="mt-1 px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 active:scale-95 transition-all shadow-sm"
      >
        Create Schedule
      </button>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Schedule({ isOpen, onClose }) {
  const [subject, setSubject] = useState('Mathematics')
  const [month, setMonth] = useState('July 2026')
  const [faculty, setFaculty] = useState('All Faculty')
  const [search, setSearch] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const backdropRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) setUploadedFile(null)
  }, [isOpen])

  if (!isOpen) return null

  const rows = (SCHEDULE_DATA[subject] ?? []).filter((r) => {
    const matchesFaculty = faculty === 'All Faculty' || r.faculty === faculty
    const matchesSearch = r.topic.toLowerCase().includes(search.toLowerCase())
    return matchesFaculty && matchesSearch
  })

  const total = rows.length
  const completed = rows.filter((r) => r.status === 'Completed').length
  const pending = rows.filter((r) => r.status === 'Pending').length

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null
    setUploadedFile(file)
    e.target.value = ''
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10, 18, 35, 0.62)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative flex flex-col bg-white shadow-2xl overflow-hidden"
        style={{ width: '90%', maxWidth: '1200px', height: '90vh', borderRadius: '24px' }}
        role="dialog"
        aria-modal="true"
        aria-label="Teaching Schedule"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all"
          aria-label="Close modal"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="4" width="18" height="16" rx="2.5" fill="none" stroke="#3B82F6" strokeWidth="1.6" />
                <path d="M2 9h18" stroke="#3B82F6" strokeWidth="1.6" />
                <rect x="7" y="1.5" width="2" height="5" rx="1" fill="#3B82F6" />
                <rect x="13" y="1.5" width="2" height="5" rx="1" fill="#3B82F6" />
                <path d="M6 13h2M10 13h2M14 13h2M6 16.5h2M10 16.5h2" stroke="#3B82F6" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Centre Teaching Schedule</h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Monthly Subject Planning & Coverage</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-100 flex-shrink-0" style={{ background: '#EFF6FF' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="11" rx="1.5" fill="none" stroke="#3B82F6" strokeWidth="1.3" />
              <path d="M1 5.5h12" stroke="#3B82F6" strokeWidth="1.3" />
            </svg>
            <span className="text-sm font-bold text-blue-600">July 2026</span>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="flex flex-col flex-1 overflow-y-auto px-8 py-5 gap-5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
        >
          {/* Summary cards */}
          <div className="flex gap-3 flex-wrap">
            <SummaryCard label="Total Topics" value={total} accent="text-gray-800" icon="📚" />
            <SummaryCard label="Completed" value={completed} accent="text-emerald-600" icon="✅" />
            <SummaryCard label="Pending" value={pending} accent="text-orange-500" icon="⏳" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 pr-7 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 cursor-pointer transition-all min-w-[150px]"
                >
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Month</label>
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 pr-7 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 cursor-pointer transition-all min-w-[140px]"
                >
                  {MONTHS.map((m) => <option key={m}>{m}</option>)}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty</label>
              <div className="relative">
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2.5 pr-7 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 cursor-pointer transition-all min-w-[140px]"
                >
                  {FACULTY_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Search</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Search Topic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Table or empty state */}
          {rows.length === 0 ? (
            <EmptyState onClose={onClose} />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100 flex-1" style={{ minHeight: 0 }}>
              <table className="w-full text-sm border-collapse" style={{ minWidth: '720px' }}>
                <thead>
                  <tr style={{ background: '#ccd2dd' }}>
                    {['Topic', 'Planned Days', 'Start Date', 'End Date', 'Faculty', 'Completion', 'Status'].map((col, i, arr) => (
                      <th
                        key={col}
                        className={`px-4 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap ${i === 0 ? 'rounded-tl-2xl' : ''} ${i === arr.length - 1 ? 'rounded-tr-2xl' : ''}`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-100 hover:bg-blue-50/50 transition-colors cursor-default"
                      style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                    >
                      <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">{row.topic}</td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          {row.days} Days
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{row.start}</td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{row.end}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-700 whitespace-nowrap">{row.faculty}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <ProgressBar value={row.completion} status={row.status} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {uploadedFile ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-blue-800 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {(uploadedFile.size / 1024).toFixed(1)} KB · ready to use
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="shrink-0 text-blue-600 hover:text-blue-800 text-xs font-semibold"
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl border border-blue-200 text-sm font-semibold text-blue-600 hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 9V3M4.5 5.5L7 3l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 10v1.5A1.5 1.5 0 003.5 13h7A1.5 1.5 0 0012 11.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Upload
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
          >
            Close
          </button>
          <button className="px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 active:scale-95 transition-all shadow-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1 10v1.5A1.5 1.5 0 002.5 13h9A1.5 1.5 0 0013 11.5V10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Export Schedule
          </button>
        </div>
      </div>
    </div>
  )
}

