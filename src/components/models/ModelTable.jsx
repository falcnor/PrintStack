import React from 'react'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import styles from './ModelTable.module.css'

const ModelTable = ({ models, onEdit, onDelete, loading }) => {
  const getFilamentName = (filamentId) => {
    try {
      const filaments = JSON.parse(localStorage.getItem('printstack_filaments') || '[]')
      const filament = filaments.find(f => f.id === filamentId)
      return filament ? `${filament.colorName || filament.color} (${filament.materialType})` : 'Unknown Filament'
    } catch {
      return 'Unknown Filament'
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return styles.easy
      case 'Medium': return styles.medium
      case 'Hard': return styles.hard
      default: return ''
    }
  }

  const formatPrintTime = (minutes) => {
    if (!minutes) return 'Unknown'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const handleEdit = (model) => {
    onEdit(model)
  }

  const handleDelete = (modelId) => {
    onDelete(modelId)
  }

  return (
    <div className={styles.tableContainer}>
      {loading && models.length === 0 ? (
        <LoadingSpinner message="Loading models..." />
      ) : models.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No models found</p>
          <p>Add your first model to get started!</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.modelTable}>
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th className={styles.numericColumn}>Required Filaments</th>
                <th className={styles.numericColumn}>Est. Time</th>
                <th className={styles.numericColumn}>Can Print?</th>
                <th className={styles.actionsColumn}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id} className={!model.canPrint ? styles.cannotPrint : ''}>
                  <td className={styles.nameCell}>
                    <div className={styles.modelName}>
                      {model.link ? (
                        <a
                          href={model.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.modelLink}
                        >
                          {model.name}
                        </a>
                      ) : (
                        <span>{model.name}</span>
                      )}
                      {model.notes && (
                        <div className={styles.modelNotes} title={model.notes}>
                          {model.notes.length > 50 ? `${model.notes.substring(0, 50)}...` : model.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={styles.category}>{model.category}</span>
                  </td>
                  <td>
                    <span className={`${styles.difficulty} ${getDifficultyColor(model.difficulty)}`}>
                      {model.difficulty}
                    </span>
                  </td>
                  <td className={styles.numericColumn}>
                    <div className={styles.filamentList}>
                      {model.requirements?.length > 0 ? (
                        model.requirements.map((req, index) => {
                          const filamentName = getFilamentName(req.filamentId)
                          return (
                            <div key={req.id || index} className={styles.filamentRequirement}>
                              <span className={styles.filamentName}>
                                {req.materialType}
                              </span>
                              {req.expectedWeight && (
                                <span className={styles.weight}>
                                  ({req.expectedWeight}g)
                                </span>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <span className={styles.noFilaments}>None</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.numericColumn}>
                    {formatPrintTime(model.printTime)}
                  </td>
                  <td className={styles.numericColumn}>
                    <div className={styles.printStatus}>
                      {model.canPrint ? (
                        <span className={`${styles.status} ${styles.printable}`}>
                          ✓ Yes
                        </span>
                      ) : (
                        <span className={`${styles.status} ${styles.notPrintable}`}>
                          ✗ No
                        </span>
                      )}
                    </div>
                    {model.missingFilaments?.length > 0 && (
                      <div className={styles.missingFilaments} title={`Missing: ${model.missingFilaments.map(f => getFilamentName(f.filamentId)).join(', ')}`}>
                        <small>Missing filament</small>
                      </div>
                    )}
                  </td>
                  <td className={styles.actionsColumn}>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleEdit(model)}
                        className={styles.editButton}
                        title={`Edit ${model.name}`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(model.id)}
                        className={styles.deleteButton}
                        title={`Delete ${model.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary statistics */}
      {models.length > 0 && (
        <div className={styles.summary}>
          <div className={styles.summaryStats}>
            <span>
              <strong>{models.length}</strong> total models
            </span>
            <span>
              <strong>{models.filter(m => m.canPrint).length}</strong> printable
            </span>
            <span>
              <strong>{models.filter(m => !m.canPrint).length}</strong> need filament
            </span>
          </div>
          <div className={styles.categoryBreakdown}>
            {Object.entries(
              models.reduce((acc, model) => {
                acc[model.category] = (acc[model.category] || 0) + 1
                return acc
              }, {})
            ).map(([category, count]) => (
              <span key={category} className={styles.categoryTag}>
                {category}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelTable