import React, { useState, useEffect } from 'react'
import { useModels } from '../../contexts/ModelContext.js'
import styles from './ModelForm.module.css'

const ModelForm = ({ model, categories, onSubmit, onCancel }) => {
  const { actions, validateModel } = useModels()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    category: '',
    difficulty: 'Easy',
    printTime: '',
    layerHeight: '',
    infill: '',
    supportsRequired: false,
    requirements: [],
    notes: ''
  })

  const [errors, setErrors] = useState([])

  // Initialize form data when editing or categories load
  useEffect(() => {
    if (model) {
      setFormData({
        name: model.name || '',
        link: model.link || '',
        category: model.category || '',
        difficulty: model.difficulty || 'Easy',
        printTime: model.printTime || '',
        layerHeight: model.layerHeight || '',
        infill: model.infill || '',
        supportsRequired: model.supportsRequired || false,
        requirements: model.requirements || [],
        notes: model.notes || ''
      })
    } else if (categories.length > 0) {
      setFormData(prev => ({
        ...prev,
        category: categories[0].name || ''
      }))
    }
  }, [model, categories])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, {
        id: Date.now().toString(),
        filamentId: '',
        materialType: '',
        expectedWeight: ''
      }]
    }))
  }

  const updateRequirement = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? { ...req, [field]: value } : req
      )
    }))
  }

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Convert string numbers to actual numbers
    const processedData = {
      ...formData,
      printTime: formData.printTime ? parseFloat(formData.printTime) : null,
      layerHeight: formData.layerHeight ? parseFloat(formData.layerHeight) : null,
      infill: formData.infill ? parseFloat(formData.infill) : null,
      requirements: formData.requirements.map(req => ({
        ...req,
        expectedWeight: req.expectedWeight ? parseFloat(req.expectedWeight) : null
      }))
    }

    // Validate form data
    const validation = validateModel(processedData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    onSubmit(processedData)
  }

  const getAvailableFilaments = () => {
    try {
      return JSON.parse(localStorage.getItem('printstack_filaments') || '[]')
    } catch {
      return []
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.modelForm}>
      {errors.length > 0 && (
        <div className={styles.errors}>
          {errors.map((error, index) => (
            <div key={index} className={styles.error}>{error}</div>
          ))}
        </div>
      )}

      {/* Basic Information */}
      <div className={styles.section}>
        <h3>Basic Information</h3>
        <div className={styles.formGroup}>
          <label htmlFor="name">Model Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter model name"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="link">Source URL / Notes</label>
          <input
            type="text"
            id="link"
            name="link"
            value={formData.link}
            onChange={handleInputChange}
            placeholder="https://example.com/model or notes"
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              {categories.map(category => (
                <option key={category.id || category} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="difficulty">Difficulty *</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
              required
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Print Settings */}
      <div className={styles.section}>
        <h3>Recommended Print Settings</h3>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="printTime">Estimated Print Time (minutes)</label>
            <input
              type="number"
              id="printTime"
              name="printTime"
              value={formData.printTime}
              onChange={handleInputChange}
              min="0"
              max="1440"
              placeholder="120"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="layerHeight">Recommended Layer Height (mm)</label>
            <input
              type="number"
              id="layerHeight"
              name="layerHeight"
              value={formData.layerHeight}
              onChange={handleInputChange}
              min="0.05"
              max="1.0"
              step="0.05"
              placeholder="0.2"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="infill">Recommended Infill (%)</label>
            <input
              type="number"
              id="infill"
              name="infill"
              value={formData.infill}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="5"
              placeholder="20"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="supportsRequired"
                checked={formData.supportsRequired}
                onChange={handleInputChange}
              />
              Supports Required
            </label>
          </div>
        </div>
      </div>

      {/* Required Filaments */}
      <div className={styles.section}>
        <h3>Required Filaments</h3>
        {formData.requirements.length === 0 ? (
          <p className={styles.noRequirements}>No filament requirements added</p>
        ) : (
          <div className={styles.requirements}>
            {formData.requirements.map((requirement, index) => (
              <div key={requirement.id} className={styles.requirement}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Filament *</label>
                    <select
                      value={requirement.filamentId}
                      onChange={(e) => updateRequirement(index, 'filamentId', e.target.value)}
                      required
                    >
                      <option value="">Select Filament...</option>
                      {getAvailableFilaments().map(filament => (
                        <option key={filament.id} value={filament.id}>
                          {filament.colorName || filament.color} ({filament.materialType}) - {filament.brand}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Material Type *</label>
                    <input
                      type="text"
                      value={requirement.materialType}
                      onChange={(e) => updateRequirement(index, 'materialType', e.target.value)}
                      placeholder="PLA, PETG, etc."
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Expected Weight (g)</label>
                    <input
                      type="number"
                      value={requirement.expectedWeight}
                      onChange={(e) => updateRequirement(index, 'expectedWeight', e.target.value)}
                      min="0"
                      step="0.1"
                      placeholder="10.5"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addRequirement}
          className={styles.addButton}
        >
          + Add Filament Requirement
        </button>
      </div>

      {/* Notes */}
      <div className={styles.section}>
        <h3>Additional Notes</h3>
        <div className={styles.formGroup}>
          <label htmlFor="notes">Printing Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            placeholder="Additional printing notes, tips, or observations"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.cancelButton}>
          Cancel
        </button>
        <button type="submit" className={styles.submitButton}>
          {model ? 'Update Model' : 'Add Model'}
        </button>
      </div>
    </form>
  )
}

export default ModelForm