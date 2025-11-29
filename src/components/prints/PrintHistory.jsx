import React, { useState } from 'react'
import { usePrints } from '../../contexts/PrintContext.js'
import { useModels } from '../../contexts/ModelContext.js'
import PrintForm from './PrintForm.jsx'
import PrintTable from './PrintTable.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import ErrorMessage from '../common/ErrorMessage.jsx'
import styles from './PrintHistory.module.css'

const PrintHistory = () => {
  const {
    prints,
    loading,
    error,
    searchQuery,
    selectedModel,
    selectedPeriod,
    selectedQuality,
    sortBy,
    statistics,
    actions
  } = usePrints()

  const { models } = useModels()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPrint, setEditingPrint] = useState(null)
  const [showStatistics, setShowStatistics] = useState(false)

  const handleSearch = (e) => {
    actions.setSearchQuery(e.target.value)
  }

  const handleModelFilter = (modelId) => {
    actions.setSelectedModel(modelId)
  }

  const handlePeriodFilter = (period) => {
    actions.setSelectedPeriod(period)
  }

  const handleQualityFilter = (quality) => {
    actions.setSelectedQuality(quality)
  }

  const handleSort = (sortBy) => {
    actions.setSortBy(sortBy)
  }

  const handleAddPrint = () => {
    setEditingPrint(null)
    setShowAddForm(true)
  }

  const handleEditPrint = (print) => {
    setEditingPrint(print)
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingPrint(null)
  }

  const handleSavePrint = (printData) => {
    let success
    if (editingPrint) {
      success = actions.updatePrint({ ...editingPrint, ...printData })
    } else {
      success = actions.addPrint(printData)
    }

    if (success) {
      handleCloseForm()
      actions.clearError()
    }
  }

  const handleDeletePrint = (printId) => {
    if (window.confirm('Are you sure you want to delete this print record?')) {
      actions.deletePrint(printId)
    }
  }

  const formatDateRange = () => {
    switch (selectedPeriod) {
      case 'week':
        return 'Last 7 days'
      case 'month':
        return 'Last 30 days'
      case 'year':
        return 'Last 12 months'
      default:
        return 'All time'
    }
  }

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return styles.excellent
      case 'good': return styles.good
      case 'fair': return styles.fair
      case 'poor': return styles.poor
      default: return ''
    }
  }

  const uniqueModels = [
    { id: 'all', name: 'All Models' },
    ...models.map(model => ({ id: model.id, name: model.name }))
  ]

  if (loading && prints.length === 0) {
    return <LoadingSpinner message="Loading print history..." />
  }

  return (
    <div className={styles.printHistory}>
      <div className={styles.header}>
        <h1>Print History</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.statsButton}
            onClick={() => setShowStatistics(!showStatistics)}
          >
            {showStatistics ? 'Hide' : 'Show'} Statistics
          </button>
          <button
            className={styles.addButton}
            onClick={handleAddPrint}
          >
            + Record Print
          </button>
        </div>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={actions.clearError}
        />
      )}

      {/* Statistics Panel */}
      {showStatistics && (
        <div className={styles.statisticsPanel}>
          <h3>Print Statistics</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{statistics.totalPrints}</div>
              <div className={styles.statLabel}>Total Prints</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {Math.round(statistics.averageDuration * 10) / 10}h
              </div>
              <div className={styles.statLabel}>Average Duration</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{Math.round(statistics.totalDuration)}h</div>
              <div className={styles.statLabel}>Total Print Time</div>
            </div>
          </div>

          <div className={styles.qualityStats}>
            <h4>Quality Distribution</h4>
            <div className={styles.qualityBars}>
              {Object.entries(statistics.qualityCounts).map(([quality, count]) => (
                <div key={quality} className={styles.qualityBar}>
                  <span className={`${styles.qualityLabel} ${getQualityColor(quality)}`}>
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}:
                  </span>
                  <div className={styles.qualityProgress}>
                    <div
                      className={styles.qualityFill}
                      style={{
                        width: `${statistics.totalPrints > 0 ? (count / statistics.totalPrints) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className={styles.qualityCount}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search prints..."
            value={searchQuery}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label htmlFor="model-filter">Model:</label>
            <select
              id="model-filter"
              value={selectedModel}
              onChange={(e) => handleModelFilter(e.target.value)}
              className={styles.filterSelect}
            >
              {uniqueModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="period-filter">Period:</label>
            <select
              id="period-filter"
              value={selectedPeriod}
              onChange={(e) => handlePeriodFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="quality-filter">Quality:</label>
            <select
              id="quality-filter"
              value={selectedQuality}
              onChange={(e) => handleQualityFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Qualities</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="sort-filter">Sort by:</label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="date">Date</option>
              <option value="model">Model Name</option>
              <option value="quality">Quality</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      <div className={styles.filterSummary}>
        <span>
          Showing {prints.length} prints {formatDateRange()}
        </span>
        {searchQuery && (
          <span>for "{searchQuery}"</span>
        )}
      </div>

      {/* Print Table */}
      <PrintTable
        prints={prints}
        onEdit={handleEditPrint}
        onDelete={handleDeletePrint}
        loading={loading}
      />

      {/* Add/Edit Print Modal */}
      {showAddForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingPrint ? 'Edit Print Record' : 'Record New Print'}</h2>
              <button
                className={styles.closeButton}
                onClick={handleCloseForm}
              >
                ×
              </button>
            </div>
            <PrintForm
              print={editingPrint}
              onSubmit={handleSavePrint}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default PrintHistory