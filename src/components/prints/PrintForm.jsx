import React, { useState, useEffect } from 'react'
import { usePrints } from '../../contexts/PrintContext.js'
import { useModels } from '../../contexts/ModelContext.js'
import { useFilaments } from '../../contexts/FilamentContext.js'
import styles from './PrintForm.module.css'

const PrintForm = ({ print, onSubmit, onCancel }) => {
  const { validatePrint } = usePrints()
  const { models } = useModels()
  const { filaments } = useFilaments()

  // Form state
  const [formData, setFormData] = useState({
    modelId: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    qualityRating: '',
    notes: '',
    duration: '',
    filamentUsages: []
  })

  const [errors, setErrors] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)

  // Initialize form data when editing
  useEffect(() => {
    if (print) {
      setFormData({
        modelId: print.modelId || '',
        date: print.date ? print.date.split('T')[0] : new Date().toISOString().split('T')[0],
        qualityRating: print.qualityRating || '',
        notes: print.notes || '',
        duration: print.duration || '',
        filamentUsages: print.filamentUsages || []
      })

      if (print.modelId) {
        const model = models.find(m => m.id === print.modelId)
        setSelectedModel(model)
      }
    }
  }, [print, models])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === 'modelId') {
      const model = models.find(m => m.id === value)
      setSelectedModel(model)

      // Auto-populate filament requirements based on model
      if (model && model.requirements) {
        const filamentUsages = model.requirements.map(req => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2),
          filamentId: req.filamentId,
          materialType: req.materialType,
          actualWeight: ''
        }))
        setFormData(prev => ({
          ...prev,
          [name]: value,
          filamentUsages
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          filamentUsages: []
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const addFilamentUsage = () => {
    setFormData(prev => ({
      ...prev,
      filamentUsages: [...prev.filamentUsages, {
        id: Date.now().toString(),
        filamentId: '',
        materialType: '',
        actualWeight: ''
      }]
    }))
  }

  const updateFilamentUsage = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      filamentUsages: prev.filamentUsages.map((usage, i) =>
        i === index ? { ...usage, [field]: value } : usage
      )
    }))
  }

  const removeFilamentUsage = (index) => {
    setFormData(prev => ({
      ...prev,
      filamentUsages: prev.filamentUsages.filter((_, i) => i !== index)
    }))
  }

  const calculateTotalWeight = () => {
    return formData.filamentUsages.reduce((total, usage) => {
      const weight = parseFloat(usage.actualWeight) || 0
      return total + weight
    }, 0)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Process form data
    const processedData = {
      ...formData,
      duration: formData.duration ? parseFloat(formData.duration) : null,
      filamentUsages: formData.filamentUsages.map(usage => ({
        ...usage,
        actualWeight: usage.actualWeight ? parseFloat(usage.actualWeight) : null
      }))
    }

    // Validate form data
    const validation = validatePrint(processedData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    onSubmit(processedData)
  }

  const availableFilaments = selectedModel?.requirements?.map(req => {
    const filament = filaments.find(f => f.id === req.filamentId)
    return {
      ...req,
      filament,
      available: filament?.inStock || false
    }
  }) || []

  return (
    <form onSubmit={handleSubmit} className={styles.printForm}>
      {errors.length > 0 && (
        <div className={styles.errors}>
          {errors.map((error, index) => (
            <div key={index} className={styles.error}>{error}</div>
          ))}
        </div>
      )}

      {/* Model Selection */}
      <div className={styles.section}>
        <h3>Print Information</h3>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="modelId">Model *</label>
            <select
              id="modelId"
              name="modelId"
              value={formData.modelId}
              onChange={handleInputChange}
              required
              className={styles.modelSelect}
            >
              <option value="">Select a model...</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.category})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="date">Print Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              max={new Date().toISOString().split('T')[0]} // Cannot select future dates
            />
          </div>
        </div>

        {selectedModel && (
          <div className={styles.modelInfo}>
            <h4>Model Information</h4>
            <div className={styles.modelDetails}>
              <p><strong>Category:</strong> {selectedModel.category}</p>
              <p><strong>Difficulty:</strong> {selectedModel.difficulty}</p>
              <p><strong>Estimated Time:</strong> {selectedModel.printTime} minutes</p>
              <p><strong>Can Print:</strong> {availableFilaments.every(f => f.available) ? '✓ Yes' : '✗ No, missing filament'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Print Quality */}
      <div className={styles.section}>
        <h3>Print Quality</h3>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="qualityRating">Quality Rating</label>
            <select
              id="qualityRating"
              name="qualityRating"
              value={formData.qualityRating}
              onChange={handleInputChange}
            >
              <option value="">Select quality...</option>
              <option value="excellent">Excellent - Perfect print</option>
              <option value="good">Good - Minor issues</option>
              <option value="fair">Fair - Noticeable flaws</option>
              <option value="poor">Poor - Major issues failed</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="duration">Actual Print Time (hours)</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="2.5"
            />
          </div>
        </div>
      </div>

      {/* Filament Usages */}
      <div className={styles.section}>
        <h3>Filament Usages</h3>
        {formData.filamentUsages.length === 0 ? (
          <div className={styles.noFilaments}>
            <p>No filament usages added</p>
            {availableFilaments.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const usages = availableFilaments.map(req => ({
                    id: Date.now().toString() + Math.random().toString(36).substr(2),
                    filamentId: req.filamentId,
                    materialType: req.materialType,
                    actualWeight: ''
                  }))
                  setFormData(prev => ({ ...prev, filamentUsages: usages }))
                }}
                className={styles.autoPopulateButton}
              >
                Auto-populate from Model Requirements
              </button>
            )}
          </div>
        ) : (
          <div className={styles.filamentUsages}>
            {formData.filamentUsages.map((usage, index) => {
              const filament = availableFilaments.find(f => f.filamentId === usage.filamentId)?.filament
              return (
                <div key={usage.id} className={styles.filamentUsage}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Filament *</label>
                      <select
                        value={usage.filamentId}
                        onChange={(e) => updateFilamentUsage(index, 'filamentId', e.target.value)}
                        required
                      >
                        <option value="">Select Filament...</option>
                        {availableFilaments.map(req => (
                          <option
                            key={req.filamentId}
                            value={req.filamentId}
                            disabled={!req.available}
                            className={!req.available ? styles.disabled : ''}
                          >
                            {req.filament ? (
                              `${req.filament.colorName || req.filament.color} (${req.materialType}) - ${req.filament.brand}`
                            ) : (
                              `${req.materialType} - Not Available`
                            )}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Material Type *</label>
                      <input
                        type="text"
                        value={usage.materialType}
                        onChange={(e) => updateFilamentUsage(index, 'materialType', e.target.value)}
                        placeholder="PLA, PETG, etc."
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Actual Weight (g) *</label>
                      <input
                        type="number"
                        value={usage.actualWeight}
                        onChange={(e) => updateFilamentUsage(index, 'actualWeight', e.target.value)}
                        min="0"
                        step="0.1"
                        placeholder="10.5"
                        required
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFilamentUsage(index)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>

                  {filament && (
                    <div className={styles.filamentInfo}>
                      <span className={styles.filamentDetails}>
                        {filament.colorName || filament.color} ({filament.materialType}) - {filament.brand}
                      </span>
                      {filament.weight && (
                        <span className={styles.remainingWeight}>
                          {filament.weight}g available
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={addFilamentUsage}
          className={styles.addButton}
        >
          + Add Filament Usage
        </button>

        {/* Total Weight Display */}
        {formData.filamentUsages.length > 0 && (
          <div className={styles.totalWeight}>
            <strong>Total Weight Used:</strong> {calculateTotalWeight().toFixed(1)}g
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className={styles.section}>
        <h3>Additional Notes</h3>
        <div className={styles.formGroup}>
          <label htmlFor="notes">Print Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            placeholder="Notes about print settings, issues, or observations"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        <button type="submit" className={styles.submitButton}>
          {print ? 'Update Print' : 'Record Print'}
        </button>
      </div>
    </form>
  )
}

export default PrintForm