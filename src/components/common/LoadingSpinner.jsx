import React from 'react'
import styles from './LoadingSpinner.module.css'

const LoadingSpinner = ({ message = 'Loading...', size = 'medium', fullScreen = false }) => {
  const containerClass = fullScreen ? styles.fullScreen : styles.container

  return (
    <div className={containerClass}>
      <div className={`${styles.spinner} ${styles[size]}`} aria-hidden="true"></div>
      {message && (
        <p className={styles.message} aria-live="polite">
          {message}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner