import React, { useState, useEffect } from 'react'
import styles from './MaterialTypes.module.css'

const DEFAULT_MATERIALS = [
  { name: 'PLA', description: 'Easy to print, low warping', temperature: '190-220°C', colors: 'Wide variety' },
  { name: 'PETG', description: 'Strong and durable, chemical resistant', temperature: '230-250°C', colors: 'Wide variety' },
  { name: 'ABS', description: 'Very strong, high temp resistance', temperature: '230-260°C', colors: 'Wide variety' },
  { name: 'TPU', description: 'Flexible, rubber-like', temperature: '210-230°C', colors: 'Limited' },
  { name: 'Wood', description: 'Wood-like appearance, sandable', temperature: '190-220°C', colors: 'Wood tones' },
  { name: 'Carbon Fiber', description: 'Reinforced, very stiff', temperature: '200-240°C', colors: 'Black/Grey' },
  { name: 'Metal', description: 'Metallic appearance, heavy', temperature: '200-230°C', colors: 'Metallic' },
  { name: 'Silk', description: 'Shiny, iridescent finish', temperature: '190-220°C', colors: 'Pearlescent' },
  { name: 'Glow', description: 'Glows in the dark', temperature: '190-220°C', colors: 'Neon' },
  { name: 'Other', description: 'Custom or specialty materials', temperature: 'Varies', colors: 'Various' }
]

const MaterialTypes = ({ selectedMaterial, onMaterialChange, showInfo = false }) => {
  const [materials, setMaterials] = useState([])
  const [customMaterials, setCustomMaterials] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ name: '', description: '', temperature: '', colors: '' })

  useEffect(() => {
    // Load custom materials from localStorage
    const stored = localStorage.getItem('printstack_custom_materials')
    if (stored) {
      try {
        setCustomMaterials(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to load custom materials:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Combine default and custom materials
    setMaterials([...DEFAULT_MATERIALS, ...customMaterials])
  }, [customMaterials])

  const handleAddMaterial = () => {
    if (!newMaterial.name.trim()) return

    const materialToAdd = {
      name: newMaterial.name.trim(),
      description: newMaterial.description.trim() || 'Custom material',
      temperature: newMaterial.temperature.trim() || 'Varies',
      colors: newMaterial.colors.trim() || 'Various'
    }

    const updatedCustom = [...customMaterials, materialToAdd]
    setCustomMaterials(updatedCustom)
    localStorage.setItem('printstack_custom_materials', JSON.stringify(updatedCustom))

    // Reset form
    setNewMaterial({ name: '', description: '', temperature: '', colors: '' })
    setShowAddForm(false)

    // Select the newly added material
    if (onMaterialChange) {
      onMaterialChange(materialToAdd.name)
    }
  }

  const handleDeleteCustomMaterial = (materialName) => {
    const updated = customMaterials.filter(m => m.name !== materialName)
    setCustomMaterials(updated)
    localStorage.setItem('printstack_custom_materials', JSON.stringify(updated))

    // If this was the selected material, clear selection
    if (selectedMaterial === materialName && onMaterialChange) {
      onMaterialChange('PLA')
    }
  }

  const getDefaultMaterialInfo = (materialName) => {
    const material = materials.find(m => m.name === materialName)
    return material || DEFAULT_MATERIALS.find(m => m.name === 'PLA')
  }

  if (showInfo && selectedMaterial) {
    const materialInfo = getDefaultMaterialInfo(selectedMaterial)
    return (
      <div className={styles.materialInfo}>
        <h4>{selectedMaterial}</h4>
        <p className={styles.description}>{materialInfo.description}</p>
        <div className={styles.details}>
          <span className={styles.detail}>
            <strong>Temperature:</strong> {materialInfo.temperature}
          </span>
          <span className={styles.detail}>
            <strong>Colors:</strong> {materialInfo.colors}
          </span>
        </div>
      </div>
    )
  }

  if (!onMaterialChange) {
    // View-only mode for managing materials
    return (
      <div className={styles.materialManager}>
        <h3>Material Types</h3>

        <div className={styles.materialsList}>
          <div className={styles.section}>
            <h4>Default Materials</h4>
            <div className={styles.materialGrid}>
              {DEFAULT_MATERIALS.map(material => (
                <div key={material.name} className={styles.materialCard}>
                  <h5>{material.name}</h5>
                  <p>{material.description}</p>
                  <span className={styles.temp}>{material.temperature}</span>
                </div>
              ))}
            </div>
          </div>

          {customMaterials.length > 0 && (
            <div className={styles.section}>
              <h4>Custom Materials</h4>
              <div className={styles.materialGrid}>
                {customMaterials.map(material => (
                  <div key={material.name} className={styles.materialCard}>
                    <div className={styles.customHeader}>
                      <h5>{material.name}</h5>
                      <button
                        onClick={() => handleDeleteCustomMaterial(material.name)}
                        className={styles.deleteButton}
                        title="Remove custom material"
                      >
                        ×
                      </button>
                    </div>
                    <p>{material.description}</p>
                    <span className={styles.temp}>{material.temperature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.addSection}>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className={styles.addButton}
            >
              + Add Custom Material
            </button>
          ) : (
            <div className={styles.addForm}>
              <h4>Add Custom Material</h4>
              <div className={styles.formRow}>
                <input
                  type="text"
                  placeholder="Material name *"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formRow}>
                <input
                  type="text"
                  placeholder="Description"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formRow}>
                <input
                  type="text"
                  placeholder="Temperature range (e.g., 200-230°C)"
                  value={newMaterial.temperature}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, temperature: e.target.value }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formRow}>
                <input
                  type="text"
                  placeholder="Available colors"
                  value={newMaterial.colors}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, colors: e.target.value }))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formActions}>
                <button
                  onClick={() => setShowAddForm(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMaterial}
                  disabled={!newMaterial.name.trim()}
                  className={styles.saveButton}
                >
                  Add Material
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Simple selector mode
  return (
    <div className={styles.materialSelector}>
      <select
        value={selectedMaterial}
        onChange={(e) => onMaterialChange(e.target.value)}
        className={styles.select}
      >
        {materials.map(material => (
          <option key={material.name} value={material.name}>
            {material.name}
          </option>
        ))}
      </select>
      {showInfo && selectedMaterial && (
        <div className={styles.inlineInfo}>
          <small>{getDefaultMaterialInfo(selectedMaterial).description}</small>
        </div>
      )}
    </div>
  )
}

export default MaterialTypes