// StatusBadge.jsx
export function StatusBadge({ status }) {
  const map = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    'in-progress': 'status-in-progress',
    'no-show': 'status-no-show',
    approved: 'status-completed',
    rejected: 'status-cancelled',
    processing: 'status-confirmed',
    ready: 'status-completed',
    delivered: 'status-completed'
  }
  return <span className={map[status] || 'badge bg-gray-100 text-gray-600'}>{status?.replace('-', ' ')}</span>
}

// Spinner.jsx
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return <div className={`spinner ${sizes[size]} ${className}`} />
}

// PageLoader.jsx
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-3" />
        <p className="text-secondary-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}

// EmptyState.jsx
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon || '📭'}</div>
      <h3 className="font-semibold text-secondary-700 dark:text-secondary-300 text-lg mb-2">{title}</h3>
      {description && <p className="text-secondary-500 text-sm max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

// Pagination.jsx
export function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn-secondary px-3 py-2 text-sm disabled:opacity-40">← Prev</button>
      <div className="flex gap-1">
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          const p = pages <= 7 ? i + 1 : i < 3 ? i + 1 : i >= 4 ? pages - (6 - i) : page
          return (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-primary-500 text-white' : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700'}`}>
              {p}
            </button>
          )
        })}
      </div>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= pages} className="btn-secondary px-3 py-2 text-sm disabled:opacity-40">Next →</button>
    </div>
  )
}

// Modal.jsx
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-secondary-800 rounded-2xl shadow-card-lg w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-slide-up`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100 dark:border-secondary-700">
            <h3 className="font-bold text-secondary-900 dark:text-white text-lg">{title}</h3>
            <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ConfirmDialog.jsx
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-secondary-600 dark:text-secondary-400 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmText}</button>
      </div>
    </Modal>
  )
}

// StatCard.jsx
export function StatCard({ icon, label, value, sub, color = 'primary', trend }) {
  const colors = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
  }
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-secondary-500 text-sm">{label}</p>
        <p className="font-bold text-2xl text-secondary-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-secondary-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
