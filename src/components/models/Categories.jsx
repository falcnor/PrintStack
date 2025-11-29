import React, { useState } from 'react'
import { useModels } from '../../contexts/ModelContext.js'
import ErrorMessage from '../common/ErrorMessage.jsx'
import styles from './Categories.module.css'

const Categories = () => {
  const { categories, models, actions } = useModels()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [error, setError] = useState('')

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required')
      return
    }

    if (actions.addCategory(newCategoryName)) {
      setNewCategoryName('')
      setShowAddForm(false)
      setError('')
    } else {
      setError('Failed to add category')
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategory({ ...category })
    setError('')
  }

  const handleUpdateCategory = () => {
    if (!editingCategory.name.trim()) {
      setError('Category name is required')
      return
    }

    if (actions.updateCategory(editingCategory.id, editingCategory.name)) {
      setEditingCategory(null)
      setError('')
    } else {
      setError('Failed to update category')
    }
  }

  const handleDeleteCategory = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    const categoryModelsCount = models.filter(model => model.category === category.name).length

    if (window.confirm(
      `Are you sure you want to delete "${category.name}"? ${categoryModelsCount > 0
        ? `This will uncategorize ${categoryModelsCount} model(s).`
        : 'No models are using this category.'}`
    )) {
      if (!actions.deleteCategory(categoryId)) {
        setError('Failed to delete category')
      }
    }
  }

  const getCategoryUsage = (categoryName) => {
    return models.filter(model => model.category === categoryName).length
  }

  const cancelEdit = () => {
    setEditingCategory(null)
    setError('')
  }

  return (
    <div className={styles.categories}>
      <div className={styles.header}>
        <h2>Manage Categories</h2>
        <button
          className={styles.addButton}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Category'}
        </button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError('')}
        />
      )}

      {/* Add Category Form */}
      {showAddForm && (
        <div className={styles.addForm}>
          <div className={styles.formGroup}>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              className={styles.categoryInput}
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
              className={styles.saveButton}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className={styles.categoryList}>
        {categories.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No categories found</p>
            <p>Create your first category to organize your models.</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className={styles.categoryItem}>
              {editingCategory?.id === category.id ? (
                // Edit mode
                <div className={styles.editForm}>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className={styles.categoryInput}
                  />
                  <div className={styles.editActions}>
                    <button
                      onClick={handleUpdateCategory}
                      className={styles.saveButton}
                    >
                      ✓ Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className={styles.cancelButton}
                    >
                      × Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className={styles.categoryContent}>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.usageCount}>
                      {getCategoryUsage(category.name)} models
                    </span>
                  </div>
                  <div className={styles.categoryActions}>
                    <button
                      onClick={() => handleEditCategory(category)}
                      className={styles.editButton}
                      title={`Edit ${category.name}`}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className={styles.deleteButton}
                      title={`Delete ${category.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Category Statistics */}
      {categories.length > 0 && (
        <div className={styles.statistics}>
          <h3>Category Statistics</h3>
          <div className={styles.statsGrid}>
            {categories.map((category) => {
              const usage = getCategoryUsage(category.name)
              const percentage = models.length > 0 ? (usage / models.length) * 100 : 0
              return (
                <div key={category.id} className={styles.statItem}>
                  <div className={styles.statName}>{category.name}</div>
                  <div className={styles.statDetails}>
                    <span className={styles.statCount}>{usage} models</span>
                    <span className={styles.statPercentage}>({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className={styles.totalStats}>
            <div className={styles.totalItem}>
              <strong>{categories.length}</strong> categories total
            </div>
            <div className={styles.totalItem}>
              <strong>{models.length}</strong> models categorized
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories