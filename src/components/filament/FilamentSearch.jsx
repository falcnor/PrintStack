import React, { useState, useCallback } from 'react'
import styles from './FilamentSearch.module.css'

const FilamentSearch = ({ onSearch, materials = [], className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState('')

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch(value, selectedMaterial)
  }, [selectedMaterial, onSearch])

  const handleMaterialChange = useCallback((e) => {
    const value = e.target.value
    setSelectedMaterial(value)
    onSearch(searchTerm, value)
  }, [searchTerm, onSearch])

  const handleClear = useCallback(() => {
    setSearchTerm('')
    setSelectedMaterial('')
    onSearch('', '')
  }, [onSearch])

  const hasFilters = searchTerm || selectedMaterial

  return (
    <div className={`${styles.searchContainer} ${className}`}>
      <div className={styles.searchFields}>
        <div className={styles.searchField}>
          <label htmlFor="search-input" className={styles.label}>
            Search Filaments
          </label>
          <div className={styles.searchInputWrapper}>
            <input
              id="search-input"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, material, or color..."
              className={styles.searchInput}
              aria-label="Search filaments"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  onSearch('', selectedMaterial)
                }}
                className={styles.clearButton}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className={styles.searchField}>
          <label htmlFor="material-filter" className={styles.label}>
            Material
          </label>
          <select
            id="material-filter"
            value={selectedMaterial}
            onChange={handleMaterialChange}
            className={styles.materialSelect}
            aria-label="Filter by material"
          >
            <option value="">All Materials</option>
            {materials.map(material => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasFilters && (
        <div className={styles.activeFilters}>
          <span className={styles.filterLabel}>Active filters:</span>
          {searchTerm && (
            <span className={styles.filterTag}>
              Search: "{searchTerm}"
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  onSearch('', selectedMaterial)
                }}
                className={styles.removeFilter}
                aria-label="Remove search filter"
              >
                ×
              </button>
            </span>
          )}
          {selectedMaterial && (
            <span className={styles.filterTag}>
              Material: {selectedMaterial}
              <button
                type="button"
                onClick={() => {
                  setSelectedMaterial('')
                  onSearch(searchTerm, '')
                }}
                className={styles.removeFilter}
                aria-label="Remove material filter"
              >
                ×
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearAll}
            aria-label="Clear all filters"
          >
            Clear All
          </button>
        </div>
      )}

      <div className={styles.searchTips}>
        <span className={styles.tip}>💡</span>
        <span className={styles.tipText}>
          Try searching by filament name (e.g., "silk"), material (e.g., "PLA"), or color (e.g., "blue")
        </span>
      </div>
    </div>
  )
}

export default FilamentSearch