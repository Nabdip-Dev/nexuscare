// NotFound.jsx
import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-secondary-900 text-center p-4">
      <div>
        <div className="text-8xl mb-6">🏥</div>
        <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">Page Not Found</h2>
        <p className="text-secondary-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary px-8 py-3">Go to Homepage</Link>
      </div>
    </div>
  )
}
