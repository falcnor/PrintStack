import React, { useState } from 'react'
import { formatCurrency, formatWeight, calculateFilamentPercentage, calculateCostPerGram } from '../../utils/dataUtils.js'
import styles from './FilamentTable.module.css'

const FilamentTable = ({ filaments, onEdit, onDelete, loading = false, pageSize = 25 }) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'ascending'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [virtualizedRows, setVirtualizedRows] = useState(50) // For large datasets

  const handleSort = (key) => {
    let direction = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const sortedFilaments = React.useMemo(() => {
    let sortableFilaments = [...filaments]

    if (sortConfig.key) {
      sortableFilaments.sort((a, b) => {
        let aValue = a[sortConfig.key]
        let bValue = b[sortConfig.key]

        // Handle numeric values
        if (sortConfig.key === 'weight' || sortConfig.key === 'remainingWeight' || sortConfig.key === 'cost') {
          aValue = aValue || 0
          bValue = bValue || 0
        }

        // Handle string values
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }

    return sortableFilaments
  }, [filaments, sortConfig])

  // Calculate pagination
  const totalItems = sortedFilaments.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  // Determine if we should use virtualization
  const useVirtualization = totalItems > virtualizedRows

  // Get paginated or virtualized data
  const displayFilaments = React.useMemo(() => {
    if (useVirtualization) {
      // Return first virtualizedRows items for now
      // In a real implementation, you'd use virtual scrolling library
      return sortedFilaments.slice(0, virtualizedRows)
    } else {
      return sortedFilaments.slice(startIndex, endIndex)
    }
  }, [sortedFilaments, startIndex, endIndex, useVirtualization, virtualizedRows])

  // Reset to page 1 when sort or data changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [sortConfig.key, filaments.length])

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
  }

  const getRemainingPercentage = (filament) => {
    if (!filament.weight || !filament.remainingWeight) return null
    return calculateFilamentPercentage(filament.remainingWeight, filament.weight)
  }

  const getRemainingColor = (percentage) => {
    if (percentage === null) return 'var(--text-muted)'
    if (percentage > 50) return 'var(--success-color)'
    if (percentage > 20) return 'var(--warning-color)'
    return 'var(--error-color)'
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.skeletonTable}>
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonCell}></div>
            <div className={styles.skeletonCell}></div>
            <div className={styles.skeletonCell}></div>
            <div className={styles.skeletonCell}></div>
            <div className={styles.skeletonCell}></div>
            <div className={styles.skeletonCell}></div>
            <div className={styles.skeletonCell}></div>
          </div>
          {[...Array(5)].map((_, index) => (
            <div key={index} className={styles.skeletonRow}>
              <div className={styles.skeletonCell}></div>
              <div className={styles.skeletonCell}></div>
              <div className={styles.skeletonCell}></div>
              <div className={styles.skeletonCell}></div>
              <div className={styles.skeletonCell}></div>
              <div className={styles.skeletonCell}></div>
              <div className={styles.skeletonCell}></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (filaments.length === 0) {
    return null // Let parent component handle empty state
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const getVisibleRange = () => {
    if (useVirtualization) {
      return { start: 1, end: Math.min(virtualizedRows, totalItems), total: totalItems }
    }
    const start = startIndex + 1
    const end = Math.min(endIndex, totalItems)
    return { start, end, total: totalItems }
  }

  const visibleRange = getVisibleRange()

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableInfo}>
        <span className={styles.itemCount}>
          Showing {visibleRange.start}-{visibleRange.end} of {visibleRange.total} filaments
        </span>
        {useVirtualization && (
          <span className={styles.virtualizationNotice}>
            (Virtualization enabled - first {virtualizedRows} items)
          </span>
        )}
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('name')}
              scope="col"
            >
              Name{getSortIndicator('name')}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('material')}
              scope="col"
            >
              Material{getSortIndicator('material')}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('color')}
              scope="col"
            >
              Color{getSortIndicator('color')}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('weight')}
              scope="col"
            >
              Weight{getSortIndicator('weight')}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('remainingWeight')}
              scope="col"
            >
              Remaining{getSortIndicator('remainingWeight')}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('cost')}
              scope="col"
            >
              Cost{getSortIndicator('cost')}
            </th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayFilaments.map((filament) => {
            const percentage = getRemainingPercentage(filament)
            const costPerGram = calculateCostPerGram(filament.cost, filament.weight)

            return (
              <tr key={filament.id} className={styles.row}>
                <td className={styles.nameCell}>
                  <div className={styles.filamentName}>
                    {filament.color && (
                      <span
                        className={styles.colorSwatch}
                        style={{ backgroundColor: getFilamentColor(filament.color) }}
                        title={filament.color}
                        aria-label={`Color: ${filament.color}`}
                      ></span>
                    )}
                    <span>{filament.name}</span>
                  </div>
                </td>
                <td>{filament.material}</td>
                <td>{filament.color || '-'}</td>
                <td>
                  {filament.weight ? formatWeight(filament.weight) : '-'}
                </td>
                <td>
                  <div className={styles.remainingContainer}>
                    <span className={styles.remainingWeight}>
                      {filament.remainingWeight ? formatWeight(filament.remainingWeight) : '-'}
                    </span>
                    {percentage !== null && (
                      <span
                        className={styles.percentage}
                        style={{ color: getRemainingColor(percentage) }}
                      >
                        {percentage}%
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className={styles.costContainer}>
                    {filament.cost ? formatCurrency(filament.cost) : '-'}
                    {costPerGram > 0 && (
                      <span className={styles.costPerGram}>
                        ({formatCurrency(costPerGram)}/g)
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => onEdit(filament)}
                      className={styles.editButton}
                      aria-label={`Edit ${filament.name}`}
                      title="Edit filament"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(filament.id)}
                      className={styles.deleteButton}
                      aria-label={`Delete ${filament.name}`}
                      title="Delete filament"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {!useVirtualization && totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Page {currentPage} of {totalPages}
          </div>

          <div className={styles.paginationControls}>
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={styles.paginationButton}
              aria-label="First page"
            >
              ⏮️ First
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.paginationButton}
              aria-label="Previous page"
            >
              ◀️ Previous
            </button>

            <div className={styles.pageNumbers}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`${styles.pageNumber} ${
                      currentPage === pageNum ? styles.activePage : ''
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
              aria-label="Next page"
            >
              Next ▶️
            </button>

            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={styles.paginationButton}
              aria-label="Last page"
            >
              Last ⏭️
            </button>
          </div>
        </div>
      )}

      {/* Performance Notice for Virtualization */}
      {useVirtualization && (
        <div className={styles.performanceNotice}>
          <span>⚡ Performance mode: Showing first {virtualizedRows} items</span>
          <button
            onClick={() => setVirtualizedRows(prev => prev + 50)}
            className={styles.loadMoreButton}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}

// Helper function to get a basic color representation
const getFilamentColor = (colorName) => {
  const colorMap = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#00FF00',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#8B4513',
    'gray': '#808080',
    'grey': '#808080',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    'translucent': '#E8E8E8',
    'clear': '#F8F8F8'
  }

  const lowerColor = colorName.toLowerCase()
  return colorMap[lowerColor] || '#CCCCCC'
}

export default FilamentTable