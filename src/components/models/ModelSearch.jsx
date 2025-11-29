import React, { useState, useEffect, useMemo } from 'react'
import styles from './ModelSearch.module.css'

const ModelSearch = ({
  models = [],
  onFilteredResults,
  onSearchChange,
  initialFilters = {},
  showAdvanced = true,
  showSortOptions = true,
  compact = false
}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || '')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    difficulty: initialFilters.difficulty || '',
    canPrint: initialFilters.canPrint || '',
    minPrintTime: initialFilters.minPrintTime || '',
    maxPrintTime: initialFilters.maxPrintTime || '',
    hasRequirements: initialFilters.hasRequirements || '',
    sortBy: initialFilters.sortBy || 'name'
  })

  // Get available categories from models
  const availableCategories = useMemo(() => {
    const categories = [...new Set(models.map(model => model.category).filter(Boolean))]
    return categories.sort()
  }, [models])

  // Get available difficulties from models
  const availableDifficulties = useMemo(() => {
    const difficulties = [...new Set(models.map(model => model.difficulty).filter(Boolean))]
    return difficulties.sort()
  }, [models])

  // Filter and sort models
  const filteredAndSortedModels = useMemo(() => {
    let filtered = models

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(query) ||
        model.category.toLowerCase().includes(query) ||
        model.notes?.toLowerCase().includes(query) ||
        model.description?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(model => model.category === filters.category)
    }

    // Difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(model => model.difficulty === filters.difficulty)
    }

    // Printability filter
    if (filters.canPrint) {
      const canPrint = filters.canPrint === 'true'
      filtered = filtered.filter(model => model.canPrint === canPrint)
    }

    // Print time range filter
    if (filters.minPrintTime) {
      filtered = filtered.filter(model => (model.printTime || 0) >= parseFloat(filters.minPrintTime))
    }
    if (filters.maxPrintTime) {
      filtered = filtered.filter(model => (model.printTime || 0) <= parseFloat(filters.maxPrintTime))
    }

    // Requirements filter
    if (filters.hasRequirements === 'true') {
      filtered = filtered.filter(model => model.requirements && model.requirements.length > 0)
    } else if (filters.hasRequirements === 'false') {
      filtered = filtered.filter(model => !model.requirements || model.requirements.length === 0)
    }

    // Sort results
    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'category':
          return a.category.localeCompare(b.category)
        case 'difficulty':
          const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 }
          const aDifficulty = difficultyOrder[a.difficulty] || 4
          const bDifficulty = difficultyOrder[b.difficulty] || 4
          return aDifficulty - bDifficulty
        case 'printTime':
          return (a.printTime || 0) - (b.printTime || 0)
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt)
        case 'updated':
          return new Date(b.updatedAt) - new Date(a.updatedAt)
        case 'requirementCount':
          const aReqs = (a.requirements || []).length
          const bReqs = (b.requirements || []).length
          return bReqs - aReqs
        default:
          return 0
      }
    })

    return sorted
  }, [models, searchQuery, filters])

  // Update filtered results
  useEffect(() => {
    onFilteredResults?.(filteredAndSortedModels)
  }, [filteredAndSortedModels, onFilteredResults])

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchQuery(value)
    onSearchChange?.(value)
  }

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value }
    setFilters(newFilters)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setFilters({
      category: '',
      difficulty: '',
      canPrint: '',
      minPrintTime: '',
      maxPrintTime: '',
      hasRequirements: '',
      sortBy: 'name'
    })
  }

  // Get active filters count
  const activeFiltersCount = useMemo(() => {
    let count = searchQuery.trim() ? 1 : 0
    if (filters.category) count++
    if (filters.difficulty) count++
    if (filters.canPrint) count++
    if (filters.minPrintTime) count++
    if (filters.maxPrintTime) count++
    if (filters.hasRequirements) count++
    return count
  }, [searchQuery, filters])

  // Generate quick search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || models.length === 0) return []

    const query = searchQuery.toLowerCase()
    const suggestions = []

    // Category suggestions
    const matchingCategories = availableCategories.filter(cat =>
      cat.toLowerCase().includes(query)
    ).slice(0, 3)

    matchingCategories.forEach(cat => {
      suggestions.push({
        type: 'category',
        text: cat,
        action: () => {
          handleFilterChange('category', cat)
          setSearchQuery('')
        }
      })
    })

    // Name suggestions
    const matchingNames = models
      .filter(model => model.name.toLowerCase().includes(query))
      .map(model => ({
        type: 'model',
        text: model.name,
        model
      }))
      .slice(0, 3)

    suggestions.push(...matchingNames)

    return suggestions
  }, [searchQuery, models, availableCategories])

  const Component = compact ? 'div' : 'section'

  return (
    <Component className={`${styles.modelSearch} ${compact ? styles.compact : ''}`}>
      {/* Search Input */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search models by name, category, or notes..."
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className={styles.clearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {searchSuggestions.length > 0 && (
          <div className={styles.suggestions}>
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => suggestion.action?.()}
                className={`${styles.suggestion} ${styles[suggestion.type]}`}
              >
                {suggestion.type === 'category' && (
                  <span className={styles.suggestionIcon}>📂</span>
                )}
                {suggestion.type === 'model' && (
                  <span className={styles.suggestionIcon}>🎨</span>
                )}
                <span className={styles.suggestionText}>{suggestion.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className={styles.quickFilters}>
        <button
          type="button"
          onClick={() => handleFilterChange('canPrint', 'true')}
          className={`${styles.quickFilter} ${filters.canPrint === 'true' ? styles.active : ''}`}
        >
          Printable
        </button>
        <button
          type="button"
          onClick={() => handleFilterChange('canPrint', 'false')}
          className={`${styles.quickFilter} ${filters.canPrint === 'false' ? styles.active : ''}`}
        >
          Not Printable
        </button>
        <button
          type="button"
          onClick={() => handleFilterChange('hasRequirements', 'true')}
          className={`${styles.quickFilter} ${filters.hasRequirements === 'true' ? styles.active : ''}`}
        >
          Has Requirements
        </button>
      </div>

      {/* Advanced Filters Toggle */}
      {showAdvanced && (
        <div className={styles.advancedToggle}>
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={styles.toggleButton}
          >
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
            {activeFiltersCount > 0 && (
              <span className={styles.filterCount}>{activeFiltersCount}</span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className={styles.clearFilters}
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && showAdvancedFilters && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterGrid}>
            {/* Category Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="category-filter">Category</label>
              <select
                id="category-filter"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="difficulty-filter">Difficulty</label>
              <select
                id="difficulty-filter"
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Print Time Range */}
            <div className={styles.filterGroup}>
              <label htmlFor="min-print-time">Min Print Time (min)</label>
              <input
                type="number"
                id="min-print-time"
                value={filters.minPrintTime}
                onChange={(e) => handleFilterChange('minPrintTime', e.target.value)}
                placeholder="0"
                min="0"
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="max-print-time">Max Print Time (min)</label>
              <input
                type="number"
                id="max-print-time"
                value={filters.maxPrintTime}
                onChange={(e) => handleFilterChange('maxPrintTime', e.target.value)}
                placeholder="∞"
                min="0"
                className={styles.filterInput}
              />
            </div>

            {/* Requirements Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="requirements-filter">Requirements</label>
              <select
                id="requirements-filter"
                value={filters.hasRequirements}
                onChange={(e) => handleFilterChange('hasRequirements', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All</option>
                <option value="true">Has Requirements</option>
                <option value="false">No Requirements</option>
              </select>
            </div>

            {/* Sort Options */}
            {showSortOptions && (
              <div className={styles.filterGroup}>
                <label htmlFor="sort-by">Sort By</label>
                <select
                  id="sort-by"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="name">Name</option>
                  <option value="category">Category</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="printTime">Print Time</option>
                  <option value="created">Created Date</option>
                  <option value="updated">Last Updated</option>
                  <option value="requirementCount">Requirements</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className={styles.resultsSummary}>
        <span className={styles.resultsCount}>
          {filteredAndSortedModels.length} of {models.length} models
        </span>
        {(searchQuery || activeFiltersCount > 0) && (
          <span className={styles.activeFilters}>
            • {searchQuery && `"${searchQuery}"`}
            {filters.category && ` category: ${filters.category}`}
            {filters.difficulty && ` difficulty: ${filters.difficulty}`}
            {filters.canPrint && ` printable: ${filters.canPrint}`}
          </span>
        )}
      </div>
    </Component>
  )
}

// Preset filter configurations
export const MODEL_FILTER_PRESETS = {
  all: {
    name: 'All Models',
    filters: {}
  },
  printable: {
    name: 'Printable Only',
    filters: { canPrint: 'true' }
  },
  easy: {
    name: 'Easy Prints',
    filters: { difficulty: 'Easy', canPrint: 'true' }
  },
  quickPrints: {
    name: 'Quick Prints',
    filters: { maxPrintTime: '60', canPrint: 'true', sortBy: 'printTime' }
  },
  withRequirements: {
    name: 'With Requirements',
    filters: { hasRequirements: 'true' }
  }
}

// Filter preset button component
export const FilterPresets = ({ activePreset, onPresetChange, availablePresets = [] }) => {
  const presets = availablePresets.length > 0 ? availablePresets : Object.values(MODEL_FILTER_PRESETS)

  return (
    <div className={styles.filterPresets}>
      <span className={styles.presetsLabel}>Quick Filters:</span>
      <div className={styles.presetButtons}>
        {presets.map((preset, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onPresetChange?.(preset.filters)}
            className={`${styles.presetButton} ${activePreset === preset.name ? styles.active : ''}`}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ModelSearch