import React from 'react'
import styles from './QualityRating.module.css'

const QualityRating = ({
  rating,
  showLabel = true,
  size = 'medium',
  interactive = false,
  onChange,
  options = ['excellent', 'good', 'fair', 'poor']
}) => {
  const qualityConfig = {
    excellent: {
      color: '#27ae60',
      bgColor: '#d4edda',
      label: 'Excellent',
      description: 'Perfect print',
      icon: '⭐'
    },
    good: {
      color: '#3498db',
      bgColor: '#cce5ff',
      label: 'Good',
      description: 'Minor issues',
      icon: '✓'
    },
    fair: {
      color: '#f39c12',
      bgColor: '#fff3cd',
      label: 'Fair',
      description: 'Noticeable flaws',
      icon: '⚠'
    },
    poor: {
      color: '#e74c3c',
      bgColor: '#f8d7da',
      label: 'Poor',
      description: 'Major issues',
      icon: '✗'
    },
    none: {
      color: '#6c757d',
      bgColor: '#f8f9fa',
      label: 'Not Rated',
      description: 'No quality rating',
      icon: '○'
    }
  }

  const config = qualityConfig[rating] || qualityConfig.none

  const handleClick = (newRating) => {
    if (interactive && onChange) {
      onChange(newRating)
    }
  }

  const getRatingComponent = () => {
    if (interactive) {
      // Interactive rating selector
      return (
        <div className={`${styles.interactiveRating} ${styles[size]}`}>
          <div className={styles.ratingOptions}>
            {options.map(option => {
              const optionConfig = qualityConfig[option] || qualityConfig.none
              const isSelected = option === rating

              return (
                <button
                  key={option}
                  type="button"
                  className={`${styles.ratingOption} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleClick(option)}
                  style={{
                    '--rating-color': optionConfig.color,
                    '--rating-bg': optionConfig.bgColor
                  }}
                >
                  <span className={styles.ratingIcon}>{optionConfig.icon}</span>
                  {showLabel && <span className={styles.ratingLabel}>{optionConfig.label}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )
    } else {
      // Display-only rating
      return (
        <div className={`${styles.ratingDisplay} ${styles[size]}`} style={{
          '--rating-color': config.color,
          '--rating-bg': config.bgColor
        }}>
          <span className={styles.ratingIcon}>{config.icon}</span>
          {showLabel && (
            <>
              <span className={styles.ratingLabel}>{config.label}</span>
              <span className={styles.ratingDescription}>{config.description}</span>
            </>
          )}
        </div>
      )
    }
  }

  if (rating === undefined || rating === null || rating === '') {
    return (
      <div className={`${styles.noRating} ${styles[size]}`}>
        <span className={styles.ratingIcon}>{qualityConfig.none.icon}</span>
        {showLabel && <span className={styles.ratingLabel}>{qualityConfig.none.label}</span>}
      </div>
    )
  }

  return getRatingComponent()
}

// Compact rating component for use in tables
export const CompactQualityRating = ({ rating, size = 'small', showIcon = true }) => {
  const qualityConfig = {
    excellent: { color: '#27ae60', label: 'Excellent', icon: '⭐' },
    good: { color: '#3498db', label: 'Good', icon: '✓' },
    fair: { color: '#f39c12', label: 'Fair', icon: '⚠' },
    poor: { color: '#e74c3c', label: 'Poor', icon: '✗' }
  }

  const config = qualityConfig[rating] || { color: '#6c757d', label: 'N/A', icon: '○' }

  return (
    <div
      className={`${styles.compactRating} ${styles[size]}`}
      style={{ '--rating-color': config.color }}
    >
      {showIcon && <span className={styles.compactIcon}>{config.icon}</span>}
      <span className={styles.compactLabel}>{config.label}</span>
    </div>
  )
}

// Rating statistics component
export const QualityRatingStats = ({ ratings, showPercentages = true, showCounts = true }) => {
  const qualityOptions = ['excellent', 'good', 'fair', 'poor']
  const total = ratings.length

  const stats = qualityOptions.map(option => {
    const count = ratings.filter(r => r === option).length
    const percentage = total > 0 ? (count / total) * 100 : 0
    return {
      option,
      count,
      percentage
    }
  })

  const qualityConfig = {
    excellent: { color: '#27ae60', label: 'Excellent' },
    good: { color: '#3498db', label: 'Good' },
    fair: { color: '#f39c12', label: 'Fair' },
    poor: { color: '#e74c3c', label: 'Poor' }
  }

  return (
    <div className={styles.ratingStats}>
      <div className={styles.statsHeader}>
        <h4>Quality Distribution</h4>
        <span className={styles.totalCount}>{total} ratings</span>
      </div>

      <div className={styles.statsBars}>
        {stats.map(stat => {
          const config = qualityConfig[stat.option]
          return (
            <div key={stat.option} className={styles.statBar}>
              <div className={styles.statInfo}>
                <span
                  className={styles.statLabel}
                  style={{ '--stat-color': config.color }}
                >
                  {config.label}
                </span>
                {showCounts && (
                  <span className={styles.statCount}>{stat.count}</span>
                )}
                {showPercentages && (
                  <span className={styles.statPercentage}>
                    {stat.percentage.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${stat.percentage}%`,
                    '--progress-color': config.color
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {total === 0 && (
        <div className={styles.noStats}>
          <p>No quality ratings available</p>
        </div>
      )}
    </div>
  )
}

// Quality trend component
export const QualityTrend = ({ printHistory, timeRange = 'month' }) => {
  // Group prints by time period and calculate average quality
  const getTimeGroup = (date, range) => {
    const d = new Date(date)
    switch (range) {
      case 'week':
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case 'month':
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      case 'year':
        return d.getFullYear().toString()
      default:
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const qualityScores = {
    excellent: 4,
    good: 3,
    fair: 2,
    poor: 1
  }

  const timeGroups = {}

  printHistory
    .filter(print => print.qualityRating && print.date)
    .forEach(print => {
      const timeGroup = getTimeGroup(print.date, timeRange)
      if (!timeGroups[timeGroup]) {
        timeGroups[timeGroup] = []
      }
      timeGroups[timeGroup].push(qualityScores[print.qualityRating] || 0)
    })

  const trendData = Object.entries(timeGroups).map(([timeGroup, scores]) => ({
    timeGroup,
    average: scores.reduce((a, b) => a + b, 0) / scores.length,
    count: scores.length
  })).slice(-10) // Last 10 periods

  return (
    <div className={styles.qualityTrend}>
      <div className={styles.trendHeader}>
        <h4>Quality Trend ({timeRange})</h4>
        <span className={styles.trendCount}>
          {trendData.reduce((sum, d) => sum + d.count, 0)} prints
        </span>
      </div>

      {trendData.length > 0 ? (
        <div className={styles.trendChart}>
          <div className={styles.chartContainer}>
            {trendData.map((data, index) => {
              const quality = data.average
              let config
              if (quality >= 3.5) config = { color: '#27ae60', label: 'Excellent' }
              else if (quality >= 2.5) config = { color: '#3498db', label: 'Good' }
              else if (quality >= 1.5) config = { color: '#f39c12', label: 'Fair' }
              else config = { color: '#e74c3c', label: 'Poor' }

              return (
                <div key={index} className={styles.chartBar} style={{ '--bar-color': config.color }}>
                  <div
                    className={styles.barFill}
                    style={{ height: `${(quality / 4) * 100}%` }}
                  />
                  <div className={styles.barLabel}>
                    <div className={styles.timeGroup}>{data.timeGroup}</div>
                    <div className={styles.barValue}>{quality.toFixed(1)}</div>
                    <div className={styles.barCount}>({data.count})</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className={styles.chartLegend}>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ background: '#27ae60' }} />
              <span>Excellent (4.0)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ background: '#3498db' }} />
              <span>Good (3.0)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ background: '#f39c12' }} />
              <span>Fair (2.0)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ background: '#e74c3c' }} />
              <span>Poor (1.0)</span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.noTrend}>
          <p>No quality trend data available</p>
        </div>
      )}
    </div>
  )
}

export default QualityRating