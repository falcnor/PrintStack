import React from 'react'
import styles from './ErrorBoundary.module.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.container}>
            <div className={styles.icon}>⚠️</div>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.message}>
              We're sorry, but something unexpected happened. The application has encountered an error.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.details}>
                <summary className={styles.summary}>Error Details</summary>
                <pre className={styles.errorText}>
                  <code>
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo.componentStack}
                  </code>
                </pre>
              </details>
            )}

            <div className={styles.actions}>
              <button
                onClick={this.handleReset}
                className={styles.resetBtn}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className={styles.reloadBtn}
              >
                Reload Page
              </button>
            </div>

            <div className={styles.help}>
              <p>
                If this problem persists, you can:
              </p>
              <ul>
                <li>Clear your browser cache and reload</li>
                <li>Export your data to prevent loss</li>
                <li>Contact support for assistance</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary