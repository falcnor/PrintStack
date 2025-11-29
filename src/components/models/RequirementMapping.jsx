import React, { useState, useEffect } from 'react'
import { useFilaments } from '../../contexts/FilamentContext.js'
import styles from './RequirementMapping.module.css'

const RequirementMapping = ({
  requirements = [],
  onChange,
  requirementsFromModel = null,
  isPrintForm = false,
  allowAddRemove = true
}) => {
  const { filaments } = useFilaments()
  const [localRequirements, setLocalRequirements] = useState([])

  // Initialize with provided requirements
  useEffect(() => {
    const initialRequirements = requirements.map((req, index) => ({
      id: req.id || `req-${Date.now()}-${index}`,
      filamentId: req.filamentId || '',
      materialType: req.materialType || '',
      expectedWeight: isPrintForm ? null : (req.expectedWeight || ''),
      actualWeight: isPrintForm ? (req.actualWeight || '') : null
    }))
    setLocalRequirements(initialRequirements)
  }, [requirements, isPrintForm])

  // Auto-populate from model requirements if provided
  useEffect(() => {
    if (requirementsFromModel && requirementsFromModel.length > 0 && localRequirements.length === 0 && allowAddRemove) {
      const autoRequirements = requirementsFromModel.map((req, index) => ({
        id: `req-auto-${Date.now()}-${index}`,
        filamentId: req.filamentId || '',
        materialType: req.materialType || '',
        expectedWeight: isPrintForm ? null : req.expectedWeight,
        actualWeight: isPrintForm ? '' : null
      }))
      setLocalRequirements(autoRequirements)
      onChange(autoRequirements)
    }
  }, [requirementsFromModel, isPrintForm, allowAddRemove, onChange])

  const addRequirement = () => {
    const newRequirement = {
      id: `req-new-${Date.now()}`,
      filamentId: '',
      materialType: '',
      expectedWeight: isPrintForm ? null : '',
      actualWeight: isPrintForm ? '' : null
    }
    setLocalRequirements(prev => [...prev, newRequirement])
    if (onChange) {
      onChange([...localRequirements, newRequirement])
    }
  }

  const updateRequirement = (index, field, value) => {
    const updatedRequirements = localRequirements.map((req, i) =>
      i === index ? { ...req, [field]: value } : req
    )
    setLocalRequirements(updatedRequirements)
    if (onChange) {
      onChange(updatedRequirements)
    }

    // Auto-sync material type when filament changes
    if (field === 'filamentId' && value) {
      const filament = filaments.find(f => f.id === value)
      if (filament && filament.materialType) {
        const finalRequirements = updatedRequirements.map((req, i) =>
          i === index ? { ...req, materialType: filament.materialType } : req
        )
        setLocalRequirements(finalRequirements)
        if (onChange) {
          onChange(finalRequirements)
        }
      }
    }
  }

  const removeRequirement = (index) => {
    const updatedRequirements = localRequirements.filter((_, i) => i !== index)
    setLocalRequirements(updatedRequirements)
    if (onChange) {
      onChange(updatedRequirements)
    }
  }

  const getAvailableFilaments = (requirementIndex) => {
    if (isPrintForm) {
      // For print forms, show available filaments (in stock)
      return filaments.filter(f => f.inStock)
    } else {
      // For model forms, show all filaments
      return filaments
    }
  }

  const getFilamentName = (filamentId) => {
    const filament = filaments.find(f => f.id === filamentId)
    if (!filament) return 'Unknown Filament'
    return `${filament.colorName || filament.color} (${filament.materialType}) - ${filament.brand}`
  }

  const calculateTotalWeight = () => {
    return localRequirements.reduce((total, req) => {
      const weight = isPrintForm
        ? parseFloat(req.actualWeight) || 0
        : parseFloat(req.expectedWeight) || 0
      return total + weight
    }, 0)
  }

  const validateRequirements = () => {
    const errors = []

    localRequirements.forEach((req, index) => {
      if (!req.filamentId) {
        errors.push(`Filament is required for requirement ${index + 1}`)
      }
      if (!req.materialType || req.materialType.trim() === '') {
        errors.push(`Material type is required for requirement ${index + 1}`)
      }

      const weightField = isPrintForm ? req.actualWeight : req.expectedWeight
      if (weightField && (isNaN(parseFloat(weightField)) || parseFloat(weightField) <= 0)) {
        errors.push(`Weight must be a positive number for requirement ${index + 1}`)
      }
    })

    return errors
  }

  return (
    <div className={styles.requirementMapping}>
      <div className={styles.header}>
        <h3>
          {isPrintForm ? 'Filament Usages' : 'Required Filaments'}
        </h3>
        <div className={styles.stats}>
          <span className={styles.totalCount}>
            {localRequirements.length} {isPrintForm ? 'usages' : 'requirements'}
          </span>
          {!isPrintForm && (
            <span className={styles.totalWeight}>
              Total: {calculateTotalWeight().toFixed(1)}g
            </span>
          )}
        </div>
      </div>

      {localRequirements.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            {isPrintForm
              ? 'No filament usages recorded'
              : 'No filament requirements specified'
            }
          </p>
          {requirementsFromModel && requirementsFromModel.length > 0 && (
            <button
              type="button"
              onClick={addRequirement}
              className={styles.autoPopulateButton}
            >
              Auto-populate from Model Requirements
            </button>
          )}
        </div>
      ) : (
        <div className={styles.requirements}>
          {localRequirements.map((req, index) => {
            const availableFilaments = getAvailableFilaments(index)
            const selectedFilament = filaments.find(f => f.id === req.filamentId)

            return (
              <div key={req.id} className={styles.requirement}>
                <div className={styles.requirementHeader}>
                  <span className={styles.requirementNumber}>
                    {isPrintForm ? 'Usage' : 'Requirement'} {index + 1}
                  </span>
                  {allowAddRemove && (
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className={styles.removeButton}
                      title={`Remove ${isPrintForm ? 'usage' : 'requirement'} ${index + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className={styles.requirementFields}>
                  <div className={styles.fieldGroup}>
                    <label>Filament *</label>
                    <select
                      value={req.filamentId}
                      onChange={(e) => updateRequirement(index, 'filamentId', e.target.value)}
                      className={`${styles.select} ${selectedFilament?.inStock === false ? styles.outOfStock : ''}`}
                      required
                    >
                      <option value="">Select filament...</option>
                      {availableFilaments.map(filament => (
                        <option key={filament.id} value={filament.id}>
                          {getFilamentName(filament.id)}
                          {isPrintForm && !filament.inStock && ' (Out of Stock)'}
                        </option>
                      ))}
                    </select>
                    {selectedFilament && !selectedFilament.inStock && (
                      <div className={styles.outOfStockWarning}>
                        ⚠️ This filament is out of stock
                      </div>
                    )}
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>Material Type *</label>
                    <input
                      type="text"
                      value={req.materialType}
                      onChange={(e) => updateRequirement(index, 'materialType', e.target.value)}
                      placeholder="PLA, PETG, etc."
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>
                      {isPrintForm ? 'Actual Weight (g) *' : 'Expected Weight (g)'}
                    </label>
                    <input
                      type="number"
                      value={isPrintForm ? req.actualWeight : req.expectedWeight}
                      onChange={(e) => updateRequirement(
                        index,
                        isPrintForm ? 'actualWeight' : 'expectedWeight',
                        e.target.value
                      )}
                      placeholder="10.5"
                      step="0.1"
                      min="0"
                      className={styles.input}
                      required={!isPrintForm}
                    />
                  </div>
                </div>

                {/* Selected filament details */}
                {selectedFilament && (
                  <div className={styles.filamentDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Brand:</span>
                      <span className={styles.detailValue}>{selectedFilament.brand}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Color:</span>
                      <div className={styles.colorDisplay}>
                        <span
                          className={styles.colorSwatch}
                          style={{ backgroundColor: selectedFilament.colorHex || '#ccc' }}
                        />
                        <span>{selectedFilament.colorName || selectedFilament.color}</span>
                      </div>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Available:</span>
                      <span className={styles.detailValue}>
                        {selectedFilament.weight ? `${selectedFilament.weight}g` : 'Unknown'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Total Weight Summary */}
          {localRequirements.length > 0 && (
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>
                  {isPrintForm ? 'Total Used:' : 'Total Required:'}
                </span>
                <span className={styles.summaryValue}>
                  {calculateTotalWeight().toFixed(1)}g
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Requirement Button */}
      {allowAddRemove && (
        <button
          type="button"
          onClick={addRequirement}
          className={styles.addButton}
        >
          + Add {isPrintForm ? 'Filament Usage' : 'Filament Requirement'}
        </button>
      )}

      {/* Validation Helper */}
      <div className={styles.validationHelper}>
        {(() => {
          const errors = validateRequirements()
          if (errors.length === 0) return null
          return (
            <div className={styles.validationErrors}>
              {errors.map((error, index) => (
                <div key={index} className={styles.error}>{error}</div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default RequirementMapping