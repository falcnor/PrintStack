import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/common/Layout.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import LoadingSpinner from './components/common/LoadingSpinner.jsx'

// Lazy load components for better performance
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard.jsx'))
const FilamentList = React.lazy(() => import('./components/filament/FilamentList.jsx'))

// Progressive enhancement: Basic app structure
const App = () => {
  return (
    <ErrorBoundary>
      <Layout>
        <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/filaments" element={<FilamentList />} />
            <Route path="/models" element={<div><h2>Models</h2><p>Coming soon...</p></div>} />
            <Route path="/prints" element={<div><h2>Prints</h2><p>Coming soon...</p></div>} />
            <Route path="/settings" element={<div><h2>Settings</h2><p>Coming soon...</p></div>} />

            {/* Fallback route */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
              </div>
            } />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  )
}

export default App