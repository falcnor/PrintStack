import React, { useState } from 'react'
import { useModels } from '../../contexts/ModelContext.js'
import ModelTable from './ModelTable.jsx'
import ModelForm from './ModelForm.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import ErrorMessage from '../common/ErrorMessage.jsx'
import styles from './ModelList.module.css'

const ModelList = () => {
  const {
    models,
    loading,
    error,
    searchQuery,
    selectedCategory,
    sortBy,
    categories,
    actions
  } = useModels()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingModel, setEditingModel] = useState(null)

  const handleSearch = (e) => {
    actions.setSearchQuery(e.target.value)
  }

  const handleCategoryFilter = (category) => {
    actions.setSelectedCategory(category)
  }

  const handleSort = (sortBy) => {
    actions.setSortBy(sortBy)
  }

  const handleAddModel = () => {
    setEditingModel(null)
    setShowAddForm(true)
  }

  const handleEditModel = (model) => {
    setEditingModel(model)
    setShowAddForm(true)
  }

  const handleCloseForm = () => {
    setShowAddForm(false)
    setEditingModel(null)
  }

  const handleSaveModel = (modelData) => {
    let success
    if (editingModel) {
      success = actions.updateModel({ ...editingModel, ...modelData })
    } else {
      success = actions.addModel(modelData)
    }

    if (success) {
      handleCloseForm()
      actions.clearError()
    }
  }

  const handleDeleteModel = (modelId) => {
    if (window.confirm('Are you sure you want to delete this model? This will also delete all associated print history.')) {
      actions.deleteModel(modelId)
    }
  }

  const uniqueCategories = ['all', ...new Set(categories.map(cat => cat.name))]

  if (loading && models.length === 0) {
    return <LoadingSpinner message="Loading models..." />
  }

  return (
    <div className={styles.modelList}>
      <div className={styles.header}>
        <h1>Models Library</h1>
        <button
          className={styles.addButton}
          onClick={handleAddModel}
        >
          + Add Model
        </button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={actions.clearError}
        />
      )}

      {/* Search and Filter Controls */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label htmlFor="category-filter">Category:</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className={styles.filterSelect}
            >
              {uniqueCategories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="sort-by">Sort by:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="difficulty">Difficulty</option>
              <option value="printTime">Print Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Model Statistics */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Models:</span>
          <span className={styles.statValue}>{models.length}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Printable:</span>
          <span className={styles.statValue}>
            {models.filter(m => m.canPrint).length}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Need Filament:</span>
          <span className={styles.statValue}>
            {models.filter(m => !m.canPrint).length}
          </span>
        </div>
      </div>

      {/* Model Table */}
      <ModelTable
        models={models}
        onEdit={handleEditModel}
        onDelete={handleDeleteModel}
        loading={loading}
      />

      {/* Add/Edit Model Modal */}
      {showAddForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingModel ? 'Edit Model' : 'Add New Model'}</h2>
              <button
                className={styles.closeButton}
                onClick={handleCloseForm}
              >
                ×
              </button>
            </div>
            <ModelForm
              model={editingModel}
              categories={categories}
              onSubmit={handleSaveModel}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelList